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
import { useRealTimeSync } from '../hooks/useRealTimeSync';
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

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch user data first
      const userData = await User.me().catch(() => null);
      console.log("[DataContext] User data:", userData);
      setUser(userData);

      if (!userData) {
        setLoading(false);
        return;
      }

      // Initialize family if user doesn't have one
      if (!userData.family_id) {
        console.log("[DataContext] Creating family for user...");
        try {
          const family = await Family.create({
            name: `${userData.full_name}'s Family`,
            owner_user_id: userData.id,
            members: [userData.id],
            subscription_tier: userData.subscription_tier || 'free'
          });
          console.log("[DataContext] Family created:", family);

          // Update the user's family_id in the backend
          await User.updateMyUserData({ 
            family_id: family.id,
            family_role: userData.family_role || 'parent' // Set as parent when creating new family
          });
          
          // Re-fetch user to get updated family_id
          const updatedUserData = await User.me();
          setUser(updatedUserData);
          console.log("[DataContext] User updated with family_id:", updatedUserData.family_id);
        } catch (error) {
          console.error("[DataContext] Error creating family:", error);
          toast.error("Failed to create family. Please refresh and try again.");
          setLoading(false);
          return;
        }
      }

      // Re-fetch user one more time to ensure we have the latest family_id
      const currentUserData = await User.me();
      setUser(currentUserData);

      if (!currentUserData.family_id) {
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

      console.log("[DataContext] Fetching data for family_id:", currentUserData.family_id);
      
      // Fetch other data
      const [peopleData, choresData, assignmentsData, rewardsData, itemsData, goalsData, completionsData] = await Promise.all([
        Person.list("name"),
        Chore.list("title"),
        Assignment.list("-created_date"),
        Reward.list(),
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
    } catch (error) {
      console.error("[DataContext] Error loading data:", error);
      toast.error("Failed to load data. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Enable real-time sync for family data
  useRealTimeSync(user?.family_id, !!user?.family_id, fetchData);

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

  // Assignment Actions
  const updateAssignment = (id, data) => wrapProcessing(() => Assignment.update(id, data));

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