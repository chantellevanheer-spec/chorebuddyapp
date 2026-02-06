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
  canUserJoinFamily,
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

  // Check if user can join
  const currentMembers = family.members || [];
  const joinCheck = canUserJoinFamily(user, family, currentMembers.length);

  if (!joinCheck.allowed) {
    return errorResponse(joinCheck.message, joinCheck.reason === 'already_in_family' ? 409 : 400);
  }

  // Add user to family
  const updatedMembers = [...currentMembers, user.id];
  await base44.asServiceRole.entities.Family.update(family.id, {
    members: updatedMembers,
  });

  // Update user's family_id
  await base44.auth.updateMe({
    family_id: family.id,
  });

  logInfo('familyLinking', 'User joined family via linking code', {
    userId: user.id,
    familyId: family.id,
  });

  return successResponse({
    familyName: family.name,
    familyId: family.id,
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

      default:
        return errorResponse('Invalid action. Use "generate" or "join"');
    }
  } catch (error) {
    logError('familyLinking', error);
    return errorResponse('An internal server error occurred', 500);
  }
});
