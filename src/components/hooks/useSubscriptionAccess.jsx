import { useMemo } from 'react';
import { useData } from '../contexts/DataContext';

// Define feature access rules for each subscription tier
const SUBSCRIPTION_FEATURES = {
  free: {
    // Core limits
    max_family_members: 3,
    max_redeemable_items: 3,
    max_chores: 10,
    
    // Feature access
    choreai_smart_assignment: false,
    advanced_chore_settings: false,
    family_goals: false,
    analytics_export: false,
    premium_support: false,
    recurring_chores: false,
    chore_approval_system: false,
    photo_verification: false,
    custom_points: false,
    weekly_reports: false,
    priority_assignment: false,
    early_completion_bonus: false,
    family_invitations: false
  },
  premium: {
    // Core limits (unlimited)
    max_family_members: -1,
    max_redeemable_items: -1,
    max_chores: -1,
    
    // Feature access (all features)
    choreai_smart_assignment: true,
    advanced_chore_settings: true,
    family_goals: true,
    analytics_export: true,
    premium_support: true,
    recurring_chores: true,
    chore_approval_system: true,
    photo_verification: true,
    custom_points: true,
    weekly_reports: true,
    priority_assignment: true,
    early_completion_bonus: true,
    family_invitations: true
  }
};

export const useSubscriptionAccess = () => {
  const { user, people, items, chores } = useData();
  
  const currentTier = user?.subscription_tier || 'free';
  const isActive = user?.subscription_status === 'active' || currentTier === 'free';
  
  const features = useMemo(() => {
    return SUBSCRIPTION_FEATURES[currentTier] || SUBSCRIPTION_FEATURES.free;
  }, [currentTier]);

  // Check if user can access a specific feature
  const canAccess = (featureName) => {
    if (!isActive && currentTier !== 'free') return false;
    return features[featureName] || false;
  };

  // Check if user has reached a limit
  const hasReachedLimit = (limitType) => {
    const limit = features[limitType];
    if (limit === -1) return false; // Unlimited
    
    switch (limitType) {
      case 'max_family_members':
        return people.length >= limit;
      case 'max_redeemable_items':
        return items.length >= limit;
      case 'max_chores':
        return chores.length >= limit;
      default:
        return false;
    }
  };

  // Get the required tier for a feature
  const getRequiredTier = (featureName) => {
    for (const [tier, tierFeatures] of Object.entries(SUBSCRIPTION_FEATURES)) {
      if (tierFeatures[featureName]) {
        return tier;
      }
    }
    return 'premium'; // Default to premium if not found
  };

  // Get user-friendly tier names
  const getTierDisplayName = (tier) => {
    const names = {
      free: 'Free',
      premium: 'Premium'
    };
    return names[tier] || 'Premium';
  };

  return {
    currentTier,
    isActive,
    features,
    canAccess,
    hasReachedLimit,
    getRequiredTier,
    getTierDisplayName,
    // Convenience getters
    isPremium: currentTier === 'premium' && isActive,
    isFree: currentTier === 'free'
  };
};

export default useSubscriptionAccess;