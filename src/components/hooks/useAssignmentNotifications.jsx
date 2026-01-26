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
    // Real-time subscriptions temporarily disabled
    // TODO: Re-enable when SDK subscription support is confirmed
    return;
  }, [familyId, enabled]);
}