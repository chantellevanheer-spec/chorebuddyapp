/**
 * @deprecated Use entity.filter({ family_id }) instead.
 * The SDK's .filter() works reliably (proven in DataContext.jsx for 8+ entity types).
 * This wrapper delegates to the canonical implementation in components/utils/entityHelpers.jsx.
 */
export { listForFamily } from '@/components/utils/entityHelpers';
