import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { checkRateLimit, isValidEmail, isParent, getUserFamilyId } from './lib/security.js';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    
    try {
        // ==========================================
        // SECURITY CHECKS - DO NOT REMOVE
        // ==========================================
        
        // 1. Check if user is authenticated
        const user = await base44.auth.me();
        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized: User not authenticated.' }), { 
                status: 401, 
                headers: { 'Content-Type': 'application/json' } 
            });
        }

        // 2. Check if user is a parent
        if (!isParent(user)) {
            return new Response(JSON.stringify({ error: 'Unauthorized: Only parents can invite family members.' }), { 
                status: 403, 
                headers: { 'Content-Type': 'application/json' } 
            });
        }

        // 3. Rate limiting - max 5 invitations per 5 minutes
        const rateLimit = checkRateLimit(user.id, 'family_invitation', 5, 5 * 60 * 1000);
        if (!rateLimit.allowed) {
            return new Response(JSON.stringify({ 
                error: 'Too many invitation requests. Please try again later.',
                resetTime: rateLimit.resetTime 
            }), { 
                status: 429, 
                headers: { 'Content-Type': 'application/json' } 
            });
        }

        // 4. Get family ID from user data
        const familyId = getUserFamilyId(user);
        if (!familyId) {
            return new Response(JSON.stringify({ error: 'No family found. Please set up your family first.' }), { 
                status: 400, 
                headers: { 'Content-Type': 'application/json' } 
            });
        }

        // Detect which database has the family
        let familyDb = 'prod';
        let family = null;
        try {
            family = await base44.asServiceRole.entities.Family.get(familyId);
        } catch (error) {
            try {
                family = await base44.asServiceRole.entities.Family.get(familyId, { data_env: 'dev' });
                familyDb = 'dev';
            } catch (innerError) {
                console.error('Family lookup failed for familyId:', familyId, 'User:', user.id);
                return new Response(JSON.stringify({ error: 'Family not found. Please set up your family first.' }), { 
                    status: 404, 
                    headers: { 'Content-Type': 'application/json' } 
                });
            }
        }
        
        if (!family) {
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

        // ==========================================
        // INPUT VALIDATION
        // ==========================================
        
        // Validate email format if provided
        if (email && !isValidEmail(email)) {
            return new Response(JSON.stringify({ error: 'Bad Request: Invalid email format.' }), { 
                status: 400, 
                headers: { 'Content-Type': 'application/json' } 
            });
        }

        // Validate role if provided
        if (role && !['parent', 'teen', 'child'].includes(role)) {
            return new Response(JSON.stringify({ error: 'Bad Request: Invalid role. Must be "parent", "teen", or "child".' }), { 
                status: 400, 
                headers: { 'Content-Type': 'application/json' } 
            });
        }

        // Handle linking code generation (allowed on all tiers for parents)
        if (generateLinkingCode) {
            const linkingCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            const linkingCodeExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

            const userLinkingCodes = family.user_linking_codes || {};

            // Add/update this user's linking code
            userLinkingCodes[user.id] = {
                code: linkingCode,
                expires: linkingCodeExpires
            };

            // Update family with user-specific linking code
            const updateOpts = familyDb === 'dev' ? { data_env: 'dev' } : {};
            await base44.asServiceRole.entities.Family.update(familyId, {
                user_linking_codes: userLinkingCodes
            }, updateOpts);

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

        // Validate required fields for email invitations
        if (!email || !name || !role) {
            return new Response(JSON.stringify({ error: 'Bad Request: Email, name, and role are required.' }), { 
                status: 400, 
                headers: { 'Content-Type': 'application/json' } 
            });
        }

        // Generate a unique invite code
        const inviteCode = `${familyId}-${Date.now()}-${Math.random().toString(36).substring(7)}`;

        // Update family with invite code
        const updateOpts = familyDb === 'dev' ? { data_env: 'dev' } : {};
        await base44.asServiceRole.entities.Family.update(familyId, { 
            invite_code: inviteCode 
        }, updateOpts);

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