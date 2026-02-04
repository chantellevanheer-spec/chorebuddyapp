/**
 * Validate subscription tier changes
 */
export async function validateSubscriptionChange(data, existingData, context) {
  if (!data.subscription_tier) return data;
  
  const oldTier = existingData.subscription_tier;
  const newTier = data.subscription_tier;
  
  if (oldTier === newTier) return data;
  
  // Check member count limits for downgrade
  const limits = {
    free: 6,
    premium: 15,
    family_plus: 30,
    enterprise: 50
  };
  
  const memberCount = data.member_count || existingData.member_count || 0;
  
  if (memberCount > limits[newTier]) {
    throw new Error(
      `Cannot downgrade to ${newTier}: You have ${memberCount} members. ` +
      `${newTier} tier supports up to ${limits[newTier]} members. ` +
      `Please remove members first.`
    );
  }
  
  // Log the change
  console.log(`Subscription changed: ${oldTier} -> ${newTier} for family ${existingData.id}`);
  
  return data;
}
