/**
 * Ensure all members removed before deletion
 */
export async function checkMembersRemoved(familyId, context) {
  const family = await context.entities.Family.get(familyId);
  
  // Allow deletion if only owner remains
  if (family.member_count > 1) {
    throw new Error(
      `Cannot delete family with ${family.member_count} members. ` +
      `Please remove all members except the owner first.`
    );
  }
  
  // Check for active Person records
  const people = await context.entities.Person.list({
    where: { family_id: familyId, is_active: true }
  });
  
  if (people.length > 0) {
    throw new Error(
      `Cannot delete family with ${people.length} active person records. ` +
      `Please deactivate or remove all person records first.`
    );
  }
  
  // Check for active paid subscription
  if (
    family.subscription_tier !== 'free' && 
    !['cancelled', 'expired'].includes(family.subscription_status)
  ) {
    throw new Error(
      'Cannot delete family with active paid subscription. ' +
      'Please cancel subscription first.'
    );
  }
  
  return true;
}
