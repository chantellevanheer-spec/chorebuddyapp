import React, { useState, useEffect } from 'react';
import { Person } from '@/entities/Person';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createPageUrl } from '@/utils';
import { Link as RouterLink, Link } from 'react-router-dom';
import { Loader2, User as UserIcon, Bell, Users, Settings, Shield, CreditCard, AlertCircle, Link2, Sparkles, Palette, Crown } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { stripeCheckout } from '@/functions/stripeCheckout';
import { linkUserToPerson } from '@/functions/linkUserToPerson';
import LinkAccountModal from '@/components/people/LinkAccountModal';
import OnboardingTour from '@/components/onboarding/OnboardingTour';
import AvatarSelector from '@/components/profile/AvatarSelector';
import ThemeSelector from '@/components/profile/ThemeSelector';
import { useTheme } from '@/components/contexts/ThemeContext';
import NotificationPreferences from '@/components/profile/NotificationPreferences';
import AccessibilitySettings from '@/components/profile/AccessibilitySettings';

export default function Account() {
  const [user, setUser] = useState(null);
  const [linkedPerson, setLinkedPerson] = useState(null);
  const [people, setPeople] = useState([]);
  const [family, setFamily] = useState(null);
  const [familyName, setFamilyName] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPortalRedirecting, setIsPortalRedirecting] = useState(false);
  const [isLinkModalOpen, setLinkModalOpen] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [avatarIcon, setAvatarIcon] = useState('user');
  const [chorePreferences, setChorePreferences] = useState({
    auto_assign_enabled: true,
    preferred_days: [],
    avoid_weekends: false
  });
  const [notificationPreferences, setNotificationPreferences] = useState({});
  const { currentTheme, updateTheme } = useTheme();

  // Determine effective subscription tier (child inherits parent's)
  const getEffectiveSubscriptionTier = () => {
    if (user?.family_role === 'child' && linkedPerson) {
      // Child uses parent's subscription
      return user?.data?.parent_subscription_tier || 'free';
    }
    return user?.subscription_tier || 'free';
  };

  const isPremium = getEffectiveSubscriptionTier() === 'premium';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await base44.auth.me();
        setUser({
          ...userData,
          receives_chore_reminders: userData.receives_chore_reminders ?? true,
          receives_achievement_alerts: userData.receives_achievement_alerts ?? true,
          receives_weekly_reports: userData.receives_weekly_reports ?? false,
          simplified_view: userData.simplified_view ?? (userData.family_role === 'child'),
          high_contrast: userData.high_contrast ?? false,
          text_size: userData.text_size ?? 'normal'
        });

        // Load personalization settings
        if (userData.data?.avatar) setAvatarIcon(userData.data.avatar);
        if (userData.data?.chore_preferences) {
          setChorePreferences(userData.data.chore_preferences);
        }
        if (userData.data?.notification_preferences) {
          setNotificationPreferences(userData.data.notification_preferences);
        }

        if (userData.family_id) {
          // Fetch family data using user's authentication
          const familyData = await base44.entities.Family.get(userData.family_id);
          setFamily(familyData);
          setFamilyName(familyData?.name || '');

          // Fetch family people
          const familyPeople = await Person.list();
          setPeople(familyPeople);

          // Find linked person
          const linked = familyPeople.find(p => p.linked_user_id === userData.id);
          setLinkedPerson(linked || null);
        }
      } catch (error) {
        console.error("Failed to fetch user data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleToggleChange = (field, value) => {
    setUser(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleSaveChanges = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      // Update built-in attributes separately
      await base44.auth.updateMe({
        family_role: user.family_role,
        receives_chore_reminders: user.receives_chore_reminders,
        receives_achievement_alerts: user.receives_achievement_alerts,
        receives_weekly_reports: user.receives_weekly_reports,
        simplified_view: user.simplified_view,
        high_contrast: user.high_contrast,
        text_size: user.text_size
      });
      
      // Update custom data fields
      await base44.auth.updateMe({
        data: {
          avatar: avatarIcon,
          chore_preferences: chorePreferences,
          notification_preferences: notificationPreferences
        }
      });

      // Update family name if it changed (parents only)
      if (family && familyName !== family.name) {
        if (user.family_role !== 'parent') {
          toast.error('Only parents can update the family name');
          return;
        }
        
        try {
          await base44.entities.Family.update(user.family_id, {
            name: familyName
          });
        } catch (error) {
          toast.error('Failed to update family name');
          console.error('Error updating family:', error);
          throw error;
        }
      }
      
      // Refresh user data to reflect updated family_role in RLS checks
      const updatedUser = await base44.auth.me();
      setUser({
        ...updatedUser,
        receives_chore_reminders: updatedUser.receives_chore_reminders ?? true,
        receives_achievement_alerts: updatedUser.receives_achievement_alerts ?? true,
        receives_weekly_reports: updatedUser.receives_weekly_reports ?? false,
        simplified_view: updatedUser.simplified_view ?? (updatedUser.family_role === 'child'),
        high_contrast: updatedUser.high_contrast ?? false,
        text_size: updatedUser.text_size ?? 'normal'
      });
      
      toast.success("Preferences saved!");
    } catch (error) {
      toast.error("Failed to save preferences.");
      console.error("Failed to save preferences:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleManageSubscription = async () => {
    setIsPortalRedirecting(true);
    try {
        const response = await stripeCheckout({ endpoint: 'create-portal-session' });
        if (response.data?.error) throw new Error(response.data.error);
        if (response.data?.url) {
            window.location.href = response.data.url;
        } else {
            throw new Error("Could not open customer portal. No URL provided.");
        }
    } catch (error) {
        toast.error(error.message || "Could not connect to subscription manager.");
        console.error("Error managing subscription:", error);
        setIsPortalRedirecting(false);
    }
  };

  const handleLinkAccount = async (personId) => {
    setIsLinking(true);
    try {
      const result = await linkUserToPerson({ personId });
      if (result.data.success) {
        toast.success("Account linked successfully!");
        setLinkModalOpen(false);
        
        // Refresh data
        const familyPeople = await Person.list();
        setPeople(familyPeople);
        const linked = familyPeople.find(p => p.id === personId);
        setLinkedPerson(linked || null);
      } else {
        toast.error(result.data.error || "Failed to link account");
      }
    } catch (error) {
      console.error("Error linking account:", error);
      toast.error(error.message || "Failed to link account");
    } finally {
      setIsLinking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-12 h-12 animate-spin text-[#C3B1E1]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="funky-card p-8 text-center">
        <h2 className="header-font text-2xl text-red-600">Could not load user profile.</h2>
        <p className="body-font-light text-gray-600">Please try logging in again.</p>
      </div>
    );
  }

  return (
    <>
      <LinkAccountModal
        isOpen={isLinkModalOpen}
        onClose={() => setLinkModalOpen(false)}
        people={people}
        onLink={handleLinkAccount}
        isProcessing={isLinking}
      />
      <div className="mx-4 md:mx-8 lg:mx-24 pb-32 space-y-8 lg:pb-8">
      {/* Header */}
      <div className="funky-card p-6 md:p-8">
        <div className="flex items-center gap-4 md:gap-6">
          <div className="funky-button w-16 h-16 md:w-20 md:h-20 bg-[#5E3B85] flex items-center justify-center">
            <Settings className="w-8 h-8 md:w-10 md:h-10 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="header-font text-4xl md:text-5xl text-[#2B59C3]">Account & Settings</h1>
            <p className="body-font-light text-gray-600 mt-2">Manage your profile, family, and preferences.</p>
          </div>
          <Button
            onClick={() => setShowOnboarding(true)}
            className="funky-button bg-[#C3B1E1] text-white hidden md:flex"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Restart Tour
          </Button>
        </div>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 funky-card p-2 h-auto">
          <TabsTrigger value="profile" className="mx-3 my-1 px-3 py-1 text-sm font-medium funky-button inline-flex items-center justify-center whitespace-nowrap rounded-sm ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm md:text-base">
            <UserIcon className="w-4 h-4 mr-2" /> Profile
          </TabsTrigger>
          {isPremium && (
            <TabsTrigger value="personalize" className="mx-3 my-1 px-3 py-1 text-sm font-medium funky-button inline-flex items-center justify-center whitespace-nowrap rounded-sm ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm md:text-base">
              <Crown className="w-4 h-4 mr-2" /> Personalize
            </TabsTrigger>
          )}
          <TabsTrigger value="preferences" className="mx-3 my-1 px-3 py-1 text-sm font-medium funky-button inline-flex items-center justify-center whitespace-nowrap rounded-sm ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm md:text-base">
            <Bell className="w-4 h-4 mr-2" /> Preferences
          </TabsTrigger>
          <TabsTrigger value="family" className="mx-3 my-1 px-3 py-1 text-sm font-medium funky-button inline-flex items-center justify-center whitespace-nowrap rounded-sm ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm md:text-base">
            <Users className="w-4 h-4 mr-2" /> Family
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          {/* Account Details */}
          <div className="funky-card p-8 mb-6">
            <h2 className="header-font text-3xl text-[#2B59C3] mb-6 flex items-center gap-3">
              <UserIcon className="w-8 h-8 text-[#FF6B35]" />
              Account Details
            </h2>
            <div className="space-y-4 body-font-light text-lg text-gray-700">
              <p><strong>Name:</strong> {user.full_name}</p>
              <p><strong>Email:</strong> {user.email}</p>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <label htmlFor="family-role" className="body-font text-lg text-[#5E3B85] mb-4 block">Family Role</label>
              <Select 
                value={user.family_role || 'parent'} 
                onValueChange={(value) => handleToggleChange('family_role', value)}
              >
                <SelectTrigger id="family-role" className="funky-button border-3 border-[#5E3B85] body-font bg-white max-w-xs">
                  <SelectValue placeholder="Select your role..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="parent">Parent / Guardian</SelectItem>
                  <SelectItem value="child">Teen / Child</SelectItem>
                </SelectContent>
              </Select>
              <p className="body-font-light text-sm text-gray-500 mt-2">
                Your role determines what features and permissions you have in the app
              </p>
            </div>
          </div>
          
          <Button
            onClick={handleSaveChanges}
            disabled={isSaving}
            className="funky-button bg-[#5E3B85] text-white px-6 py-3 text-lg header-font w-full sm:w-auto mb-6"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
          
          {/* Subscription Management */}
          <div className="funky-card p-8">
            <h2 className="header-font text-3xl text-[#2B59C3] mb-6 flex items-center gap-3">
              <Shield className="w-8 h-8 text-[#C3B1E1]" />
              Subscription
            </h2>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <p className="body-font text-lg">
                      Your current plan: <span className="header-font text-xl text-[#FF6B35] capitalize">{getEffectiveSubscriptionTier()}</span>
                      {user?.family_role === 'child' && linkedPerson && <span className="body-font-light text-sm text-gray-500 ml-2">(from parent's account)</span>}
                    </p>
                    <p className="body-font-light text-sm text-gray-500">Status: <span className="capitalize">{user.subscription_status || 'active'}</span></p>
                </div>
                {user?.family_role === 'child' && linkedPerson ? (
                    <p className="body-font-light text-gray-600">Your parent manages the subscription. Contact them to upgrade.</p>
                ) : getEffectiveSubscriptionTier() !== 'free' ? (
                    <Button 
                        onClick={handleManageSubscription} 
                        disabled={isPortalRedirecting}
                        className="funky-button bg-[#C3B1E1] text-white px-6 py-3 text-lg header-font"
                    >
                        <CreditCard className="w-5 h-5 mr-2" />
                        {isPortalRedirecting ? 'Redirecting...' : 'Manage Subscription'}
                    </Button>
                ) : (
                    <Link to={createPageUrl("Pricing")}>
                      <Button className="funky-button bg-green-500 text-white px-6 py-3 text-lg header-font">
                          Upgrade Plan
                      </Button>
                    </Link>
                )}
            </div>
            <div className="flex items-center justify-between mt-8 pt-4 border-t border-gray-200">
                <label className="body-font text-lg text-[#5E3B85]">Logout</label>
                <Button variant="destructive" onClick={() => base44.auth.logout()} className="funky-button bg-red-500 text-white">
                  Log Out
                </Button>
              </div>
          </div>
        </TabsContent>

        <TabsContent value="personalize" className="mt-6">
          {/* Avatar Selection */}
          <div className="funky-card p-8 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <Crown className="w-8 h-8 text-yellow-500" />
              <h2 className="header-font text-3xl text-[#2B59C3]">Choose Your Avatar</h2>
            </div>
            <AvatarSelector selected={avatarIcon} onSelect={setAvatarIcon} />
          </div>

          {/* Theme Selection */}
          <div className="funky-card p-8 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <Palette className="w-8 h-8 text-[#C3B1E1]" />
              <h2 className="header-font text-3xl text-[#2B59C3]">Dashboard Theme</h2>
            </div>
            <ThemeSelector selected={currentTheme} onSelect={updateTheme} />
          </div>

          {/* Chore Preferences */}
          <div className="funky-card p-8 mb-6">
            <h2 className="header-font text-3xl text-[#2B59C3] mb-6">Chore Assignment Preferences</h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 funky-card border-2 border-dashed bg-white/50">
                <label htmlFor="auto-assign-chores" className="flex-1 cursor-pointer">
                  <h3 className="body-font text-lg text-[#5E3B85]">Auto-Assign Chores</h3>
                  <p className="body-font-light text-sm text-gray-600">Let ChoreAI automatically assign chores to you</p>
                </label>
                <Switch
                  id="auto-assign-chores"
                  checked={chorePreferences.auto_assign_enabled}
                  onCheckedChange={(value) => setChorePreferences({ ...chorePreferences, auto_assign_enabled: value })}
                />
              </div>

              <div className="flex items-center justify-between p-4 funky-card border-2 border-dashed bg-white/50">
                <label htmlFor="avoid-weekend-chores" className="flex-1 cursor-pointer">
                  <h3 className="body-font text-lg text-[#5E3B85]">Avoid Weekend Chores</h3>
                  <p className="body-font-light text-sm text-gray-600">Prefer chores on weekdays when possible</p>
                </label>
                <Switch
                  id="avoid-weekend-chores"
                  checked={chorePreferences.avoid_weekends}
                  onCheckedChange={(value) => setChorePreferences({ ...chorePreferences, avoid_weekends: value })}
                />
              </div>
            </div>
          </div>

          <Button
            onClick={handleSaveChanges}
            disabled={isSaving}
            className="funky-button bg-[#5E3B85] text-white px-6 py-3 text-lg header-font w-full sm:w-auto"
          >
            {isSaving ? 'Saving...' : 'Save All Changes'}
          </Button>
        </TabsContent>

        <TabsContent value="preferences" className="mt-6">
          {/* Accessibility Settings */}
          <div className="funky-card p-8 mb-6">
            <h2 className="header-font text-3xl text-[#2B59C3] mb-6">Accessibility</h2>
            <AccessibilitySettings
              simplifiedView={user.simplified_view}
              onSimplifiedViewChange={(value) => handleToggleChange('simplified_view', value)}
              highContrast={user.high_contrast}
              onHighContrastChange={(value) => handleToggleChange('high_contrast', value)}
              textSize={user.text_size}
              onTextSizeChange={(value) => handleToggleChange('text_size', value)}
            />
          </div>

          {/* Notification Preferences */}
          <div className="funky-card p-8">
            <h2 className="header-font text-3xl text-[#2B59C3] mb-6">Notification Preferences</h2>
            {isPremium ? (
              <NotificationPreferences
                preferences={notificationPreferences}
                onChange={setNotificationPreferences}
              />
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 funky-card border-2 border-dashed bg-white/50">
                  <label htmlFor="chore-reminders" className="flex-1 cursor-pointer">
                    <h3 className="body-font text-lg text-[#5E3B85]">Chore Reminders</h3>
                    <p className="body-font-light text-sm text-gray-600">Get notified about upcoming chores</p>
                  </label>
                  <Switch
                    id="chore-reminders"
                    checked={user.receives_chore_reminders}
                    onCheckedChange={(value) => handleToggleChange('receives_chore_reminders', value)}
                  />
                </div>
                <div className="flex items-center justify-between p-4 funky-card border-2 border-dashed bg-white/50">
                  <label htmlFor="achievement-alerts" className="flex-1 cursor-pointer">
                    <h3 className="body-font text-lg text-[#5E3B85]">Achievement Alerts</h3>
                    <p className="body-font-light text-sm text-gray-600">Celebrate completed tasks</p>
                  </label>
                  <Switch
                    id="achievement-alerts"
                    checked={user.receives_achievement_alerts}
                    onCheckedChange={(value) => handleToggleChange('receives_achievement_alerts', value)}
                  />
                </div>
                <div className="flex items-center justify-between p-4 funky-card border-2 border-dashed bg-white/50">
                  <label htmlFor="weekly-reports" className="flex-1 cursor-pointer">
                    <h3 className="body-font text-lg text-[#5E3B85]">Weekly Reports</h3>
                    <p className="body-font-light text-sm text-gray-600">Receive family progress summaries</p>
                  </label>
                  <Switch
                    id="weekly-reports"
                    checked={user.receives_weekly_reports}
                    onCheckedChange={(value) => handleToggleChange('receives_weekly_reports', value)}
                  />
                </div>
              </div>
            )}
            <Button
              onClick={handleSaveChanges}
              disabled={isSaving}
              className="funky-button bg-[#5E3B85] text-white px-6 py-3 text-lg header-font mt-6 w-full sm:w-auto"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="family" className="mt-6">
           {/* Family Name (Premium Parents Only) */}
           {user?.family_role === 'parent' && isPremium && (
             <div className="funky-card p-8 mb-6">
               <h2 className="header-font text-3xl text-[#2B59C3] mb-6 flex items-center gap-3">
                 <Users className="w-8 h-8 text-[#F7A1C4]" />
                 Family Name
               </h2>
               <div className="space-y-4">
                 <div>
                   <label htmlFor="family-name" className="body-font text-lg text-[#5E3B85] mb-2 block">
                     Your Family Name
                   </label>
                   <input
                     id="family-name"
                     type="text"
                     placeholder="e.g., The Smith Family"
                     value={familyName}
                     onChange={(e) => setFamilyName(e.target.value)}
                     className="funky-button border-3 border-[#5E3B85] w-full px-4 py-3 body-font text-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#C3B1E1]"
                     maxLength="50"
                   />
                   <p className="body-font-light text-sm text-gray-500 mt-2">
                     This name will help family members identify your family when joining. Keep it memorable!
                   </p>
                 </div>
               </div>
             </div>
           )}

           {/* Account Linking */}
           <div className="funky-card p-8 mb-6">
            <h2 className="header-font text-3xl text-[#2B59C3] mb-6 flex items-center gap-3">
              <Link2 className="w-8 h-8 text-[#FF6B35]" />
              Account Linking
            </h2>
            
            {linkedPerson ? (
              <div className="bg-green-50 border-2 border-green-300 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                    <span className="header-font text-xl text-white">
                      {linkedPerson.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="body-font text-lg text-green-800">
                      ✓ Linked to: <strong>{linkedPerson.name}</strong>
                    </p>
                    <p className="body-font-light text-sm text-green-600">
                      Your account is connected to your family member profile
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-6">
                <div className="flex items-start gap-3 mb-4">
                  <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="body-font text-orange-800 mb-2">
                      Your account is not linked to a family member profile
                    </p>
                    <p className="body-font-light text-sm text-orange-700 mb-4">
                      Link your account to see your assigned chores and track your progress.
                    </p>
                    <Button
                      onClick={() => setLinkModalOpen(true)}
                      className="funky-button bg-[#2B59C3] text-white border-2 border-[#5E3B85]"
                    >
                      <Link2 className="w-4 h-4 mr-2" />
                      Link My Account
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Save Changes Button (for Family Name) */}
          {user?.family_role === 'parent' && isPremium && (
            <Button
              onClick={handleSaveChanges}
              disabled={isSaving}
              className="funky-button bg-[#5E3B85] text-white px-6 py-3 text-lg header-font mb-6"
            >
              {isSaving ? 'Saving...' : 'Save Family Name'}
            </Button>
          )}

          {/* Family Management */}
          <div className="funky-card p-8 text-center">
            <h2 className="header-font text-3xl text-[#2B59C3] mb-4">Family Management</h2>
            <p className="body-font-light text-gray-600 text-lg mb-6 max-w-md mx-auto">
              Add, view, or remove family members from your ChoreBuddy account on the Family page.
            </p>
            <RouterLink to={createPageUrl("People")}>
              <Button className="funky-button bg-[#F7A1C4] text-pink-800 px-8 py-4 header-font text-xl">
                <Users className="w-6 h-6 mr-3" />
                Go to Family Page
              </Button>
            </RouterLink>
          </div>
        </TabsContent>
      </Tabs>

      {/* Mobile restart tour button */}
      <div className="md:hidden fixed bottom-20 right-4 z-40">
        <Button
          onClick={() => setShowOnboarding(true)}
          className="funky-button bg-[#C3B1E1] text-white shadow-lg"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Restart Tour
        </Button>
      </div>
      </div>

      <OnboardingTour 
        isOpen={showOnboarding} 
        onClose={() => setShowOnboarding(false)} 
      />
    </>
  );
}