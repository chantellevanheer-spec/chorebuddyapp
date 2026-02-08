import React, { createContext, useState, useEffect, useCallback, useContext, useRef } from 'react';
import { Person } from "@/entities/Person";
import { Chore } from "@/entities/Chore";
import { Assignment } from "@/entities/Assignment";
import { Reward } from "@/entities/Reward";
import { RedeemableItem } from "@/entities/RedeemableItem";
import { User } from "@/entities/User";
import { FamilyGoal } from "@/entities/FamilyGoal";
import { ChoreCompletion } from "@/entities/ChoreCompletion";
import { Family } from "@/entities/Family";
import { Achievement } from "@/entities/Achievement";
import { useRealTimeSync } from '../hooks/useRealTimeSync';
import { useAssignmentNotifications } from '../hooks/useAssignmentNotifications';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { offlineStorage, STORES } from '../utils/offlineStorage';
import { canManageFamily as canManageFamilyUtil, isFamilyOwner as isFamilyOwnerUtil } from '@/utils/familyHelpers';
import { listForFamily } from '@/utils/entityHelpers';
import { toast } from "sonner";

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  // Core state
  const [people, setPeople] = useState([]);
  const [chores, setChores] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [items, setItems] = useState([]);
  const [goals, setGoals] = useState([]);
  const [completions, setCompletions] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [user, setUser] = useState(null);
  const [family, setFamily] = useState(null);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  
  // Refs for preventing race conditions
  const initializeFamilyRef = useRef(null);
  const familyInitializedRef = useRef(false);
  const isFetchingRef = useRef(false);

  // Offline sync hook
  const { 
    isOnline, 
    isSyncing, 
    pendingOperations, 
    syncNow, 
    loadPendingCount 
  } = useOfflineSync(user, () => fetchData());

  /**
   * Initialize family for new users
   */
  const initializeFamily = useCallback(async (userData) => {
    // Skip if already has family or initialization in progress
    if (familyInitializedRef.current || userData.family_id) {
      return userData.family_id;
    }
    
    // Return existing promise if already in progress
    if (initializeFamilyRef.current) {
      return initializeFamilyRef.current;
    }
    
    console.log("[DataContext] Creating family for user:", userData.id);
    
    initializeFamilyRef.current = (async () => {
      try {
        // Create family (linking code generated via backend familyLinking function)
        const newFamily = await Family.create({
          name: `${userData.full_name || 'My'}'s Family`,
          owner_user_id: userData.id,
          members: [userData.id],
          member_count: 1,
          subscription_tier: userData.subscription_tier || 'free',
          subscription_status: 'active',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
          currency: 'USD',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

        console.log("[DataContext] Family created:", newFamily.id);

        // Auto-create a Person record for the parent so they appear
        // as a family member immediately (no manual linking needed)
        const parentPerson = await Person.create({
          name: userData.full_name || 'Parent',
          family_id: newFamily.id,
          role: 'parent',
          is_active: true,
          points_balance: 0,
          total_points_earned: 0,
          chores_completed_count: 0,
          current_streak: 0,
          best_streak: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

        console.log("[DataContext] Parent person created:", parentPerson.id);

        // Update user with family_id
        await User.updateMyUserData({
          family_id: newFamily.id,
          family_role: 'parent'
        });

        console.log("[DataContext] User linked to family:", newFamily.id);
        familyInitializedRef.current = true;
        
        // Set family state
        setFamily(newFamily);
        
        return newFamily.id;
      } catch (error) {
        console.error("[DataContext] Error creating family:", error);
        initializeFamilyRef.current = null;
        familyInitializedRef.current = false;
        toast.error("Failed to create family. Please try again.");
        throw error;
      }
    })();
    
    return initializeFamilyRef.current;
  }, []);

  /**
   * Fetch all data for the current user's family
   */
  const fetchData = useCallback(async (forceOnline = false) => {
    // Prevent concurrent fetches
    if (isFetchingRef.current) {
      console.log("[DataContext] Fetch already in progress, skipping");
      return;
    }

    isFetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      // 1. Get current user
      const userData = await User.me().catch(() => null);
      
      if (!userData) {
        console.log("[DataContext] No user authenticated");
        setUser(null);
        setFamily(null);
        setPeople([]);
        setChores([]);
        setAssignments([]);
        setRewards([]);
        setItems([]);
        setGoals([]);
        setCompletions([]);
        setAchievements([]);
        return;
      }

      console.log("[DataContext] User loaded:", userData.id);

      // 2. Load from offline cache if offline
      if (!isOnline && !forceOnline) {
        console.log("[DataContext] Loading from offline cache");
        try {
          const [
            cachedPeople, 
            cachedChores, 
            cachedAssignments,
            cachedRewards,
            cachedItems
          ] = await Promise.all([
            offlineStorage.getData(STORES.PEOPLE),
            offlineStorage.getData(STORES.CHORES),
            offlineStorage.getData(STORES.ASSIGNMENTS),
            offlineStorage.getData(STORES.REWARDS),
            offlineStorage.getData(STORES.ITEMS)
          ]);

          const hasOfflineData = 
            cachedPeople.length > 0 || 
            cachedChores.length > 0 || 
            cachedAssignments.length > 0;

          if (hasOfflineData) {
            setPeople(cachedPeople);
            setChores(cachedChores);
            setAssignments(cachedAssignments);
            setRewards(cachedRewards);
            setItems(cachedItems);
            setUser(userData);
            toast.info('Using offline data');
            return;
          }
        } catch (error) {
          console.error("[DataContext] Failed to load offline cache:", error);
        }
      }

      // 3. Initialize family if needed
      if (!userData.family_id) {
        console.log("[DataContext] User has no family, initializing...");
        const familyId = await initializeFamily(userData);
        userData.family_id = familyId;
      }
      
      setUser(userData);

      // 4. Verify family_id exists
      if (!userData.family_id) {
        console.warn("[DataContext] User has no family_id after initialization");
        setPeople([]);
        setChores([]);
        setAssignments([]);
        setRewards([]);
        setItems([]);
        setGoals([]);
        setCompletions([]);
        setAchievements([]);
        setFamily(null);
        return;
      }

      console.log("[DataContext] Fetching data for family:", userData.family_id);

      // 5. Fetch family data
      try {
        const familyData = await Family.get(userData.family_id);
        setFamily(familyData);
        console.log("[DataContext] Family loaded:", familyData.id);
      } catch (error) {
        console.error("[DataContext] Error loading family:", error);
        setFamily(null);
      }
      
      // 6. Fetch all entity data in parallel (scoped to user's family)
      const familyId = userData.family_id;
      const [
        peopleData,
        choresData,
        assignmentsData,
        rewardsData,
        itemsData,
        goalsData,
        completionsData,
        achievementsData
      ] = await Promise.all([
        listForFamily(Person, familyId, "name").catch(() => []),
        listForFamily(Chore, familyId, "title").catch(() => []),
        listForFamily(Assignment, familyId, "-created_date").catch(() => []),
        listForFamily(Reward, familyId, "-created_date").catch(() => []),
        listForFamily(RedeemableItem, familyId, "cost").catch(() => []),
        listForFamily(FamilyGoal, familyId, "-created_date").catch(() => []),
        listForFamily(ChoreCompletion, familyId, "-created_date").catch(() => []),
        listForFamily(Achievement, familyId, "-created_date").catch(() => [])
      ]);

      console.log("[DataContext] Data fetched:", {
        people: peopleData.length,
        chores: choresData.length,
        assignments: assignmentsData.length,
        rewards: rewardsData.length,
        items: itemsData.length,
        goals: goalsData.length,
        completions: completionsData.length,
        achievements: achievementsData.length
      });

      // 7. Update state
      setPeople(peopleData);
      setChores(choresData);
      setAssignments(assignmentsData);
      setRewards(rewardsData);
      setItems(itemsData);
      setGoals(goalsData);
      setCompletions(completionsData);
      setAchievements(achievementsData);

      // 8. Cache data for offline use
      if (isOnline) {
        try {
          await Promise.all([
            offlineStorage.saveData(STORES.PEOPLE, peopleData),
            offlineStorage.saveData(STORES.CHORES, choresData),
            offlineStorage.saveData(STORES.ASSIGNMENTS, assignmentsData),
            offlineStorage.saveData(STORES.REWARDS, rewardsData),
            offlineStorage.saveData(STORES.ITEMS, itemsData)
          ]);
          console.log("[DataContext] Data cached for offline use");
        } catch (error) {
          console.error("[DataContext] Failed to cache data:", error);
        }
      }

    } catch (error) {
      console.error("[DataContext] Error loading data:", error);
      setError(error.message || "Failed to load data");
      toast.error("Failed to load data. Please refresh the page.");
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [initializeFamily, isOnline]);

  // Initial data load
  useEffect(() => {
    fetchData();
  }, []); // Only run once on mount

  /**
   * Generic wrapper for processing operations
   */
  const wrapProcessing = useCallback(async (asyncFunction, successMessage = null) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const result = await asyncFunction();
      
      // Refresh data after successful operation
      await fetchData();
      
      if (successMessage) {
        toast.success(successMessage);
      }
      
      return result;
    } catch (error) {
      console.error("[DataContext] Error during processing:", error);
      setError(error.message);
      toast.error(error.message || "An error occurred. Please try again.");
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [fetchData]);

  /**
   * Validate user has family before operations
   */
  const ensureFamily = useCallback(async () => {
    const currentUser = await User.me();
    
    if (!currentUser.family_id) {
      throw new Error("No family found. Please refresh the page.");
    }
    
    return currentUser.family_id;
  }, []);

  // ==========================================
  // PERSON ACTIONS
  // ==========================================

  const addPerson = useCallback((data) => 
    wrapProcessing(async () => {
      const familyId = await ensureFamily();
      console.log("[DataContext] Adding person to family:", familyId);
      
      const newPerson = await Person.create({ 
        ...data, 
        family_id: familyId,
        is_active: true,
        points_balance: 0,
        total_points_earned: 0,
        chores_completed_count: 0,
        current_streak: 0,
        best_streak: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      console.log("[DataContext] Person created:", newPerson.id);
      return newPerson;
    }, "Family member added!")
  , [wrapProcessing, ensureFamily]);

  const updatePerson = useCallback((id, data) => 
    wrapProcessing(
      () => Person.update(id, {
        ...data,
        updated_at: new Date().toISOString()
      }),
      "Family member updated!"
    )
  , [wrapProcessing]);

  const deletePerson = useCallback((id) => 
    wrapProcessing(
      () => Person.delete(id),
      "Family member removed"
    )
  , [wrapProcessing]);

  // ==========================================
  // CHORE ACTIONS
  // ==========================================

  const addChore = useCallback((data) => 
    wrapProcessing(async () => {
      const familyId = await ensureFamily();
      
      const newChore = await Chore.create({ 
        ...data, 
        family_id: familyId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      console.log("[DataContext] Chore created:", newChore.id);
      return newChore;
    }, "Chore added!")
  , [wrapProcessing, ensureFamily]);

  const updateChore = useCallback((id, data) => 
    wrapProcessing(
      () => Chore.update(id, {
        ...data,
        updated_at: new Date().toISOString()
      }),
      "Chore updated!"
    )
  , [wrapProcessing]);

  const deleteChore = useCallback((id) => 
    wrapProcessing(
      () => Chore.delete(id),
      "Chore deleted"
    )
  , [wrapProcessing]);

  // ==========================================
  // ASSIGNMENT ACTIONS (with offline support)
  // ==========================================

  const updateAssignment = useCallback(async (id, data) => {
    // Offline mode
    if (!isOnline) {
      console.log("[DataContext] Updating assignment offline:", id);
      
      // Update local state
      setAssignments(prev => 
        prev.map(a => a.id === id ? { ...a, ...data, updated_at: new Date().toISOString() } : a)
      );
      
      // Save to offline storage
      await offlineStorage.updateItem(STORES.ASSIGNMENTS, id, data);
      
      // Queue for sync when online
      await offlineStorage.addToSyncQueue({
        type: 'update_assignment',
        data: { id, updates: data }
      });
      
      await loadPendingCount();
      toast.success('Saved offline (will sync when online)');
      return;
    }
    
    // Online mode
    return wrapProcessing(
      () => Assignment.update(id, {
        ...data,
        updated_at: new Date().toISOString()
      }),
      null // Don't show success toast for assignment updates (too frequent)
    );
  }, [isOnline, wrapProcessing, loadPendingCount]);

  const createAssignment = useCallback((data) => 
    wrapProcessing(async () => {
      const familyId = await ensureFamily();
      
      const newAssignment = await Assignment.create({
        ...data,
        family_id: familyId,
        completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      console.log("[DataContext] Assignment created:", newAssignment.id);
      return newAssignment;
    }, "Chore assigned!")
  , [wrapProcessing, ensureFamily]);

  const deleteAssignment = useCallback((id) => 
    wrapProcessing(
      () => Assignment.delete(id),
      "Assignment removed"
    )
  , [wrapProcessing]);

  // ==========================================
  // REDEEMABLE ITEM ACTIONS
  // ==========================================

  const addItem = useCallback((data) => 
    wrapProcessing(async () => {
      const familyId = await ensureFamily();
      
      const newItem = await RedeemableItem.create({ 
        ...data, 
        family_id: familyId,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      console.log("[DataContext] Item created:", newItem.id);
      return newItem;
    }, "Reward item added!")
  , [wrapProcessing, ensureFamily]);

  const updateItem = useCallback((id, data) => 
    wrapProcessing(
      () => RedeemableItem.update(id, {
        ...data,
        updated_at: new Date().toISOString()
      }),
      "Reward item updated!"
    )
  , [wrapProcessing]);

  const deleteItem = useCallback((id) => 
    wrapProcessing(
      () => RedeemableItem.delete(id),
      "Reward item deleted"
    )
  , [wrapProcessing]);

  // ==========================================
  // REWARD/PENALTY ACTIONS
  // ==========================================

  const addReward = useCallback((data) => 
    wrapProcessing(async () => {
      const familyId = await ensureFamily();
      
      const newReward = await Reward.create({ 
        ...data, 
        family_id: familyId,
        created_at: new Date().toISOString()
      });
      
      console.log("[DataContext] Reward created:", newReward.id);
      
      // Update family statistics
      if (family && data.points !== 0) {
        try {
          const newStats = {
            ...family.statistics,
            total_points_awarded: (family.statistics?.total_points_awarded || 0) + Math.max(0, data.points),
            last_activity_at: new Date().toISOString()
          };
          
          await Family.update(family.id, { statistics: newStats });
          setFamily(prev => ({ ...prev, statistics: newStats }));
        } catch (error) {
          console.error("[DataContext] Failed to update family stats:", error);
        }
      }
      
      return newReward;
    }, data.points > 0 ? "Points awarded!" : "Points deducted")
  , [wrapProcessing, ensureFamily, family]);

  const deleteReward = useCallback((id) => 
    wrapProcessing(
      () => Reward.delete(id),
      "Reward deleted"
    )
  , [wrapProcessing]);

  // ==========================================
  // FAMILY GOAL ACTIONS
  // ==========================================

  const addGoal = useCallback((data) => 
    wrapProcessing(async () => {
      const familyId = await ensureFamily();
      
      const newGoal = await FamilyGoal.create({ 
        ...data, 
        family_id: familyId,
        status: 'active',
        current_points: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      console.log("[DataContext] Goal created:", newGoal.id);
      return newGoal;
    }, "Family goal created!")
  , [wrapProcessing, ensureFamily]);

  const updateGoal = useCallback((id, data) => 
    wrapProcessing(
      () => FamilyGoal.update(id, {
        ...data,
        updated_at: new Date().toISOString()
      }),
      "Goal updated!"
    )
  , [wrapProcessing]);

  const deleteGoal = useCallback((id) => 
    wrapProcessing(
      () => FamilyGoal.delete(id),
      "Goal deleted"
    )
  , [wrapProcessing]);

  // ==========================================
  // CHORE COMPLETION ACTIONS
  // ==========================================

  const addCompletion = useCallback((data) => 
    wrapProcessing(async () => {
      const familyId = await ensureFamily();
      
      const newCompletion = await ChoreCompletion.create({ 
        ...data, 
        family_id: familyId,
        created_at: new Date().toISOString()
      });
      
      console.log("[DataContext] Completion logged:", newCompletion.id);
      
      // Update family statistics
      if (family) {
        try {
          const newStats = {
            ...family.statistics,
            total_chores_completed: (family.statistics?.total_chores_completed || 0) + 1,
            current_week_completions: (family.statistics?.current_week_completions || 0) + 1,
            last_activity_at: new Date().toISOString()
          };
          
          await Family.update(family.id, { statistics: newStats });
          setFamily(prev => ({ ...prev, statistics: newStats }));
        } catch (error) {
          console.error("[DataContext] Failed to update family stats:", error);
        }
      }
      
      return newCompletion;
    }, "Chore completed!")
  , [wrapProcessing, ensureFamily, family]);

  // ==========================================
  // FAMILY ACTIONS
  // ==========================================

  const updateFamily = useCallback((data) => 
    wrapProcessing(async () => {
      if (!family) {
        throw new Error("No family loaded");
      }
      
      // Check permissions
      if (!canManageFamilyUtil(user, family)) {
        throw new Error("Only owners and co-owners can update family settings");
      }
      
      const updatedFamily = await Family.update(family.id, {
        ...data,
        updated_at: new Date().toISOString()
      });
      
      setFamily(updatedFamily);
      return updatedFamily;
    }, "Family settings updated!")
  , [wrapProcessing, family, user]);

  // ==========================================
  // UTILITY FUNCTIONS
  // ==========================================

  /**
   * Check if user can manage family (owner or co-owner)
   * Delegates to the shared utility in familyHelpers.js
   */
  const canManageFamily = useCallback(() => {
    return canManageFamilyUtil(user, family);
  }, [user, family]);

  /**
   * Check if user is family owner
   * Delegates to the shared utility in familyHelpers.js
   */
  const isFamilyOwner = useCallback(() => {
    return isFamilyOwnerUtil(user, family);
  }, [user, family]);

  /**
   * Get person by user ID
   */
  const getPersonByUserId = useCallback((userId) => {
    return people.find(p => p.linked_user_id === userId);
  }, [people]);

  /**
   * Get current user's person record
   */
  const getCurrentPerson = useCallback(() => {
    if (!user) return null;
    return people.find(p => p.linked_user_id === user.id);
  }, [user, people]);

  /**
   * Refresh data (force from server)
   */
  const refresh = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  // ==========================================
  // CONTEXT VALUE
  // ==========================================

  const value = {
    // Core data
    people,
    chores,
    assignments,
    rewards,
    items,
    goals,
    completions,
    achievements,
    user,
    family,
    
    // Loading states
    loading,
    isProcessing,
    error,
    
    // Offline support
    isOnline,
    isSyncing,
    pendingOperations,
    syncNow,
    
    // Data fetching
    fetchData,
    refresh,
    
    // Person actions
    addPerson,
    updatePerson,
    deletePerson,
    
    // Chore actions
    addChore,
    updateChore,
    deleteChore,
    
    // Assignment actions
    createAssignment,
    updateAssignment,
    deleteAssignment,
    
    // Item actions
    addItem,
    updateItem,
    deleteItem,
    
    // Reward actions
    addReward,
    deleteReward,
    
    // Goal actions
    addGoal,
    updateGoal,
    deleteGoal,
    
    // Completion actions
    addCompletion,
    
    // Family actions
    updateFamily,
    
    // Utility functions
    canManageFamily,
    isFamilyOwner,
    getPersonByUserId,
    getCurrentPerson,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
