import { useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Person } from '@/entities/Person';
import { Chore } from '@/entities/Chore';
import { toast } from 'sonner';

/**
 * Real-time assignment notifications using Base44 subscriptions
 * Shows toast notifications when chore assignments change
 */
export function useAssignmentNotifications(familyId, enabled = true) {
  const peopleRef = useRef({});
  const choresRef = useRef({});
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!familyId || !enabled) return;

    // Load reference data for names
    const loadReferenceData = async () => {
      try {
        const [people, chores] = await Promise.all([
          Person.list(),
          Chore.list()
        ]);
        
        peopleRef.current = people.reduce((acc, p) => {
          acc[p.id] = p.name;
          return acc;
        }, {});
        
        choresRef.current = chores.reduce((acc, c) => {
          acc[c.id] = c.title;
          return acc;
        }, {});
        
        initializedRef.current = true;
      } catch (error) {
        console.error('[AssignmentNotifications] Failed to load reference data:', error);
      }
    };

    loadReferenceData();

    // Subscribe to assignment changes
    const unsubscribe = base44.entities.Assignment.subscribe((event) => {
      if (!initializedRef.current) return;
      
      const { type, data } = event;
      const personName = peopleRef.current[data?.person_id] || 'Someone';
      const choreName = choresRef.current[data?.chore_id] || 'a chore';

      switch (type) {
        case 'create':
          toast.success(`🎯 New chore assigned!`, {
            description: `${personName} has been assigned "${choreName}"`,
            duration: 5000,
          });
          break;
          
        case 'update':
          if (data?.completed && data?.approval_status !== 'rejected') {
            toast.success(`✅ Chore completed!`, {
              description: `${personName} finished "${choreName}"`,
              duration: 5000,
            });
          } else if (data?.approval_status === 'approved') {
            toast.success(`🌟 Chore approved!`, {
              description: `"${choreName}" was approved for ${personName}`,
              duration: 5000,
            });
          } else if (data?.approval_status === 'rejected') {
            toast.warning(`⚠️ Chore needs redo`, {
              description: `"${choreName}" needs another try from ${personName}`,
              duration: 5000,
            });
          }
          break;
          
        case 'delete':
          toast.info(`🗑️ Assignment removed`, {
            description: `"${choreName}" was unassigned from ${personName}`,
            duration: 4000,
          });
          break;
      }
    });

    return () => {
      unsubscribe();
    };
  }, [familyId, enabled]);
}