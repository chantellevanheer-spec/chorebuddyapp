/**
 * Fetch entities scoped to a family using .list() + client-side filtering & sorting.
 *
 * The frontend SDK's .filter() and .list(sort) can return 500 from the Base44 API,
 * so we fetch everything with .list() (no params) and handle filtering + sorting in JS.
 *
 * Includes retry with backoff for transient API failures (500s, network errors)
 * and graceful handling of non-JSON responses (e.g. SyntaxError from API).
 *
 * @param {Object} entity  - SDK entity (e.g. Person, Chore)
 * @param {string} familyId - The family_id to filter by
 * @param {string} [sort]  - Optional sort field (prefix with '-' for descending)
 * @returns {Promise<Array>}
 */
export async function listForFamily(entity, familyId, sort) {
  let lastError;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
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
    } catch (error) {
      lastError = error;

      // Don't retry on non-transient errors (SyntaxError = bad response body,
      // 4xx = client error). Only retry on 500s / network failures.
      const status = error?.response?.status || error?.status;
      const isTransient = status >= 500 || error.message?.includes('network') ||
        error.message?.includes('Network') || error.code === 'ERR_NETWORK';

      if (!isTransient) {
        console.warn('[listForFamily] Non-retryable error, returning []:', error.message || error);
        return [];
      }

      if (attempt < 2) {
        const delay = 1000 * Math.pow(2, attempt); // 1s, 2s
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  console.warn('[listForFamily] All retries failed, returning []:', lastError?.message || lastError);
  return [];
}
