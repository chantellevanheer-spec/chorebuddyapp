import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { HEADERS } from './lib/constants.js';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    const { inviteCode, role } = await req.json();

    try {
        // ==========================================
        // SECURITY CHECKS - DO NOT REMOVE
        // ==========================================
        
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'User not authenticated' }, { status: 401 });
        }
        
        // ==========================================
        // INPUT VALIDATION
        // ==========================================
        
        if (!inviteCode) {
            return Response.json({ error: 'Invite code is required' }, { status: 400 });
        }
        
        if (role && !['parent', 'child'].includes(role)) {
            return Response.json({ error: 'Invalid role. Must be "parent" or "child"' }, { status: 400 });
        }

        const families = await base44.asServiceRole.entities.Family.filter({ invite_code: inviteCode });
        if (families.length === 0) {
            return Response.json({ error: 'Invalid or expired invite code' }, { status: 404 });
        }
        const family = families[0];

        // Check if user already in another family
        if (user.family_id && user.family_id !== family.id) {
            return Response.json({ error: 'You are already in another family. Please contact support to switch families.' }, { status: 400 });
        }

        // Check if a Person record already exists for this user
        const existingPerson = await base44.asServiceRole.entities.Person.filter({ 
            family_id: family.id, 
            linked_user_id: user.id 
        });

        if (existingPerson.length > 0) {
            return Response.json({ 
                success: true, 
                familyId: family.id,
                familyName: family.name,
                personId: existingPerson[0].id,
                message: 'You are already a member of this family.'
            }, { status: 200 });
        }

        // Perform all updates atomically - if any fail, all should fail
        let newPerson;
        try {
            // Create person first to ensure we can link properly
            newPerson = await base44.asServiceRole.entities.Person.create({
                name: user.full_name,
                family_id: family.id,
                linked_user_id: user.id,
                role: (role === 'parent' ? 'adult' : 'child'),
            });
            
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
        } catch (updateError) {
            // Rollback: delete the person record if updates failed
            if (newPerson?.id) {
                try {
                    await base44.asServiceRole.entities.Person.delete(newPerson.id);
                } catch (rollbackError) {
                    console.error('Rollback failed:', rollbackError);
                }
            }
            throw new Error('Failed to complete family join operation. Please try again.');
        }

        return Response.json({ 
            success: true, 
            familyId: family.id,
            familyName: family.name,
            personId: newPerson.id,
            message: 'Successfully joined the family!'
        }, { status: 200 });

    } catch (error) {
        console.error('Error joining family:', error);
        const errorMessage = error.response?.data?.error || error.message || 'An internal server error occurred.';
        const statusCode = error.response?.status || 500;
        return Response.json({ error: errorMessage }, { status: statusCode });
    }
});