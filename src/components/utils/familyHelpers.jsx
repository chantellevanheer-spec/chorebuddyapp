/**
 * Family management helper utilities
 * Used for permission checks, member limits, and subscription tier management
 */


/**
 * Check if user can manage family (owner or co-owner)
 */
export function canManageFamily(user, family) {
  if (!user || !family) return false;
  
  const isOwner = family.owner_user_id === user.id;
  const isCoOwner = family.co_owners?.includes(user.id);
  
  return isOwner || isCoOwner;
}

/**
 * Check if user is the family owner
 */
export function isFamilyOwner(user, family) {
  if (!user || !family) return false;
  return family.owner_user_id === user.id;
}

/**
 * Get member limit for a subscription tier
 */
export function getMemberLimit(tier) {
  const limits = {
    free: 6,
    premium: 15,
    family_plus: 30,
    enterprise: 50
  };
  return limits[tier] || limits.free;
}

/**
 * Check if family has reached member limit
 */
export function hasReachedMemberLimit(family) {
  if (!family) return false;
  
  const limit = getMemberLimit(family.subscription_tier || 'free');
  const currentCount = family.member_count || family.members?.length || 0;
  
  return currentCount >= limit;
}

/**
 * Get remaining member slots
 */
export function getRemainingSlots(family) {
  if (!family) return 0;
  
  const limit = getMemberLimit(family.subscription_tier || 'free');
  const currentCount = family.member_count || family.members?.length || 0;
  
  return Math.max(0, limit - currentCount);
}

/**
 * Format tier name for display
 */
export function formatTier(tier) {
  const names = {
    free: 'Free',
    premium: 'Premium',
    family_plus: 'Family Plus',
    enterprise: 'Enterprise'
  };
  return names[tier] || 'Free';
}