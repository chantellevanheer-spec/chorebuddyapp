/**
 * Archive family data before deletion
 */
export async function archiveFamilyData(familyId, context) {
  const family = await context.entities.Family.get(familyId);
  
  // Create archive record
  const archive = {
    family_id: familyId,
    family_name: family.name,
    owner_user_id: family.owner_user_id,
    member_count: family.member_count,
    subscription_tier: family.subscription_tier,
    statistics: family.statistics,
    deleted_at: new Date().toISOString(),
    archived_data: JSON.stringify(family)
  };
  
  // Store in archive table (if you have one)
  try {
    await context.entities.FamilyArchive.create(archive);
    console.log(`Family ${familyId} archived successfully`);
  } catch (error) {
    console.error(`Failed to archive family ${familyId}:`, error);
    // Don't block deletion if archive fails, just log
  }
  
  return true;
}
