import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { TIME } from './lib/constants.js';

// Generate a random 6-character alphanumeric code (uppercase for readability)
function generateLinkingCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars like 0, O, 1, I
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // ==========================================
        // SECURITY CHECKS - DO NOT REMOVE
        // ==========================================
        
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { action, linkingCode, familyId } = await req.json();

        // Action: Generate a new linking code for a family (parent only)
        if (action === 'generate') {
            if (!familyId) {
                return Response.json({ error: 'Family ID required' }, { status: 400 });
            }

            // Verify user is a parent
            if (user.family_role !== 'parent') {
                return Response.json({ error: 'Only parents can generate linking codes' }, { status: 403 });
            }

            // Verify user is in this family
            if (user.family_id !== familyId) {
                return Response.json({ error: 'You can only generate codes for your own family' }, { status: 403 });
            }

            const families = await base44.entities.Family.filter({ id: familyId });
            const family = families[0];

            if (!family) {
                return Response.json({ error: 'Family not found' }, { status: 404 });
            }

            // Generate new code with 24-hour expiry
            const newCode = generateLinkingCode();
            const expiresAt = new Date(Date.now() + TIME.ONE_DAY_MS).toISOString();

            await base44.asServiceRole.entities.Family.update(familyId, {
                linking_code: newCode,
                linking_code_expires: expiresAt
            });

            return Response.json({
                success: true,
                linkingCode: newCode,
                expiresAt: expiresAt
            });
        }

        // Action: Validate and join a family using a linking code (teen/child)
        if (action === 'join') {
            if (!linkingCode) {
                return Response.json({ error: 'Linking code required' }, { status: 400 });
            }

            const codeUppercase = linkingCode.toUpperCase().trim();

            // Find family with this linking code using service role (bypasses RLS)
            const families = await base44.asServiceRole.entities.Family.filter({ 
                linking_code: codeUppercase 
            });

            if (families.length === 0) {
                return Response.json({ 
                    success: false, 
                    error: 'Invalid linking code. Please check and try again.' 
                }, { status: 400 });
            }

            const family = families[0];

            // Check if code is expired
            if (family.linking_code_expires) {
                const expiryDate = new Date(family.linking_code_expires);
                if (expiryDate < new Date()) {
                    return Response.json({ 
                        success: false, 
                        error: 'This linking code has expired. Please ask your parent for a new code.' 
                    }, { status: 400 });
                }
            }

            // Check if user is already a member
            const currentMembers = family.members || [];
            if (currentMembers.includes(user.id)) {
                return Response.json({ 
                    success: false, 
                    error: 'You are already a member of this family.' 
                }, { status: 400 });
            }

            // Add user to family members
            const updatedMembers = [...currentMembers, user.id];
            await base44.asServiceRole.entities.Family.update(family.id, {
                members: updatedMembers
            });

            // Update user's family_id
            await base44.auth.updateMe({
                family_id: family.id
            });

            return Response.json({
                success: true,
                familyName: family.name,
                familyId: family.id
            });
        }

        return Response.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('Family linking error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});