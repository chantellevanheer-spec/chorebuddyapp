// functions/linkAccount.ts
// Consolidated account linking - handles both parent-initiated and code-based linking
// Replaces: linkUserToPerson.ts and linkUserWithCode.ts

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import {
  requireAuth,
  requireParent,
  getUserFamilyId,
  getFamily,
  validateFamilyAccess,
  validateLinkingCode,
  sanitizeCode,
  errorResponse,
  successResponse,
  logError,
  logInfo,
  parseRequestBody,
} from './lib/shared-utils.ts';

/**
 * Parent-initiated account linking
 * Links a specific person to the current user's account
 */
async function handleParentLink(base44: any, user: any, personId: string) {
  if (!personId) {
    return errorResponse('Person ID is required');
  }

  // Get person record
  let person;
  try {
    person = await base44.asServiceRole.entities.Person.get(personId);
  } catch {
    return errorResponse('Person not found or not accessible', 404);
  }

  // Verify user is in the same family
  const familyCheck = validateFamilyAccess(user, person.family_id);
  if (!familyCheck.valid) {
    return errorResponse(familyCheck.error, 403);
  }

  // Check if person is already linked to another user
  if (person.linked_user_id && person.linked_user_id !== user.id) {
    return errorResponse('This family member is already linked to another account');
  }

  // Check if user is already linked to another person
  const existingLink = await base44.asServiceRole.entities.Person.filter({
    linked_user_id: user.id,
    family_id: person.family_id,
  });

  if (existingLink.length > 0 && existingLink[0].id !== personId) {
    return errorResponse('Your account is already linked to another family member');
  }

  // Link the user to the person
  await base44.asServiceRole.entities.Person.update(personId, {
    linked_user_id: user.id,
  });

  logInfo('linkAccount', 'Parent linked account to person', {
    userId: user.id,
    personId,
  });

  return successResponse({
    message: 'Successfully linked your account!',
    personId,
  });
}

/**
 * Code-based account linking
 * Allows user to link using a linking code
 */
async function handleCodeLink(base44: any, user: any, linkingCode: string) {
  // Validate user has a family
  const familyId = getUserFamilyId(user);
  if (!familyId) {
    return errorResponse('You must be part of a family to link accounts');
  }

  // Validate code format
  const { valid, code: sanitizedCode, error } = sanitizeCode(linkingCode);
  if (!valid) {
    return errorResponse(error);
  }

  // Get family
  const { family } = await getFamily(base44, familyId);
  if (!family) {
    return errorResponse('Family not found', 404);
  }

  // Validate linking code
  const codeValidation = validateLinkingCode(family, sanitizedCode);
  if (!codeValidation.valid) {
    return errorResponse(codeValidation.error);
  }

  // Get all unlinked people in the family
  const allPeople = await base44.asServiceRole.entities.Person.filter({
    family_id: familyId,
  });

  const unlinkedPeople = allPeople.filter((p) => !p.linked_user_id);

  if (unlinkedPeople.length === 0) {
    return errorResponse('No available family member profiles to link');
  }

  // Check if user is already linked to a person
  const existingLink = await base44.asServiceRole.entities.Person.filter({
    linked_user_id: user.id,
    family_id: familyId,
  });

  if (existingLink.length > 0) {
    const linkedPerson = existingLink[0];
    return successResponse({
      message: 'Account already linked to this family member',
      personId: linkedPerson.id,
      personName: linkedPerson.name,
      alreadyLinked: true,
    });
  }

  // If only one unlinked person, link automatically
  let personToLink;
  if (unlinkedPeople.length === 1) {
    personToLink = unlinkedPeople[0];
  } else {
    // Return list for user to choose
    return successResponse({
      needsSelection: true,
      unlinkedPeople: unlinkedPeople.map((p) => ({
        id: p.id,
        name: p.name,
        role: p.role,
        avatar_color: p.avatar_color,
      })),
    });
  }

  // Link the user to the person
  await base44.asServiceRole.entities.Person.update(personToLink.id, {
    linked_user_id: user.id,
  });

  // Update user's linked_person_id for easy reference
  await base44.auth.updateMe({
    linked_person_id: personToLink.id,
  });

  logInfo('linkAccount', 'User linked account with code', {
    userId: user.id,
    personId: personToLink.id,
  });

  return successResponse({
    message: 'Successfully linked your account!',
    personId: personToLink.id,
    personName: personToLink.name,
    alreadyLinked: false,
  });
}

/**
 * Manual person selection after code validation
 */
async function handleManualSelection(base44: any, user: any, personId: string) {
  const familyId = getUserFamilyId(user);
  if (!familyId) {
    return errorResponse('You must be part of a family');
  }

  // Get person and verify they're unlinked
  let person;
  try {
    person = await base44.asServiceRole.entities.Person.get(personId);
  } catch {
    return errorResponse('Person not found', 404);
  }

  // Verify same family
  if (person.family_id !== familyId) {
    return errorResponse('Person is not in your family', 403);
  }

  // Check if person is already linked
  if (person.linked_user_id) {
    return errorResponse('This family member is already linked to another account');
  }

  // Check if user is already linked
  const existingLink = await base44.asServiceRole.entities.Person.filter({
    linked_user_id: user.id,
    family_id: familyId,
  });

  if (existingLink.length > 0) {
    return errorResponse('Your account is already linked to another family member');
  }

  // Link the user to the person
  await base44.asServiceRole.entities.Person.update(personId, {
    linked_user_id: user.id,
  });

  await base44.auth.updateMe({
    linked_person_id: personId,
  });

  logInfo('linkAccount', 'User completed manual person selection', {
    userId: user.id,
    personId,
  });

  return successResponse({
    message: 'Successfully linked your account!',
    personId,
    personName: person.name,
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

    const { method, personId, linkingCode } = body;

    // Route to appropriate handler
    switch (method) {
      case 'parent_link':
        // Parent linking their own account to a person
        const { error: parentError } = await requireParent(base44);
        if (parentError) return parentError;
        return await handleParentLink(base44, user, personId);

      case 'code_link':
        // User linking with a code
        if (!linkingCode) {
          return errorResponse('Linking code required for code-based linking');
        }
        return await handleCodeLink(base44, user, linkingCode);

      case 'select_person':
        // User selecting from multiple unlinked people
        if (!personId) {
          return errorResponse('Person ID required for manual selection');
        }
        return await handleManualSelection(base44, user, personId);

      default:
        return errorResponse(
          'Invalid method. Use "parent_link", "code_link", or "select_person"'
        );
    }
  } catch (error) {
    logError('linkAccount', error);
    return errorResponse('An internal server error occurred', 500);
  }
});
