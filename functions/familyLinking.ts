// functions/familyLinking.ts
// Handles family linking code generation and joining
// Consolidates duplicate code and improves security

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import {
  requireAuth,
  requireParent,
  isParent,
  generateCode,
  sanitizeCode,
  calculateExpiryDate,
  getUserFamilyId,
  getFamily,
  updateEntityWithEnv,
  canUserJoinFamilyWithTier,
  checkRateLimit,
  errorResponse,
  successResponse,
  logError,
  logInfo,
  parseRequestBody,
} from './lib/shared-utils.ts';

/**
 * Generate a new linking code for a family
 */
async function handleGenerateCode(base44: any, user: any, familyId: string) {
  // Verify user is a parent
  if (!user || !isParent(user)) {
    return errorResponse('Only parents can generate linking codes', 403);
  }

  // Rate limit: max 5 code generations per 5 minutes
  const rateLimit = checkRateLimit(user.id, 'generate_linking_code', 5, 5 * 60 * 1000);
  if (!rateLimit.allowed) {
    return errorResponse('Too many code generation requests. Please try again later.', 429);
  }

  // Verify user is in this family
  const userFamilyId = getUserFamilyId(user);
  if (userFamilyId !== familyId) {
    return errorResponse('You can only generate codes for your own family', 403);
  }

  // Get family with environment detection
  const { family, env } = await getFamily(base44, familyId);
  if (!family) {
    return errorResponse('Family not found', 404);
  }

  // Generate new code
  const newCode = generateCode(6);
  const expiresAt = calculateExpiryDate(24); // 24 hours

  // Update family
  await updateEntityWithEnv(
    base44,
    'Family',
    familyId,
    {
      linking_code: newCode,
      linking_code_expires: expiresAt,
    },
    env
  );

  logInfo('familyLinking', 'Generated new linking code', { familyId, userId: user.id });

  return successResponse({
    linkingCode: newCode,
    expiresAt,
  });
}

/**
 * Join a family using a linking code
 */
