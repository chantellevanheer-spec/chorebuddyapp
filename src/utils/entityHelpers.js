/**
 * @deprecated Use entity.filter({ family_id }) instead.
 * The SDK's .filter() works reliably (proven in DataContext.jsx for 8+ entity types).
 * This function used .list() which fetches ALL records from all families — a data exposure risk.
 */
export async function listForFamily(entity, familyId, sort) {
  const filtered = await entity.filter({ family_id: familyId });
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

  console.warn('[listForFamily] All retries failed, returning []:', lastError?.message || lastError);
  return [];
}
