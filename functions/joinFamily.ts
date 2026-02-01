import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { HEADERS } from './lib/constants.js';

// Constants
const VALID_ROLES = ['parent', 'child', 'teen'];
const PERSON_ROLES = ['parent', 'child', 'teen'];
const INVITE_CODE_MIN_LENGTH = 6;
const MAX_FAMILY_SIZE = 50; // Prevent abuse

/**
 * Validate invite code format
 */
const validateInviteCode = (code) => {
    if (!code || typeof code !== 'string') {
        return { valid: false, error: 'Invite code is required' };
    }
    
    const trimmedCode = code.trim();
    
    if (trimmedCode.length < INVITE_CODE_MIN_LENGTH) {
        return { valid: false, error: 'Invalid invite code format' };
    }
    
    // Check for potentially malicious input
    if (/[<>'"\\]/.test(trimmedCode)) {
        return { valid: false, error: 'Invalid invite code format' };
    }
    
    return { valid: true, code: trimmedCode };
};

/**
 * Validate role
 */
const validateRole = (role) => {
    if (!role) {
        return { valid: true, role: 'child' }; // Default to child
    }
    
    if (typeof role !== 'string') {
        return { valid: false, error: 'Role must be a string' };
    }
    
    const normalizedRole = role.toLowerCase().trim();
    
    if (!VALID_ROLES.includes(normalizedRole)) {
        return { 
            valid: false, 
            error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` 
        };
    }
    
    return { valid: true, role: normalizedRole };
};

/**
 * Map user role to person role
 */
const mapRoleToPerson = (userRole) => {
    // Ensure the role is valid for Person entity
    return PERSON_ROLES.includes(userRole) ? userRole : 'child';
};

/**
 * Cleanup failed join attempt
 */
const rollbackJoinOperation = async (base44, personId, userId, familyId, originalFamilyId) => {
    const rollbackErrors = [];
    
    // Delete person record
    if (personId) {
        try {
            await base44.asServiceRole.entities.Person.delete(personId);
        } catch (error) {
            console.error('Failed to delete person during rollback:', error);
            rollbackErrors.push('person_deletion_failed');
        }
    }
    
    // Restore user's original family_id
    if (userId && originalFamilyId !== undefined) {
        try {
            await base44.asServiceRole.entities.User.update(userId, {
                family_id: originalFamilyId,
                family_role: null
            });
        } catch (error) {
            console.error('Failed to restore user during rollback:', error);
            rollbackErrors.push('user_restoration_failed');
        }
    }
    
    // Remove user from family members
    if (userId && familyId) {
        try {
            const family = await base44.asServiceRole.entities.Family.get(familyId);
            if (family && family.members.includes(userId)) {
                await base44.asServiceRole.entities.Family.update(familyId, {
                    members: family.members.filter(id => id !== userId)
                });
            }
        } catch (error) {
            console.error('Failed to remove user from family during rollback:', error);
            rollbackErrors.push('family_update_failed');
        }
    }
    
    return rollbackErrors;
};

/**
 * Check if user can join family
 */
const canUserJoinFamily = (user, family, currentFamilySize) => {
    // Check if already in this family
    if (user.family_id === family.id) {
        return { 
            allowed: false, 
            reason: 'already_member',
            message: 'You are already a member of this family.'
        };
    }
    
    // Check if in another family
    if (user.family_id && user.family_id !== family.id) {
        return { 
            allowed: false, 
            reason: 'already_in_family',
            message: 'You are already in another family. Please contact support to switch families.'
        };
    }
    
    // Check family size limit
    if (currentFamilySize >= MAX_FAMILY_SIZE) {
        return { 
            allowed: false, 
            reason: 'family_full',
            message: 'This family has reached its maximum size.'
        };
    }
    
    return { allowed: true };
};

/**
 * Find existing person record
 */
const findExistingPerson = async (base44, familyId, userId) => {
    try {
        const persons = await base44.asServiceRole.entities.Person.filter({ 
            family_id: familyId, 
            linked_user_id: userId 
        });
        
        return persons.length > 0 ? persons[0] : null;
    } catch (error) {
        console.error('Error finding existing person:', error);
        return null;
    }
};

/**
 * Main handler
 */
Deno.serve(async (req) => {
    let base44;
    let requestBody;
    
    try {
        // Initialize client
        base44 = createClientFromRequest(req);
        
        // Parse request body
        try {
            requestBody = await req.json();
        } catch (parseError) {
            return Response.json({ 
                error: 'Invalid JSON in request body' 
            }, { status: 400, headers: HEADERS });
        }
        
        const { inviteCode, role } = requestBody;
        
        // ==========================================
        // SECURITY CHECKS - DO NOT REMOVE
        // ==========================================
        
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ 
                error: 'User not authenticated' 
            }, { status: 401, headers: HEADERS });
        }
        
        // Ensure user has required fields
        if (!user.id) {
            return Response.json({ 
                error: 'Invalid user session' 
            }, { status: 400, headers: HEADERS });
        }
        
        // ==========================================
        // INPUT VALIDATION
        // ==========================================
        
        const inviteValidation = validateInviteCode(inviteCode);
        if (!inviteValidation.valid) {
            return Response.json({ 
                error: inviteValidation.error 
            }, { status: 400, headers: HEADERS });
        }
        
        const roleValidation = validateRole(role);
        if (!roleValidation.valid) {
            return Response.json({ 
                error: roleValidation.error 
            }, { status: 400, headers: HEADERS });
        }
        
        const validatedCode = inviteValidation.code;
        const validatedRole = roleValidation.role;
        
        // ==========================================
        // FETCH FAMILY
        // ==========================================
        
        let families;
        try {
            families = await base44.asServiceRole.entities.Family.filter({ 
                invite_code: validatedCode 
            });
        } catch (error) {
            console.error('Error fetching family:', error);
            return Response.json({ 
                error: 'Failed to validate invite code. Please try again.' 
            }, { status: 500, headers: HEADERS });
        }
        
        if (!families || families.length === 0) {
            return Response.json({ 
                error: 'Invalid or expired invite code' 
            }, { status: 404, headers: HEADERS });
        }
        
        const family = families[0];
        
        // Validate family data
        if (!family.id || !family.name) {
            return Response.json({ 
                error: 'Invalid family data' 
            }, { status: 500, headers: HEADERS });
        }
        
        // ==========================================
        // CHECK EXISTING MEMBERSHIP
        // ==========================================
        
        const existingPerson = await findExistingPerson(base44, family.id, user.id);
        
        if (existingPerson) {
            return Response.json({ 
                success: true, 
                familyId: family.id,
                familyName: family.name,
                personId: existingPerson.id,
                role: existingPerson.role,
                message: 'You are already a member of this family.',
                alreadyMember: true
            }, { status: 200, headers: HEADERS });
        }
        
        // ==========================================
        // VALIDATE USER CAN JOIN
        // ==========================================
        
        const currentFamilySize = family.members?.length || 0;
        const joinCheck = canUserJoinFamily(user, family, currentFamilySize);
        
        if (!joinCheck.allowed) {
            const statusCode = joinCheck.reason === 'already_in_family' ? 409 : 400;
            return Response.json({ 
                error: joinCheck.message,
                reason: joinCheck.reason
            }, { status: statusCode, headers: HEADERS });
        }
        
        // ==========================================
        // PERFORM ATOMIC JOIN OPERATION
        // ==========================================
        
        const originalFamilyId = user.family_id;
        let newPerson = null;
        let operationLog = [];
        
        try {
            // Step 1: Create person record
            operationLog.push('creating_person');
            const personRole = mapRoleToPerson(validatedRole);
            
            newPerson = await base44.asServiceRole.entities.Person.create({
                name: user.full_name || user.email || 'Family Member',
                family_id: family.id,
                linked_user_id: user.id,
                role: personRole,
                points: 0
            });
            
            if (!newPerson || !newPerson.id) {
                throw new Error('Failed to create person record');
            }
            
            operationLog.push('person_created');
            
            // Step 2: Update user record
            operationLog.push('updating_user');
            await base44.asServiceRole.entities.User.update(user.id, {
                family_id: family.id,
                family_role: validatedRole,
            });
            
            operationLog.push('user_updated');
            
            // Step 3: Add user to family members list
            operationLog.push('updating_family');
            const currentMembers = family.members || [];
            
            if (!currentMembers.includes(user.id)) {
                await base44.asServiceRole.entities.Family.update(family.id, {
                    members: [...currentMembers, user.id]
                });
            }
            
            operationLog.push('family_updated');
            
        } catch (operationError) {
            console.error('Join operation failed:', {
                error: operationError.message,
                userId: user.id,
                familyId: family.id,
                operationLog
            });
            
            // Attempt rollback
            const rollbackErrors = await rollbackJoinOperation(
                base44, 
                newPerson?.id, 
                user.id, 
                family.id, 
                originalFamilyId
            );
            
            if (rollbackErrors.length > 0) {
                console.error('Rollback encountered errors:', rollbackErrors);
            }
            
            const userMessage = operationLog.includes('person_created') 
                ? 'Failed to complete family join. Your account was not modified.'
                : 'Failed to join family. Please try again.';
            
            return Response.json({ 
                error: userMessage,
                details: 'An error occurred during the join process'
            }, { status: 500, headers: HEADERS });
        }
        
        // ==========================================
        // SUCCESS RESPONSE
        // ==========================================
        
        return Response.json({ 
            success: true, 
            familyId: family.id,
            familyName: family.name,
            personId: newPerson.id,
            role: newPerson.role,
            message: 'Successfully joined the family!',
            alreadyMember: false
        }, { status: 200, headers: HEADERS });

    } catch (error) {
        console.error('Unexpected error in family join:', {
            error: error.message,
            stack: error.stack,
            requestBody
        });
        
        // Determine appropriate error response
        let statusCode = 500;
        let errorMessage = 'An internal server error occurred.';
        
        if (error.message?.includes('not authenticated')) {
            statusCode = 401;
            errorMessage = 'Authentication required';
        } else if (error.message?.includes('Invalid')) {
            statusCode = 400;
            errorMessage = error.message;
        } else if (error.response?.status) {
            statusCode = error.response.status;
            errorMessage = error.response.data?.error || error.message;
        }
        
        return Response.json({ 
            error: errorMessage,
            success: false
        }, { status: statusCode, headers: HEADERS });
    }
});