/**
 * Check if user can manage family settings
 */
export function canManageFamily(user, family) {
  if (!user || !family) return false;
  return (
    family.owner_user_id === user.id ||
    family.co_owners?.includes(user.id)
  );
}

/**
 * Check if user is family owner
 */
export function isFamilyOwner(user, family) {
  if (!user || !family) return false;
  return family.owner_user_id === user.id;
}

/**
 * Get member limit for subscription tier
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
 * Check if family can add more members
 */
export function canAddMember(family) {
  const limit = getMemberLimit(family.subscription_tier);
  return family.member_count < limit;
}

/**
 * Get remaining member slots
 */
export function getRemainingSlots(family) {
  const limit = getMemberLimit(family.subscription_tier);
  return Math.max(0, limit - family.member_count);
}

/**
 * Format subscription tier for display
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

/**
 * Get subscription badge color
 */
export function getTierColor(tier) {
  const colors = {
    free: 'gray',
    premium: 'blue',
    family_plus: 'purple',
    enterprise: 'yellow'
  };
  return colors[tier] || 'gray';
}

/**
 * Check if subscription is active
 */
export function isSubscriptionActive(family) {
  if (!family) return false;
  return ['active', 'trial'].includes(family.subscription_status);
}

/**
 * Check if on trial
 */
export function isOnTrial(family) {
  if (!family) return false;
  return family.subscription_status === 'trial';
}

/**
 * Get days until trial ends
 */
export function getDaysUntilTrialEnd(family) {
  if (!family?.trial_ends_at) return 0;
  const now = new Date();
  const end = new Date(family.trial_ends_at);
  const diff = end - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Update family statistics after chore completion
 */
export async function updateFamilyStats(familyId, updates) {
  try {
    const family = await Family.get(familyId);
    
    const newStats = {
      ...family.statistics,
      total_chores_completed: (family.statistics.total_chores_completed || 0) + (updates.choresCompleted || 0),
      total_points_awarded: (family.statistics.total_points_awarded || 0) + (updates.pointsAwarded || 0),
      total_rewards_redeemed: (family.statistics.total_rewards_redeemed || 0) + (updates.rewardsRedeemed || 0),
      current_week_completions: (family.statistics.current_week_completions || 0) + (updates.weeklyCompletions || 0),
      last_activity_at: new Date().toISOString()
    };

    await Family.update(familyId, {
      statistics: newStats
    });

    return newStats;
  } catch (error) {
    console.error('Error updating family stats:', error);
    throw error;
  }
}

/**
 * Reset weekly statistics (call on Sunday/Monday)
 */
export async function resetWeeklyStats(familyId) {
  try {
    const family = await Family.get(familyId);
    
    await Family.update(familyId, {
      statistics: {
        ...family.statistics,
        current_week_completions: 0
      }
    });
  } catch (error) {
    console.error('Error resetting weekly stats:', error);
    throw error;
  }
}

/**
 * Add member to family
 */
export async function addFamilyMember(familyId, userId) {
  try {
    const family = await Family.get(familyId);
    
    // Check if already a member
    if (family.members.includes(userId)) {
      throw new Error('User is already a family member');
    }
    
    // Check member limit
    if (!canAddMember(family)) {
      const limit = getMemberLimit(family.subscription_tier);
      throw new Error(`Family is at maximum capacity (${limit} members)`);
    }
    
    // Add to members array
    const newMembers = [...family.members, userId];
    
    await Family.update(familyId, {
      members: newMembers,
      member_count: newMembers.length
    });
    
    return true;
  } catch (error) {
    console.error('Error adding family member:', error);
    throw error;
  }
}

/**
 * Remove member from family
 */
export async function removeFamilyMember(familyId, userId, currentUser) {
  try {
    const family = await Family.get(familyId);
    
    // Cannot remove owner
    if (userId === family.owner_user_id) {
      throw new Error('Cannot remove family owner');
    }
    
    // Only owner/co-owners can remove members
    if (!canManageFamily(currentUser, family)) {
      throw new Error('Insufficient permissions');
    }
    
    // Remove from members and co_owners
    const newMembers = family.members.filter(id => id !== userId);
    const newCoOwners = family.co_owners?.filter(id => id !== userId) || [];
    
    await Family.update(familyId, {
      members: newMembers,
      member_count: newMembers.length,
      co_owners: newCoOwners
    });
    
    return true;
  } catch (error) {
    console.error('Error removing family member:', error);
    throw error;
  }
}

/**
 * Add co-owner
 */
export async function addCoOwner(familyId, userId, currentUser) {
  try {
    const family = await Family.get(familyId);
    
    // Only owner can add co-owners
    if (!isFamilyOwner(currentUser, family)) {
      throw new Error('Only the family owner can add co-owners');
    }
    
    // Check if user is a member
    if (!family.members.includes(userId)) {
      throw new Error('User must be a family member first');
    }
    
    // Check if already a co-owner
    if (family.co_owners?.includes(userId)) {
      throw new Error('User is already a co-owner');
    }
    
    // Check co-owner limit (max 5)
    if ((family.co_owners?.length || 0) >= 5) {
      throw new Error('Maximum of 5 co-owners allowed');
    }
    
    const newCoOwners = [...(family.co_owners || []), userId];
    
    await Family.update(familyId, {
      co_owners: newCoOwners
    });
    
    return true;
  } catch (error) {
    console.error('Error adding co-owner:', error);
    throw error;
  }
}

/**
 * Remove co-owner
 */
export async function removeCoOwner(familyId, userId, currentUser) {
  try {
    const family = await Family.get(familyId);
    
    // Only owner can remove co-owners
    if (!isFamilyOwner(currentUser, family)) {
      throw new Error('Only the family owner can remove co-owners');
    }
    
    const newCoOwners = family.co_owners?.filter(id => id !== userId) || [];
    
    await Family.update(familyId, {
      co_owners: newCoOwners
    });
    
    return true;
  } catch (error) {
    console.error('Error removing co-owner:', error);
    throw error;
  }
}
