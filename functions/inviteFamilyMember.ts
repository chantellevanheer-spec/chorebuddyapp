import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    
    try {
        const user = await base44.auth.me();
        const familyId = user?.data?.family_id || user?.family_id;

        if (!user || !familyId) {
            return new Response(JSON.stringify({ error: 'No family found. Please set up your family first.' }), { 
                status: 400, 
                headers: { 'Content-Type': 'application/json' } 
            });
        }

        // Verify family exists using service role to bypass RLS
        try {
            // Check which database the family is in (prod or dev/test)
            let family = null;
            try {
                family = await base44.asServiceRole.entities.Family.get(familyId);
            } catch (error) {
                // If not found in production, try test database
                family = await base44.asServiceRole.entities.Family.get(familyId, { data_env: 'dev' });
            }
            if (!family) {
                throw new Error('Family not found');
            }
        } catch (error) {
            return new Response(JSON.stringify({ error: 'Family not found. Please set up your family first.' }), { 
                status: 404, 
                headers: { 'Content-Type': 'application/json' } 
            });
        }

        let subscriptionTier = user?.data?.subscription_tier || user?.subscription_tier || 'free';
        
        // If user is a child, get parent's subscription
        if (user.family_role === 'child') {
            try {
                const linkedPerson = await base44.asServiceRole.entities.Person.filter({
                    linked_user_id: user.id,
                    family_id: familyId
                });
                
                if (linkedPerson.length > 0) {
                    // Find the parent user who owns this family or is an admin in the family
                    const familyMembers = await base44.asServiceRole.entities.User.filter({
                        family_id: familyId,
                        family_role: 'parent'
                    });
                    
                    if (familyMembers.length > 0) {
                        subscriptionTier = familyMembers[0]?.data?.subscription_tier || familyMembers[0]?.subscription_tier || 'free';
                    }
                }
            } catch (error) {
                console.error('Error checking parent subscription:', error);
            }
        }
        
        const { email, name, role, generateLinkingCode } = await req.json();

        // Handle linking code generation (allowed on all tiers)
        if (generateLinkingCode) {
            const linkingCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            const linkingCodeExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

            // Get current family data to preserve existing codes (try both databases)
            let family = null;
            try {
                family = await base44.asServiceRole.entities.Family.get(familyId);
            } catch (error) {
                family = await base44.asServiceRole.entities.Family.get(familyId, { data_env: 'dev' });
            }
            
            const userLinkingCodes = family.user_linking_codes || {};

            // Add/update this user's linking code
            userLinkingCodes[user.id] = {
                code: linkingCode,
                expires: linkingCodeExpires
            };

            // Update family with user-specific linking code (use same database as read)
            try {
                await base44.asServiceRole.entities.Family.update(familyId, {
                    user_linking_codes: userLinkingCodes
                });
            } catch (error) {
                await base44.asServiceRole.entities.Family.update(familyId, {
                    user_linking_codes: userLinkingCodes
                }, { data_env: 'dev' });
            }

            return new Response(JSON.stringify({ success: true, linkingCode, linkingCodeExpires }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Email invitations require premium
        if (subscriptionTier !== 'premium') {
            return new Response(JSON.stringify({ error: 'Email invitations are a Premium feature.' }), { 
                status: 403, 
                headers: { 'Content-Type': 'application/json' } 
            });
        }
        
        if (!email || !name || !role) {
            return new Response(JSON.stringify({ error: 'Missing required fields for email invitation' }), { 
                status: 400, 
                headers: { 'Content-Type': 'application/json' } 
            });
        }

        // Generate a unique invite code
        const inviteCode = `${familyId}-${Date.now()}-${Math.random().toString(36).substring(7)}`;

        // Update family with invite code (try both databases)
        try {
            await base44.asServiceRole.entities.Family.update(familyId, { 
                invite_code: inviteCode 
            });
        } catch (error) {
            await base44.asServiceRole.entities.Family.update(familyId, { 
                invite_code: inviteCode 
            }, { data_env: 'dev' });
        }

        const appUrl = 'https://chorebuddyapp.com';
        const joinUrl = `${appUrl}/JoinFamily?code=${inviteCode}`;

        // Send invitation email
        await base44.asServiceRole.integrations.Core.SendEmail({
            to: email,
            from_name: "ChoreBuddy",
            subject: `You're invited to join ${user.full_name}'s family on ChoreBuddy!`,
            body: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #2B59C3; font-size: 28px; margin: 0;">ChoreBuddy</h1>
                        <p style="color: #5E3B85; font-size: 16px;">Making household chores fun for the whole family!</p>
                    </div>
                    
                    <p style="font-size: 16px; color: #333;">Hello ${name},</p>
                    
                    <p style="font-size: 16px; color: #333; line-height: 1.6;">
                        You've been invited to join <strong>${user.full_name}'s family</strong> on ChoreBuddy! 
                        Our app makes household chores fun and rewarding for everyone.
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${joinUrl}" style="background-color: #FF6B35; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold; display: inline-block;">
                            Accept Invitation
                        </a>
                    </div>
                    
                    <p style="font-size: 14px; color: #666; line-height: 1.6;">
                        Once you join, you'll be able to view your assigned chores, earn points for completing tasks, 
                        and redeem rewards from your family's store!
                    </p>
                    
                    <p style="font-size: 14px; color: #666;">
                        If you have any questions, please contact your family manager or visit 
                        <a href="https://chorebuddyapp.com/Help" target="_blank" style="color: #5E3B85;">our help center</a>.
                    </p>
                    
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                    
                    <p style="font-size: 12px; color: #999; text-align: center;">
                        Thanks,<br/>The ChoreBuddy Team<br/>
                        <a href="https://chorebuddyapp.com" style="color: #5E3B85;">chorebuddyapp.com</a>
                    </p>
                </div>
            `
        });

        return new Response(JSON.stringify({ success: true, message: "Invitation sent successfully." }), { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error in inviteFamilyMember function:', error);
        return new Response(JSON.stringify({ error: error.message || 'An internal server error occurred.' }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});