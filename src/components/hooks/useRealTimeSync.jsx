import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

/**
 * Real-time sync hook that polls for changes and updates React Query cache
 * Optimized with:
 * - Tab visibility detection (pauses when inactive)
 * - Exponential backoff on errors
 * - Change detection via updated_date timestamps
 */
export function useRealTimeSync(familyId, enabled = true, onUpdate = null) {
  const queryClient = useQueryClient();
  const intervalRef = useRef(null);
  const lastCheckRef = useRef({});
  const backoffRef = useRef(1);
  const isActiveRef = useRef(true);

  const checkForUpdates = useCallback(async () => {
    if (!familyId || !enabled || !isActiveRef.current) return;

    try {
      const now = new Date().toISOString();
      const entityTypes = ['Person', 'Chore', 'Assignment', 'Reward', 'RedeemableItem', 'FamilyGoal'];
      
      // Use Promise.all for parallel requests - much more efficient
      const results = await Promise.all(
        entityTypes.map(async (entityType) => {
          const lastCheck = lastCheckRef.current[entityType] || new Date(0).toISOString();
          
          try {
            // Fetch only recently updated items with server-side filtering
            const updated = await base44.entities[entityType].filter({
              family_id: familyId,
              updated_date__gt: lastCheck,
            });

            return { 
              entityType, 
              hasUpdates: updated.length > 0, 
              count: updated.length 
            };
          } catch (error) {
            console.error(`[RealTimeSync] Error checking ${entityType}:`, error);
            return { entityType, hasUpdates: false, error };
          }
        })
      );

      // Process results and invalidate queries
      let totalUpdates = 0;
      results.forEach(({ entityType, hasUpdates, count }) => {
        if (hasUpdates) {
          queryClient.invalidateQueries({ queryKey: [entityType.toLowerCase()] });
          console.log(`[RealTimeSync] Detected ${count} update(s) in ${entityType}`);
          totalUpdates += count || 0;
        }
        lastCheckRef.current[entityType] = now;
      });

      // Call onUpdate callback once if any updates detected
      if (totalUpdates > 0 && onUpdate) {
        onUpdate();
      }
      
      // Reset backoff on success
      backoffRef.current = 1;
      
    } catch (error) {
      console.error('[RealTimeSync] Critical error:', error);
      // Exponential backoff on error (up to 32 seconds)
      backoffRef.current = Math.min(backoffRef.current * 2, 32);
    }
  }, [familyId, enabled, queryClient, onUpdate]);

  // Handle tab visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      isActiveRef.current = !document.hidden;
      if (isActiveRef.current) {
        // Immediately check for updates when tab becomes active
        checkForUpdates();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [checkForUpdates]);

  // Start polling interval
  useEffect(() => {
    if (!familyId || !enabled) {
      // Cleanup on disable
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Initial check
    checkForUpdates();

    // Use setTimeout-based polling that re-evaluates backoff each cycle
    const scheduleNext = () => {
      intervalRef.current = setTimeout(() => {
        checkForUpdates().then(() => {
          if (familyId && enabled) {
            scheduleNext();
          }
        });
      }, 30000 * backoffRef.current);
    };
    scheduleNext();

    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
        intervalRef.current = null;
      }
      // Reset refs on cleanup
      lastCheckRef.current = {};
      backoffRef.current = 1;
    };
  }, [familyId, enabled, checkForUpdates]);

  return { checkForUpdates };
}