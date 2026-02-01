import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    
    try {
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'User not authenticated' }, { status: 401 });
        }

        // Validate user has a family
        if (!user.family_id && !user.data?.family_id) {
            return Response.json({ error: 'You must be part of a family to link accounts' }, { status: 400 });
        }

        const { linkingCode } = await req.json();
        
        if (!linkingCode || typeof linkingCode !== 'string') {
            return Response.json({ error: 'Linking code is required' }, { status: 400 });
        }

        // Get the family to validate the code
        let family;
        try {
            family = await base44.asServiceRole.entities.Family.get(user.family_id);
        } catch (error) {
            return Response.json({ error: 'Family not found' }, { status: 404 });
        }

        if (!family) {
            return Response.json({ error: 'Family not found' }, { status: 404 });
        }

        // Check if code exists and is valid
        const userLinkingCodes = family.user_linking_codes || {};
        let isValidCode = false;
        let codeOwnerId = null;

        for (const [userId, codeData] of Object.entries(userLinkingCodes)) {
            if (codeData.code === linkingCode.toUpperCase()) {
                // Check if code is not expired
                const expiryDate = new Date(codeData.expires);
                if (expiryDate > new Date()) {
                    isValidCode = true;
                    codeOwnerId = userId;
                    break;
                }
            }
        }

        if (!isValidCode) {
            return Response.json({ error: 'Invalid or expired linking code' }, { status: 400 });
        }

        // Get all unlinked people in the family
        const allPeople = await base44.asServiceRole.entities.Person.filter({
            family_id: user.family_id
        });

        const unlinkedPeople = allPeople.filter(p => !p.linked_user_id);

        if (unlinkedPeople.length === 0) {
            return Response.json({ error: 'No available family member profiles to link' }, { status: 400 });
        }

        // If only one unlinked person, link automatically
        let personToLink;
        if (unlinkedPeople.length === 1) {
            personToLink = unlinkedPeople[0];
        } else {
            // Return list of unlinked people for child to choose
            return Response.json({
                success: true,
                needsSelection: true,
                unlinkedPeople: unlinkedPeople.map(p => ({
                    id: p.id,
                    name: p.name
                }))
            }, { status: 200 });
        }

        // Check if user is already linked to another person
        const existingLink = await base44.asServiceRole.entities.Person.filter({
            linked_user_id: user.id
        });

        if (existingLink.length > 0 && existingLink[0].id !== personToLink.id) {
            return Response.json({ error: 'Your account is already linked to another family member' }, { status: 400 });
        }

        // Link the user to the person
        await base44.asServiceRole.entities.Person.update(personToLink.id, {
            linked_user_id: user.id
        });

        return Response.json({ 
            success: true,
            message: 'Successfully linked your account!',
            personId: personToLink.id,
            personName: personToLink.name
        }, { status: 200 });

    } catch (error) {
        console.error('Error linking user with code:', error);
        return Response.json({ error: error.message || 'An internal server error occurred.' }, { status: 500 });
    }
});