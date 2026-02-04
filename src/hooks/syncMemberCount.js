/**
 * Keep member_count in sync with members array
 */
export async function syncMemberCount(data, existingData, context) {
  if (data.members && Array.isArray(data.members)) {
    data.member_count = data.members.length;
    
    // Validate owner is in members
    if (!data.members.includes(existingData.owner_user_id)) {
      throw new Error('Owner must remain in members array');
    }
    
    // Validate co-owners are in members
    if (data.co_owners) {
      const invalidCoOwners = data.co_owners.filter(
        coOwner => !data.members.includes(coOwner)
      );
      
      if (invalidCoOwners.length > 0) {
        throw new Error('All co-owners must be in members array');
      }
    }
  }
