/**
 * Set up initial family membership
 */
export async function initializeFamilyMembers(data, context) {
  // Ensure owner is in members array
  if (!data.members) {
    data.members = [];
  }
  
  if (!data.members.includes(data.owner_user_id)) {
    data.members.push(data.owner_user_id);
  }
  
  // Set initial member count
  data.member_count = data.members.length;
  
  // Initialize co_owners if not present
  if (!data.co_owners) {
    data.co_owners = [];
  }
  
  // Initialize statistics
  if (!data.statistics) {
    data.statistics = {
      total_chores_completed: 0,
      total_points_awarded: 0,
      total_rewards_redeemed: 0,
      current_week_completions: 0,
      last_activity_at: new Date().toISOString()
    };
  }
  
  // Initialize settings
  if (!data.settings) {
    data.settings = {
      allow_self_assignment: false,
      require_photo_proof: true,
      auto_assign_chores: true,
      notifications_enabled: true,
      weekly_digest_day: 'sunday',
      point_multiplier: 1.0,
      max_pending_chores: 20
    };
  }
  
  return data;
}
