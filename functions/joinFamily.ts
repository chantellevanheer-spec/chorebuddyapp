// functions/joinFamily.ts
// Handles family invitation acceptance and joining
// Improved error handling, validation, and rollback capabilities

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import {
  requireAuth,
  sanitizeCode,
  isValidRole,
  canUserJoinFamily,
  errorResponse,
  successResponse,
  logError,
  logInfo,
  parseRequestBody,
  VALID_ROLES,
} from './lib/shared-utils.ts';

/**
 * Map user role to person role
 */
function mapRoleToPerson(userRole: string): string {
  const normalized = userRole.toLowerCase();
  return VALID_ROLES.includes(normalized) ? normalized : 'child';
}

/**
 * Check for existing person record
 */
async function findExistingPerson(base44: any, familyId: string, userId: string) {
  try {
    const persons = await base44.asServiceRole.entities.Person.filter({
      family_id: familyId,
      linked_user_id: userId,
    });
    return persons.length > 0 ? persons[0] : null;
  } catch (error) {
    logError('joinFamily', error, { context: 'findExistingPerson' });
    return null;
  }
}

/**
 * Atomic join operation with rollback on failure
 */
async function performJoinOperation(
  base44: any,
  user: any,
  family: any,
  role: string
): Promise<{ success: boolean; person?: any; error?: string }> {
  const originalFamilyId = user.family_id;
  let newPerson = null;
  const operationSteps: string[] = [];

  try {
    // Step 1: Create person record
    operationSteps.push('creating_person');
    const personRole = mapRoleToPerson(role);

    newPerson = await base44.asServiceRole.entities.Person.create({
      name: user.full_name || user.email || 'Family Member',
      family_id: family.id,
      linked_user_id: user.id,
      role: personRole,
      points_balance: 0,
      total_points_earned: 0,
      chores_completed_count: 0,
    });

    if (!newPerson || !newPerson.id) {
      throw new Error('Failed to create person record');
    }
    operationSteps.push('person_created');

    // Step 2: Update user record
    operationSteps.push('updating_user');
    await base44.asServiceRole.entities.User.update(user.id, {
      family_id: family.id,
      family_role: role,
      linked_person_id: newPerson.id,
    });
    operationSteps.push('user_updated');

    // Step 3: Add user to family members list
    operationSteps.push('updating_family');
    const currentMembers = family.members || [];

    if (!currentMembers.includes(user.id)) {
      await base44.asServiceRole.entities.Family.update(family.id, {
        members: [...currentMembers, user.id],
        member_count: currentMembers.length + 1,
      });
    }
    operationSteps.push('family_updated');

    return { success: true, person: newPerson };
  } catch (error) {
    logError('joinFamily', error, {
      userId: user.id,
      familyId: family.id,
      operationSteps,
    });

    // Attempt rollback
    await rollbackJoinOperation(base44, newPerson?.id, user.id, family.id, originalFamilyId);

    const userMessage =
      operationSteps.includes('person_created')
        ? 'Failed to complete family join. Your account was not modified.'
        : 'Failed to join family. Please try again.';

    return { success: false, error: userMessage };
  }
}

/**
 * Rollback failed join operation
 */
async function rollbackJoinOperation(
  base44: any,
  personId: string,
  userId: string,
  familyId: string,
  originalFamilyId: string
) {
  const rollbackErrors: string[] = [];

  // Delete person record if created
  if (personId) {
    try {
      await base44.asServiceRole.entities.Person.delete(personId);
    } catch (error) {
      logError('joinFamily', error, { context: 'rollback_delete_person' });
      rollbackErrors.push('person_deletion_failed');
    }
  }

  // Restore user's original family_id
  if (userId && originalFamilyId !== undefined) {
    try {
      await base44.asServiceRole.entities.User.update(userId, {
        family_id: originalFamilyId,
        family_role: null,
        linked_person_id: null,
      });
    } catch (error) {
      logError('joinFamily', error, { context: 'rollback_restore_user' });
      rollbackErrors.push('user_restoration_failed');
    }
  }

  // Remove user from family members
  if (userId && familyId) {
    try {
      const family = await base44.asServiceRole.entities.Family.get(familyId);
      if (family && family.members.includes(userId)) {
        const updatedMembers = family.members.filter((id) => id !== userId);
        await base44.asServiceRole.entities.Family.update(familyId, {
          members: updatedMembers,
          member_count: updatedMembers.length,
        });
      }
    } catch (error) {
      logError('joinFamily', error, { context: 'rollback_family_update' });
      rollbackErrors.push('family_update_failed');
    }
  }

  if (rollbackErrors.length > 0) {
    logError('joinFamily', new Error('Rollback encountered errors'), { rollbackErrors });
  }
}

/**
 * Main handler
 */
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    // Authentication check
    const { user, error: authError } = await requireAuth(base44);
    if (authError) return authError;

    // Parse request body
    const { data: body, error: parseError } = await parseRequestBody(req);
    if (parseError) return parseError;

    const { inviteCode, role = 'child' } = body;

    // Validate invite code
    const { valid, code: sanitizedCode, error: codeError } = sanitizeCode(inviteCode);
    if (!valid) {
      return errorResponse(codeError);
    }

    // Validate role
    if (!isValidRole(role)) {
      return errorResponse(`Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`);
    }

    // Find family with this invite code
    let families;
    try {
      families = await base44.asServiceRole.entities.Family.filter({
        invite_code: sanitizedCode,
      });
    } catch (error) {
      logError('joinFamily', error, { context: 'fetch_family' });
      return errorResponse('Failed to validate invite code. Please try again.', 500);
    }

    if (!families || families.length === 0) {
      return errorResponse('Invalid or expired invite code', 404);
    }

    const family = families[0];

    // Validate family data
    if (!family.id || !family.name) {
      return errorResponse('Invalid family data', 500);
    }

    // Check for existing membership
    const existingPerson = await findExistingPerson(base44, family.id, user.id);

    if (existingPerson) {
      logInfo('joinFamily', 'User already member of family', {
        userId: user.id,
        familyId: family.id,
      });

      return successResponse({
        familyId: family.id,
        familyName: family.name,
        personId: existingPerson.id,
        role: existingPerson.role,
        message: 'You are already a member of this family.',
        alreadyMember: true,
      });
    }

    // Validate user can join
    const currentFamilySize = family.members?.length || 0;
    const joinCheck = canUserJoinFamily(user, family, currentFamilySize);

    if (!joinCheck.allowed) {
      const statusCode = joinCheck.reason === 'already_in_family' ? 409 : 400;
      return errorResponse(joinCheck.message, statusCode);
    }

    // Perform atomic join operation
    const joinResult = await performJoinOperation(base44, user, family, role);

    if (!joinResult.success) {
      return errorResponse(joinResult.error, 500);
    }

    logInfo('joinFamily', 'User successfully joined family', {
      userId: user.id,
      familyId: family.id,
      personId: joinResult.person.id,
    });

    return successResponse({
      familyId: family.id,
      familyName: family.name,
      personId: joinResult.person.id,
      role: joinResult.person.role,
      message: 'Successfully joined the family!',
      alreadyMember: false,
    });
  } catch (error) {
    logError('joinFamily', error, { context: 'main_handler' });

    // Determine appropriate error response
    let statusCode = 500;
    let errorMessage = 'An internal server error occurred.';

    if (error.message?.includes('not authenticated')) {
      statusCode = 401;
      errorMessage = 'Authentication required';
    } else if (error.message?.includes('Invalid')) {
      statusCode = 400;
      errorMessage = error.message;
    }

    return errorResponse(errorMessage, statusCode);
  }
});
