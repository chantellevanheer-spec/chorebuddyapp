/**
 * Entity helper utilities
 * Common operations for working with Base44 entities
 */

/**
 * List all entities for a specific family
 * @param {Object} EntityClass - The entity class (e.g., Person, Chore)
 * @param {string} familyId - The family ID to filter by
 * @param {string} sortBy - Optional sort field (default: "-created_date")
 * @returns {Promise<Array>} List of entities
 */
export async function listForFamily(EntityClass, familyId, sortBy = "-created_date") {
  if (!familyId) {
    console.warn('[entityHelpers] No familyId provided, returning empty array');
    return [];
  }
  
  try {
    // Use list() with family_id filter
    const entities = await EntityClass.list();
    
    // Client-side filter by family_id
    const filtered = entities.filter(entity => entity.family_id === familyId);
    
    // Client-side sort if needed
    if (sortBy) {
      const isDescending = sortBy.startsWith('-');
      const field = isDescending ? sortBy.substring(1) : sortBy;
      
      filtered.sort((a, b) => {
        const aVal = a[field];
        const bVal = b[field];
        
        if (aVal < bVal) return isDescending ? 1 : -1;
        if (aVal > bVal) return isDescending ? -1 : 1;
        return 0;
      });
    }
    
    return filtered;
  } catch (error) {
    console.error(`[entityHelpers] Error listing ${EntityClass.name} for family ${familyId}:`, error);
    return [];
  }
}

/**
 * Get a single entity by ID with family validation
 * @param {Object} EntityClass - The entity class
 * @param {string} entityId - The entity ID
 * @param {string} familyId - The family ID to validate against
 * @returns {Promise<Object|null>} Entity or null if not found or wrong family
 */
export async function getForFamily(EntityClass, entityId, familyId) {
  if (!entityId || !familyId) {
    return null;
  }
  
  try {
    const entity = await EntityClass.get(entityId);
    
    // Verify entity belongs to family
    if (entity.family_id !== familyId) {
      console.warn(`[entityHelpers] Entity ${entityId} does not belong to family ${familyId}`);
      return null;
    }
    
    return entity;
  } catch (error) {
    console.error(`[entityHelpers] Error getting ${EntityClass.name} ${entityId}:`, error);
    return null;
  }
}