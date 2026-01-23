import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    const { inviteCode, role } = await req.json();

    try {
        const user = await base44.auth.me();
        if (!user) {
            return new Response(JSON.stringify({ error: 'User not authenticated' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
        }

        const families = await base44.asServiceRole.entities.Family.filter({ invite_code: inviteCode });
        if (families.length === 0) {
            return new Response(JSON.stringify({ error: 'Invalid or expired invite code' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
        }
        const family = families[0];

        // Check if user already in another family
        if (user.family_id && user.family_id !== family.id) {
            return new Response(JSON.stringify({ error: 'You are already in another family. Please contact support to switch families.' }), { 
                status: 400, 
                headers: { 'Content-Type': 'application/json' } 
            });
        }

        // Check if a Person record already exists for this user
        const existingPerson = await base44.asServiceRole.entities.Person.filter({ 
            family_id: family.id, 
            linked_user_id: user.id 
        });

        if (existingPerson.length > 0) {
            return new Response(JSON.stringify({ 
                success: true, 
                familyId: family.id, 
                personId: existingPerson[0].id,
                message: 'You are already a member of this family.'
            }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }

        // Update user's record
        await base44.asServiceRole.entities.User.update(user.id, {
            family_id: family.id,
            family_role: role || 'child',
        });
        
        // Add user to family's members list
        if (!family.members.includes(user.id)) {
            await base44.asServiceRole.entities.Family.update(family.id, {
                members: [...family.members, user.id]
            });
        }
        
        // Create a Person record for the new user
        const newPerson = await base44.asServiceRole.entities.Person.create({
            name: user.full_name,
            family_id: family.id,
            linked_user_id: user.id,
            role: (role === 'parent' ? 'adult' : 'child'),
        });

        return new Response(JSON.stringify({ 
            success: true, 
            familyId: family.id, 
            personId: newPerson.id,
            message: 'Successfully joined the family!'
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } catch (error) {
        console.error('Error joining family:', error);
        const errorMessage = error.response?.data?.error || error.message || 'An internal server error occurred.';
        const statusCode = error.response?.status || 500;
        return new Response(JSON.stringify({ error: errorMessage }), { status: statusCode, headers: { 'Content-Type': 'application/json' } });
    }
});