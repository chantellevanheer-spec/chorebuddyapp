/**
 * Fetch entities scoped to a family using .list() + client-side filtering & sorting.
 *
 * The frontend SDK's .filter() and .list(sort) can return 500 from the Base44 API,
 * so we fetch everything with .list() (no params) and handle filtering + sorting in JS.
 *
 * @param {Object} entity  - SDK entity (e.g. Person, Chore)
 * @param {string} familyId - The family_id to filter by
 * @param {string} [sort]  - Optional sort field (prefix with '-' for descending)
 * @returns {Promise<Array>}
 */
export async function listForFamily(entity, familyId, sort) {
  const result = await entity.list();
  const all = Array.isArray(result) ? result : [];
  const filtered = all.filter(item => item.family_id === familyId);
  if (sort) {
    const desc = sort.startsWith('-');
    const field = desc ? sort.slice(1) : sort;
    filtered.sort((a, b) => {
      const aVal = a[field] ?? '';
      const bVal = b[field] ?? '';
      if (aVal < bVal) return desc ? 1 : -1;
      if (aVal > bVal) return desc ? -1 : 1;
      return 0;
    });
  }
  return filtered;
}
