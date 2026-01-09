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
      
      // Check each entity type for updates
      const entityTypes = ['Person', 'Chore', 'Assignment', 'Reward', 'RedeemableItem', 'FamilyGoal'];
      
      for (const entityType of entityTypes) {
        const lastCheck = lastCheckRef.current[entityType] || new Date(0).toISOString();
        
        // Query for items updated since last check
        const updated = await base44.entities[entityType].filter({
          family_id: familyId,
        });

        // Check if any items were updated after our last check
        const hasUpdates = updated.some(item => item.updated_date > lastCheck);
        
        if (hasUpdates) {
          // Invalidate relevant queries to trigger refetch
          queryClient.invalidateQueries({ queryKey: [entityType.toLowerCase()] });
          console.log(`[RealTimeSync] Detected updates in ${entityType}`);
          
          // Call the onUpdate callback if provided (for non-React Query contexts)
          if (onUpdate) {
            onUpdate();
          }
        }
        
        lastCheckRef.current[entityType] = now;
      }

      // Reset backoff on success
      backoffRef.current = 1;
      
    } catch (error) {
      console.error('[RealTimeSync] Error checking for updates:', error);
      // Exponential backoff on error (up to 32 seconds)
      backoffRef.current = Math.min(backoffRef.current * 2, 32);
    }
  }, [familyId, enabled, queryClient]);

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
    if (!familyId || !enabled) return;

    // Initial check
    checkForUpdates();

    // Poll every 5 seconds (or with backoff if errors)
    intervalRef.current = setInterval(() => {
      checkForUpdates();
    }, 5000 * backoffRef.current);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [familyId, enabled, checkForUpdates]);

  return { checkForUpdates };
}