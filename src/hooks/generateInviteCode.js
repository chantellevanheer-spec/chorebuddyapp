/**
 * Generate a unique, readable invite code for family
 */
export async function generateInviteCode(data, context) {
  // Generate 8-character alphanumeric code (excluding confusing characters)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No 0, O, 1, I
  let code = '';
  
  let isUnique = false;
  let attempts = 1;
  const maxAttempts = 10;
  
  while (!isUnique && attempts < maxAttempts) {
    code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Check if code already exists
    const existing = await context.entities.Family.list({
      where: { invite_code: code }
    });
    
    if (existing.length === 0) {
      isUnique = true;
    }
    attempts++;
  }
  
  if (!isUnique) {
    throw new Error('Failed to generate unique invite code');
  }
  
  data.invite_code = code;
  data.invite_enabled = true;
  
  return data;
}