async function handleJoinFamily(base44: any, user: any, linkingCode: string) {
  // Validate and sanitize code
  const { valid, code: sanitizedCode, error } = sanitizeCode(linkingCode);
  if (!valid) {
    return errorResponse(error);
  }

  // Find family with this linking code
  const families = await base44.asServiceRole.entities.Family.filter({
    linking_code: sanitizedCode,
  });

  if (families.length === 0) {
    return errorResponse('Invalid linking code. Please check and try again.');
  }

  const family = families[0];

  // Check if code is expired
  if (family.linking_code_expires) {
    const expiryDate = new Date(family.linking_code_expires);
    if (expiryDate < new Date()) {
      return errorResponse(
        'This linking code has expired. Please ask your parent for a new code.'
      );
    }
  }

  // Check if user can join (tier-aware)
  const currentMembers = family.members || [];
  const joinCheck = canUserJoinFamilyWithTier(user, family, currentMembers.length);

  if (!joinCheck.allowed) {
    return errorResponse(joinCheck.message, joinCheck.reason === 'already_in_family' ? 409 : 400);
  }

  // Prevent duplicate member entries
  if (currentMembers.includes(user.id)) {
    return errorResponse('You are already a member of this family', 409);
  }

  // Add user to family and update member count
  const updatedMembers = [...currentMembers, user.id];
  await base44.asServiceRole.entities.Family.update(family.id, {
    members: updatedMembers,
    member_count: updatedMembers.length,
  });

  // Update user's family_id
  await base44.auth.updateMe({
    family_id: family.id,
  });

  // Create a Person record for the joining user
  let newPerson = null;
  try {
    const personRole = (user.family_role || 'child').toLowerCase();
    newPerson = await base44.asServiceRole.entities.Person.create({
      name: user.full_name || user.email || 'Family Member',
      family_id: family.id,
      linked_user_id: user.id,
      role: personRole,
      is_active: true,
      points_balance: 0,
      total_points_earned: 0,
      chores_completed_count: 0,
      current_streak: 0,
      best_streak: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (!newPerson || !newPerson.id) {
      throw new Error('Failed to create person record');
    }
  } catch (personError) {
    logError('familyLinking', personError, { context: 'create_person_on_join' });

    // Rollback: remove user from family members
    try {
      await base44.asServiceRole.entities.Family.update(family.id, {
        members: currentMembers,
        member_count: currentMembers.length,
      });
    } catch (rollbackErr) {
      logError('familyLinking', rollbackErr, { context: 'rollback_family_update' });
    }

    // Rollback: clear user's family_id
    try {
      await base44.auth.updateMe({ family_id: null });
    } catch (rollbackErr) {
      logError('familyLinking', rollbackErr, { context: 'rollback_user_update' });
    }

    return errorResponse('Failed to complete family join. Please try again.', 500);
  }

  logInfo('familyLinking', 'User joined family via linking code', {
    userId: user.id,
    familyId: family.id,
    personId: newPerson.id,
  });

  return successResponse({
    familyName: family.name,
    familyId: family.id,
    personId: newPerson.id,
    personRole: newPerson.role,
  });
}

/**
 * Unlink a user's account from a Person record
 * Only parents can unlink, and they cannot unlink the family owner
 */
async function handleUnlinkAccount(base44: any, user: any, personId: string) {
  if (!user || !isParent(user)) {
    return errorResponse('Only parents can unlink accounts', 403);
  }

  if (!personId) {
    return errorResponse('Person ID is required');
  }

  // Get the person record
  let person;
  try {
    person = await base44.asServiceRole.entities.Person.get(personId);
  } catch {
    return errorResponse('Person not found', 404);
  }

  // Verify person is in the same family
  const userFamilyId = getUserFamilyId(user);
  if (person.family_id !== userFamilyId) {
    return errorResponse('You can only unlink members of your own family', 403);
  }

  // Don't allow unlinking if no linked user
  if (!person.linked_user_id) {
    return errorResponse('This person is not linked to any account');
  }

  // Don't allow unlinking the family owner
  const { family } = await getFamily(base44, userFamilyId);
  if (family && person.linked_user_id === family.owner_user_id) {
    return errorResponse('Cannot unlink the family owner\'s account', 403);
  }

  // Clear the linked_user_id on the Person record
  await base44.asServiceRole.entities.Person.update(personId, {
    linked_user_id: null,
  });

  logInfo('familyLinking', 'Account unlinked from person', {
    userId: user.id,
    personId,
    unlinkedUserId: person.linked_user_id,
  });

  return successResponse({
    message: 'Account unlinked successfully',
    personId,
  });
}

/**
 * Get family members list
 */
async function handleGetMembers(base44: any, user: any) {
  const familyId = getUserFamilyId(user);
  if (!familyId) {
    return errorResponse('You are not part of any family');
  }

  const people = await base44.asServiceRole.entities.Person.filter({
    family_id: familyId,
  });

  return successResponse({
    members: people.map((p: any) => ({
      id: p.id,
      name: p.name,
      role: p.role,
      linked_user_id: p.linked_user_id,
      avatar_color: p.avatar_color,
      is_active: p.is_active,
    })),
    count: people.length,
  });
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

    const { action, linkingCode, familyId } = body;

    // Route to appropriate handler
    switch (action) {
      case 'generate':
        if (!familyId) {
          return errorResponse('Family ID required for code generation');
        }
        return await handleGenerateCode(base44, user, familyId);

      case 'join':
        if (!linkingCode) {
          return errorResponse('Linking code required to join family');
        }
        return await handleJoinFamily(base44, user, linkingCode);

      case 'unlink':
        if (!body.personId) {
          return errorResponse('Person ID required for unlinking');
        }
        return await handleUnlinkAccount(base44, user, body.personId);

      case 'getMembers':
        return await handleGetMembers(base44, user);

      default:
        return errorResponse('Invalid action. Use "generate", "join", "unlink", or "getMembers"');
    }
  } catch (error) {
    logError('familyLinking', error);
    return errorResponse('An internal server error occurred', 500);
  }
});
