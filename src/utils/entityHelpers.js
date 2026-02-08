/**
 * Fetch entities scoped to a family using .list() + client-side filtering.
 *
 * The frontend SDK's .filter() can return 500 from the Base44 API,
 * so we use .list(sort) and filter the results in JavaScript.
 *
 * @param {Object} entity  - SDK entity (e.g. Person, Chore)
 * @param {string} familyId - The family_id to filter by
 * @param {string} [sort]  - Optional sort field (prefix with '-' for descending)
 * @returns {Promise<Array>}
 */
export async function listForFamily(entity, familyId, sort) {
  const all = await entity.list(sort);
  return all.filter(item => item.family_id === familyId);
}
