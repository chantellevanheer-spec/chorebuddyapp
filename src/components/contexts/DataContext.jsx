import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
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
  const [people, setPeople] = useState([]);
  const [chores, setChores] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [items, setItems] = useState([]);
  const [goals, setGoals] = useState([]);
  const [completions, setCompletions] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Use refs to prevent race conditions during family initialization
  const initializeFamilyRef = React.useRef(null);
  const familyInitializedRef = React.useRef(false);

  // Offline sync hook
  const { isOnline, isSyncing, pendingOperations, syncNow, loadPendingCount } = useOfflineSync(user, () => fetchData());

  const initializeFamily = useCallback(async (userData) => {
    if (familyInitializedRef.current || userData.family_id) {
      return userData.family_id;
    }
    
    // Return existing promise if already in progress (prevents duplicate families)
    if (initializeFamilyRef.current) {
      return initializeFamilyRef.current;
    }
    
    console.log("[DataContext] Creating family for user...");
    
    initializeFamilyRef.current = (async () => {
      try {
        const family = await Family.create({
          name: `${userData.full_name}'s Family`,
          owner_user_id: userData.id,
          members: [userData.id],
          subscription_tier: userData.subscription_tier || 'free'
        });
        console.log("[DataContext] Family created:", family);

        await User.updateMyUserData({ 
          family_id: family.id,
          family_role: 'parent'
        });
        
        console.log("[DataContext] User updated with family_id:", family.id);
        familyInitializedRef.current = true;
        return family.id;
      } catch (error) {
        console.error("[DataContext] Error creating family:", error);
        initializeFamilyRef.current = null; // Reset on error to allow retry
        toast.error("Failed to create family. Please refresh and try again.");
        throw error;
      }
    })();
    
    return initializeFamilyRef.current;
  }, []);

  const fetchData = useCallback(async (forceOnline = false) => {
    setLoading(true);
    try {
      const userData = await User.me().catch(() => null);
      console.log("[DataContext] User data:", userData);

      if (!userData) {
        setUser(null);
        setLoading(false);
        return;
      }

      // If offline and not forcing online fetch, load from cache
      if (!isOnline && !forceOnline) {
        console.log("[DataContext] Loading from offline cache");
        try {
          const [cachedPeople, cachedChores, cachedAssignments] = await Promise.all([
            offlineStorage.getData(STORES.PEOPLE),
            offlineStorage.getData(STORES.CHORES),
            offlineStorage.getData(STORES.ASSIGNMENTS)
          ]);

          if (cachedPeople.length > 0 || cachedChores.length > 0 || cachedAssignments.length > 0) {
            setPeople(cachedPeople);
            setChores(cachedChores);
            setAssignments(cachedAssignments);
            setUser(userData);
            setLoading(false);
            toast.info('Using offline data');
            return;
          }
        } catch (error) {
          console.error("[DataContext] Failed to load offline cache:", error);
        }
      }

      // Initialize family once if needed
      if (!userData.family_id) {
        const familyId = await initializeFamily(userData);
        userData.family_id = familyId;
      }
      
      setUser(userData);

      if (!userData.family_id) {
        console.warn("[DataContext] User has no family_id after initialization");
        setPeople([]);
        setChores([]);
        setAssignments([]);
        setRewards([]);
        setItems([]);
        setGoals([]);
        setCompletions([]);
        setLoading(false);
        return;
      }

      console.log("[DataContext] Fetching data for family_id:", userData.family_id);
      
      const [peopleData, choresData, assignmentsData, rewardsData, itemsData, goalsData, completionsData] = await Promise.all([
        Person.list("name"),
        Chore.list("title"),
        Assignment.list("-created_date"),
        Reward.list("-created_date"),
        RedeemableItem.list("cost"),
        FamilyGoal.list("-created_date"),
        ChoreCompletion.list("-created_date")
      ]);

      console.log("[DataContext] Fetched people:", peopleData);

      setPeople(peopleData);
      setChores(choresData);
      setAssignments(assignmentsData);
      setRewards(rewardsData);
      setItems(itemsData);
      setGoals(goalsData);
      setCompletions(completionsData);

      // Cache data for offline use
      if (isOnline) {
        try {
          await Promise.all([
            offlineStorage.saveData(STORES.PEOPLE, peopleData),
            offlineStorage.saveData(STORES.CHORES, choresData),
            offlineStorage.saveData(STORES.ASSIGNMENTS, assignmentsData)
          ]);
          console.log("[DataContext] Data cached for offline use");
        } catch (error) {
          console.error("[DataContext] Failed to cache data:", error);
        }
      }
    } catch (error) {
      console.error("[DataContext] Error loading data:", error);
      toast.error("Failed to load data. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  }, [initializeFamily, isOnline]);

  useEffect(() => {
    fetchData();
  }, []);

  // Real-time sync temporarily disabled to prevent rate limiting
  // useRealTimeSync(user?.family_id, !!user?.family_id, fetchData);

  // Real-time notifications temporarily disabled
  // useAssignmentNotifications(user?.family_id, !!user?.family_id);

  const wrapProcessing = async (asyncFunction) => {
    setIsProcessing(true);
    try {
      await asyncFunction();
      await fetchData();
    } catch (error) {
      console.error("[DataContext] Error during processing:", error);
      toast.error(error.message || "An error occurred. Please try again.");
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  // Person Actions
  const addPerson = (data) => wrapProcessing(async () => {
    // Re-fetch user to ensure we have the latest family_id
    const currentUser = await User.me();
    
    if (!currentUser.family_id) {
      throw new Error("Cannot add person: No family found. Please refresh the page.");
    }
    
    console.log("[DataContext] Adding person with family_id:", currentUser.family_id, "data:", data);
    const newPerson = await Person.create({ ...data, family_id: currentUser.family_id });
    console.log("[DataContext] Person created:", newPerson);
  });

  const updatePerson = (id, data) => wrapProcessing(() => Person.update(id, data));
  const deletePerson = (id) => wrapProcessing(() => Person.delete(id));

  // Chore Actions
  const addChore = (data) => wrapProcessing(async () => {
    const currentUser = await User.me();
    if (!currentUser.family_id) {
      throw new Error("Cannot add chore: No family found. Please refresh the page.");
    }
    await Chore.create({ ...data, family_id: currentUser.family_id });
  });

  const updateChore = (id, data) => wrapProcessing(() => Chore.update(id, data));
  const deleteChore = (id) => wrapProcessing(() => Chore.delete(id));

  // Assignment Actions (with offline support)
  const updateAssignment = async (id, data) => {
    if (!isOnline) {
      // Update locally
      const updatedAssignments = assignments.map(a => 
        a.id === id ? { ...a, ...data } : a
      );
      setAssignments(updatedAssignments);
      
      // Save to offline storage
      await offlineStorage.updateItem(STORES.ASSIGNMENTS, id, data);
      
      // Queue for sync
      await offlineStorage.addToSyncQueue({
        type: 'update_assignment',
        data: { id, updates: data }
      });
      
      await loadPendingCount();
      toast.success('Saved offline (will sync when online)');
      return;
    }
    
    return wrapProcessing(() => Assignment.update(id, data));
  };

  // Reward Item Actions
  const addItem = (data) => wrapProcessing(async () => {
    const currentUser = await User.me();
    if (!currentUser.family_id) {
      throw new Error("Cannot add item: No family found. Please refresh the page.");
    }
    await RedeemableItem.create({ ...data, family_id: currentUser.family_id });
  });

  const updateItem = (id, data) => wrapProcessing(() => RedeemableItem.update(id, data));
  const deleteItem = (id) => wrapProcessing(() => RedeemableItem.delete(id));

  // Reward/Penalty Actions
  const addReward = (data) => wrapProcessing(async () => {
    const currentUser = await User.me();
    if (!currentUser.family_id) {
      throw new Error("Cannot add reward: No family found. Please refresh the page.");
    }
    await Reward.create({ ...data, family_id: currentUser.family_id });
  });

  // Goal Actions
  const addGoal = (data) => wrapProcessing(async () => {
    const currentUser = await User.me();
    if (!currentUser.family_id) {
      throw new Error("Cannot add goal: No family found. Please refresh the page.");
    }
    await FamilyGoal.create({ ...data, family_id: currentUser.family_id });
  });

  const updateGoal = (id, data) => wrapProcessing(() => FamilyGoal.update(id, data));
  const deleteGoal = (id) => wrapProcessing(() => FamilyGoal.delete(id));

  // Completion Actions
  const addCompletion = (data) => wrapProcessing(async () => {
    const currentUser = await User.me();
    if (!currentUser.family_id) {
      throw new Error("Cannot add completion: No family found. Please refresh the page.");
    }
    await ChoreCompletion.create({ ...data, family_id: currentUser.family_id });
  });

  const value = {
    people,
    chores,
    assignments,
    rewards,
    items,
    goals,
    completions,
    user,
    loading,
    isProcessing,
    fetchData,
    // Offline support
    isOnline,
    isSyncing,
    pendingOperations,
    syncNow,
    // Actions
    addPerson,
    updatePerson,
    deletePerson,
    addChore,
    updateChore,
    deleteChore,
    updateAssignment,
    addItem,
    updateItem,
    deleteItem,
    addReward,
    addGoal,
    updateGoal,
    deleteGoal,
    addCompletion,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};