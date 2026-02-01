import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { HEADERS } from './lib/constants.js';
import { validateFamilyAccess, isParent, getUserFamilyId } from './lib/security.js';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    
    try {
        // ==========================================
        // SECURITY CHECKS - DO NOT REMOVE
        // ==========================================
        
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'User not authenticated' }, { status: 401 });
        }

        // Only parents can link accounts
        if (!isParent(user)) {
            return Response.json({ error: 'Forbidden: Only parents can link accounts' }, { status: 403 });
        }

        const { personId } = await req.json();
        
        if (!personId) {
            return Response.json({ error: 'Person ID is required' }, { status: 400 });
        }

        // Get the person record using service role
         let person;
         try {
             person = await base44.asServiceRole.entities.Person.get(personId, { data_env: "dev" });
         } catch (error) {
             return Response.json({ error: 'Person not found or not accessible' }, { status: 404 });
         }
        
        if (!person) {
            return Response.json({ error: 'Person not found' }, { status: 404 });
        }

        // Verify user is in the same family
        const familyCheck = validateFamilyAccess(user, person.family_id);
        if (!familyCheck.valid) {
            return Response.json({ error: familyCheck.error }, { status: 403 });
        }

        // Check if person is already linked to another user
        if (person.linked_user_id && person.linked_user_id !== user.id) {
            return Response.json({ error: 'This family member is already linked to another account' }, { status: 400 });
        }

        // Check if user is already linked to another person
        const existingLink = await base44.asServiceRole.entities.Person.filter({
            linked_user_id: user.id
        }, {}, { data_env: "dev" });

        if (existingLink.length > 0 && existingLink[0].id !== personId) {
            return Response.json({ error: 'Your account is already linked to another family member' }, { status: 400 });
        }

        // Link the user to the person using service role for the update
         await base44.asServiceRole.entities.Person.update(personId, {
             linked_user_id: user.id
         }, { data_env: "dev" });

        return Response.json({ 
            success: true,
            message: 'Successfully linked your account!',
            personId: personId
        }, { status: 200 });

    } catch (error) {
        console.error('Error linking user to person:', error);
        return Response.json({ error: error.message || 'An internal server error occurred.' }, { status: 500 });
    }
});