import { createClientFromRequest } from 'npm:@base44/sdk@0.5.0';

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

        return new Response(JSON.stringify({ success: true, familyId: family.id, personId: newPerson.id }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } catch (error) {
        console.error('Error joining family:', error);
        const errorMessage = error.response?.data?.error || error.message || 'An internal server error occurred.';
        const statusCode = error.response?.status || 500;
        return new Response(JSON.stringify({ error: errorMessage }), { status: statusCode, headers: { 'Content-Type': 'application/json' } });
    }
});