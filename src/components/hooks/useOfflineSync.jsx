import { useEffect, useState, useCallback, useRef } from 'react';
import { useOnlineStatus } from './useOnlineStatus';
import { offlineStorage } from '../utils/offlineStorage';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export const useOfflineSync = (user, fetchData) => {
  const isOnline = useOnlineStatus();
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingOperations, setPendingOperations] = useState(0);
  const syncInProgressRef = useRef(false);

  // Load pending operations count
  const loadPendingCount = useCallback(async () => {
    try {
      const queue = await offlineStorage.getSyncQueue();
      setPendingOperations(queue.length);
    } catch (error) {
      console.error('Failed to load pending operations:', error);
    }
  }, []);

  useEffect(() => {
    loadPendingCount();
  }, [loadPendingCount]);

  // Sync pending operations when coming back online
  const syncPendingOperations = useCallback(async () => {
    if (!isOnline || !user || syncInProgressRef.current) return;

    try {
      syncInProgressRef.current = true;
      setIsSyncing(true);

      const queue = await offlineStorage.getSyncQueue();
      if (queue.length === 0) {
        setIsSyncing(false);
        syncInProgressRef.current = false;
        return;
      }

      console.log(`[Sync] Processing ${queue.length} pending operations`);

      let successCount = 0;
      let failCount = 0;

      const userFamilyId = user.family_id;

      for (const operation of queue) {
        try {
          // Validate family_id on all operations to prevent cross-family data writes
          if (operation.data?.family_id && operation.data.family_id !== userFamilyId) {
            console.warn(`[Sync] Skipping operation ${operation.id}: family_id mismatch`);
            await offlineStorage.removeFromSyncQueue(operation.id);
            continue;
          }

          switch (operation.type) {
            case 'update_assignment': {
              // Verify the assignment belongs to this user's family before updating
              const assignment = await base44.asServiceRole.entities.Assignment.get(operation.data.id);
              if (assignment.family_id !== userFamilyId) {
                console.warn(`[Sync] Skipping assignment update: family_id mismatch`);
                await offlineStorage.removeFromSyncQueue(operation.id);
                break;
              }
              await base44.asServiceRole.entities.Assignment.update(
                operation.data.id,
                operation.data.updates
              );
              await offlineStorage.removeFromSyncQueue(operation.id);
              successCount++;
              break;
            }

            case 'create_reward':
              await base44.asServiceRole.entities.Reward.create({
                ...operation.data,
                family_id: userFamilyId
              });
              await offlineStorage.removeFromSyncQueue(operation.id);
              successCount++;
              break;

            case 'create_completion':
              await base44.asServiceRole.entities.ChoreCompletion.create({
                ...operation.data,
                family_id: userFamilyId
              });
              await offlineStorage.removeFromSyncQueue(operation.id);
              successCount++;
              break;

            default:
              console.warn(`Unknown operation type: ${operation.type}`);
              await offlineStorage.removeFromSyncQueue(operation.id);
          }
        } catch (error) {
          console.error(`Failed to sync operation ${operation.id}:`, error);
          failCount++;
          
          // If operation is too old (>7 days), remove it
          if (Date.now() - operation.timestamp > 7 * 24 * 60 * 60 * 1000) {
            console.warn(`Removing stale operation ${operation.id}`);
            await offlineStorage.removeFromSyncQueue(operation.id);
          }
        }
      }

      // Refresh data after sync
      if (successCount > 0) {
        await fetchData();
        await offlineStorage.setLastSyncTime(new Date().toISOString());
        toast.success(`Synced ${successCount} offline change${successCount > 1 ? 's' : ''}`);
      }

      if (failCount > 0) {
        toast.error(`Failed to sync ${failCount} operation${failCount > 1 ? 's' : ''}`);
      }

      await loadPendingCount();
    } catch (error) {
      console.error('Sync failed:', error);
      toast.error('Failed to sync offline changes');
    } finally {
      setIsSyncing(false);
      syncInProgressRef.current = false;
    }
  }, [isOnline, user, fetchData, loadPendingCount]);

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline && user) {
      const timer = setTimeout(() => {
        syncPendingOperations();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, user, syncPendingOperations]);

  return {
    isOnline,
    isSyncing,
    pendingOperations,
    syncNow: syncPendingOperations,
    loadPendingCount
  };
};