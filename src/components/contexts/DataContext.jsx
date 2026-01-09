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

  // Enable real-time sync for family data
  useRealTimeSync(user?.family_id, !!user?.family_id, fetchData);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch user data first
      const userData = await User.me().catch(() => null);
      setUser(userData);

      if (!userData) {
        // If no user is logged in, stop loading and return.
        setLoading(false);
        return;
      }

      // Initialize family if user doesn't have one and is a parent
      if (!userData.family_id && userData.family_role === 'parent') {
        try {
          const family = await Family.create({
            name: `${userData.full_name}'s Family`,
            owner_user_id: userData.id,
            members: [userData.id],
            subscription_tier: userData.subscription_tier || 'free' // Default to 'free' if not set
          });

          // Update the user's family_id in the backend and locally
          await User.updateMyUserData({ family_id: family.id });
          // Update the local userData object to reflect the new family_id
          userData.family_id = family.id;
          setUser(userData); // Update the state with the modified user object
        } catch (error) {
          console.error("Error creating family:", error);
          // Decide how to handle this error: maybe log out user, or show an error message
          setLoading(false);
          return; // Stop further data fetching if family creation fails
        }
      }

      // Fetch other data only if a user (and potentially a family) exists
      const [peopleData, choresData, assignmentsData, rewardsData, itemsData, goalsData, completionsData] = await Promise.all([
        Person.list("name"),
        Chore.list("title"),
        Assignment.list("-created_date"),
        Reward.list(),
        RedeemableItem.list("cost"),
        FamilyGoal.list("-created_date"),
        ChoreCompletion.list("-created_date")
      ]);

      setPeople(peopleData);
      setChores(choresData);
      setAssignments(assignmentsData);
      setRewards(rewardsData);
      setItems(itemsData);
      setGoals(goalsData);
      setCompletions(completionsData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const wrapProcessing = async (asyncFunction) => {
    setIsProcessing(true);
    try {
      await asyncFunction();
      await fetchData(); // Refresh all data after any modification
    } catch (error) {
      console.error("An error occurred during processing:", error);
      // Here you can also add toast notifications for errors
    } finally {
      setIsProcessing(false);
    }
  };

  // Person Actions
  const addPerson = (data) => wrapProcessing(async () => {
    const currentUser = await User.me(); // Fetch current user to get family_id
    await Person.create({ ...data, family_id: currentUser.family_id });
  });

  const updatePerson = (id, data) => wrapProcessing(() => Person.update(id, data));
  const deletePerson = (id) => wrapProcessing(() => Person.delete(id));

  // Chore Actions
  const addChore = (data) => wrapProcessing(async () => {
    const currentUser = await User.me(); // Fetch current user to get family_id
    await Chore.create({ ...data, family_id: currentUser.family_id });
  });

  const updateChore = (id, data) => wrapProcessing(() => Chore.update(id, data));
  const deleteChore = (id) => wrapProcessing(() => Chore.delete(id));

  // Assignment Actions
  const updateAssignment = (id, data) => wrapProcessing(() => Assignment.update(id, data));

  // Reward Item Actions
  const addItem = (data) => wrapProcessing(async () => {
    const currentUser = await User.me(); // Fetch current user to get family_id
    await RedeemableItem.create({ ...data, family_id: currentUser.family_id });
  });

  const updateItem = (id, data) => wrapProcessing(() => RedeemableItem.update(id, data));
  const deleteItem = (id) => wrapProcessing(() => RedeemableItem.delete(id));

  // Reward/Penalty Actions
  const addReward = (data) => wrapProcessing(async () => {
    const currentUser = await User.me(); // Fetch current user to get family_id
    await Reward.create({ ...data, family_id: currentUser.family_id });
  });

  // Goal Actions
  const addGoal = (data) => wrapProcessing(async () => {
    const currentUser = await User.me(); // Fetch current user to get family_id
    await FamilyGoal.create({ ...data, family_id: currentUser.family_id });
  });

  const updateGoal = (id, data) => wrapProcessing(() => FamilyGoal.update(id, data));
  const deleteGoal = (id) => wrapProcessing(() => FamilyGoal.delete(id));

  // Completion Actions
  const addCompletion = (data) => wrapProcessing(async () => {
    const currentUser = await User.me(); // Fetch current user to get family_id
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