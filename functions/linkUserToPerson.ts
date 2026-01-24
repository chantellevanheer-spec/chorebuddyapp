import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    
    try {
        const user = await base44.auth.me();
        if (!user) {
            return new Response(JSON.stringify({ error: 'User not authenticated' }), { 
                status: 401, 
                headers: { 'Content-Type': 'application/json' } 
            });
        }

        const { personId } = await req.json();
        
        if (!personId) {
            return new Response(JSON.stringify({ error: 'Person ID is required' }), { 
                status: 400, 
                headers: { 'Content-Type': 'application/json' } 
            });
        }

        // Get the person record using user's context first (respects RLS)
        let person;
        try {
            person = await base44.entities.Person.get(personId);
        } catch (error) {
            return new Response(JSON.stringify({ error: 'Person not found or not accessible' }), { 
                status: 404, 
                headers: { 'Content-Type': 'application/json' } 
            });
        }
        
        if (!person) {
            return new Response(JSON.stringify({ error: 'Person not found' }), { 
                status: 404, 
                headers: { 'Content-Type': 'application/json' } 
            });
        }

        // Verify user is in the same family
        if (person.family_id !== user.family_id) {
            return new Response(JSON.stringify({ error: 'Person is not in your family' }), { 
                status: 403, 
                headers: { 'Content-Type': 'application/json' } 
            });
        }

        // Check if person is already linked to another user
        if (person.linked_user_id && person.linked_user_id !== user.id) {
            return new Response(JSON.stringify({ error: 'This family member is already linked to another account' }), { 
                status: 400, 
                headers: { 'Content-Type': 'application/json' } 
            });
        }

        // Check if user is already linked to another person
        const existingLink = await base44.entities.Person.filter({
            linked_user_id: user.id
        });

        if (existingLink.length > 0 && existingLink[0].id !== personId) {
            return new Response(JSON.stringify({ error: 'Your account is already linked to another family member' }), { 
                status: 400, 
                headers: { 'Content-Type': 'application/json' } 
            });
        }

        // Link the user to the person using service role for the update
        await base44.asServiceRole.entities.Person.update(personId, {
            linked_user_id: user.id
        });

        return new Response(JSON.stringify({ 
            success: true,
            message: 'Successfully linked your account!',
            personId: personId
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } catch (error) {
        console.error('Error linking user to person:', error);
        return new Response(JSON.stringify({ error: error.message || 'An internal server error occurred.' }), { 
            status: 500, 
            headers: { 'Content-Type': 'application/json' } 
        });
    }
});