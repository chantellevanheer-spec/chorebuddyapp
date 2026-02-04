import React, { useState, useEffect } from 'react';
import { Family } from '@/entities/Family';
import { User } from '@/entities/User';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Settings as SettingsIcon, 
  Crown, 
  Copy, 
  Check,
  Shield,
  Bell,
  Zap,
  Calendar,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function FamilySettings() {
  const [family, setFamily] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    settings: {}
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [familyData, userData] = await Promise.all([
        Family.get(user?.family_id),
        User.me()
      ]);
      
      setFamily(familyData);
      setUser(userData);
      setFormData({
        name: familyData.name,
        settings: familyData.settings || {}
      });
    } catch (error) {
      console.error('Error fetching family data:', error);
      toast.error('Failed to load family settings');
    } finally {
      setLoading(false);
    }
  };

  const isOwnerOrCoOwner = () => {
    if (!family || !user) return false;
    return (
      family.owner_user_id === user.id ||
      family.co_owners?.includes(user.id)
    );
  };

  const isOwner = () => {
    if (!family || !user) return false;
    return family.owner_user_id === user.id;
  };

  const handleSaveSettings = async () => {
    if (!isOwnerOrCoOwner()) {
      toast.error('Only owners and co-owners can update family settings');
      return;
    }

    setSaving(true);
    try {
      await Family.update(family.id, {
        name: formData.name,
        settings: formData.settings,
        updated_at: new Date().toISOString()
      });
      
      toast.success('Family settings updated!');
      await fetchData();
    } catch (error) {
      console.error('Error updating family:', error);
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSetting = (key, value) => {
    setFormData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [key]: value
      }
    }));
  };

  const handleCopyInviteCode = () => {
    if (family?.invite_code) {
      navigator.clipboard.writeText(family.invite_code);
      setCopiedCode(true);
      toast.success('Invite code copied!');
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleToggleInviteCode = async () => {
    if (!isOwnerOrCoOwner()) {
      toast.error('Only owners and co-owners can manage invite codes');
      return;
    }

    try {
      await Family.update(family.id, {
        invite_enabled: !family.invite_enabled
      });
      
      toast.success(
        family.invite_enabled 
          ? 'Invite code disabled' 
          : 'Invite code enabled'
      );
      await fetchData();
    } catch (error) {
      console.error('Error toggling invite code:', error);
      toast.error('Failed to update invite code');
    }
  };

  const getSubscriptionBadge = () => {
    const colors = {
      free: 'bg-gray-200 text-gray-800',
      premium: 'bg-blue-200 text-blue-800',
      family_plus: 'bg-purple-200 text-purple-800',
      enterprise: 'bg-yellow-200 text-yellow-800'
    };
    
    return (
      
        {family.subscription_tier?.toUpperCase()}
      
    );
  };

  if (loading) {
    return (
      
        
      
    );
  }

  if (!isOwnerOrCoOwner()) {
    return (
      
        
        
          Access Restricted
        
        
          Only family owners and co-owners can access these settings
        
      
    );
  }

  return (
    
      {/* Header */}
      
        
          
            
              
            
            
              
                Family Settings
              
              
                Manage your family configuration
              
            
          
          {getSubscriptionBadge()}
        
      

      
        
          General
          Members
          Preferences
          Statistics
        

        {/* General Settings */}
        
          {/* Family Name */}
          
            
              Family Name
            
            
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter family name"
                maxLength={100}
                disabled={!isOwnerOrCoOwner()}
              />
              
                This name helps identify your family
              
            
          

          {/* Invite Code */}
          
            
              
                
                  Invite Code
                
                {isOwner() && (
                  
                )}
              
            
            
            {family.invite_enabled ? (
              
                
                  
                    
                      {family.invite_code}
                    
                  
                  
                    {copiedCode ? (
                      <>
                        
                        Copied!
                      </>
                    ) : (
                      <>
                        
                        Copy
                      </>
                    )}
                  
                
                
                  Share this code with family members to let them join
                
              
            ) : (
              
                
                  Invite code is currently disabled
                
              
            )}
          

          {/* Timezone & Currency */}
          
            
              Regional Settings
            
            
              
                
                  Timezone
                
                <Select 
                  value={family.timezone} 
                  onValueChange={(value) => setFormData({ 
                    ...formData, 
                    timezone: value 
                  })}
                  disabled={!isOwnerOrCoOwner()}
                >
                  
                    
                  
                  
                    Eastern (US)
                    Central (US)
                    Mountain (US)
                    Pacific (US)
                    London
                    Paris
                    Tokyo
                    UTC
                  
                
              
              
              
                
                  Currency
                
                <Select 
                  value={family.currency} 
                  onValueChange={(value) => setFormData({ 
                    ...formData, 
                    currency: value 
                  })}
                  disabled={!isOwnerOrCoOwner()}
                >
                  
                    
                  
                  
                    USD ($)
                    EUR (€)
                    GBP (£)
                    JPY (¥)
                    CAD ($)
                    AUD ($)
                  
                
              
            
          
        

        {/* Members Tab */}
        
          
            
              
                Family Members
              
              
                {family.member_count} / {
                  family.subscription_tier === 'free' ? 6 :
                  family.subscription_tier === 'premium' ? 15 :
                  family.subscription_tier === 'family_plus' ? 30 : 50
                } members
              
            

            {/* Owner */}
            
              
                
                
                  Owner
                  
                    {family.owner_user_id === user.id ? 'You' : 'Another family member'}
                  
                
              

              {/* Co-owners */}
              {family.co_owners && family.co_owners.length > 0 && (
                
                  Co-owners ({family.co_owners.length})
                  {family.co_owners.map((coOwnerId, index) => (
                    
                      
                      
                        {coOwnerId === user.id ? 'You' : `Co-owner ${index + 1}`}
                      
                    
                  ))}
                
              )}

              {/* Other Members */}
              
                
                  All Members ({family.member_count})
                
                
                  View detailed member list in the People page
                
              
            
          
        

        {/* Preferences Tab */}
        
          
            
              
              Chore Settings
            
            
            
              
                
                  Auto-assign Chores
                  
                    Automatically assign recurring chores
                  
                
                <Switch
                  checked={formData.settings.auto_assign_chores}
                  onCheckedChange={(value) => handleToggleSetting('auto_assign_chores', value)}
                  disabled={!isOwnerOrCoOwner()}
                />
              

              
                
                  Allow Self-Assignment
                  
                    Let children pick available chores
                  
                
                <Switch
                  checked={formData.settings.allow_self_assignment}
                  onCheckedChange={(value) => handleToggleSetting('allow_self_assignment', value)}
                  disabled={!isOwnerOrCoOwner()}
                />
              

              
                
                  Require Photo Proof
                  
                    Require photos for chore verification
                  
                
                <Switch
                  checked={formData.settings.require_photo_proof}
                  onCheckedChange={(value) => handleToggleSetting('require_photo_proof', value)}
                  disabled={!isOwnerOrCoOwner()}
                />
              

              
                
                  Point Multiplier
                
                
                  Multiply all point rewards (0.5x - 5.0x)
                
                <Input
                  type="number"
                  min={0.5}
                  max={5.0}
                  step={0.1}
                  value={formData.settings.point_multiplier}
                  onChange={(e) => handleToggleSetting('point_multiplier', parseFloat(e.target.value))}
                  disabled={!isOwnerOrCoOwner()}
                />
              

              
                
                  Max Pending Chores per Person
                
                
                  Maximum incomplete chores assigned at once
                
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={formData.settings.max_pending_chores}
                  onChange={(e) => handleToggleSetting('max_pending_chores', parseInt(e.target.value))}
                  disabled={!isOwnerOrCoOwner()}
                />
              
            
          

          
            
              
              Notification Settings
            
            
            
              
                
                  Enable Notifications
                  
                    Send push and email notifications
                  
                
                <Switch
                  checked={formData.settings.notifications_enabled}
                  onCheckedChange={(value) => handleToggleSetting('notifications_enabled', value)}
                  disabled={!isOwnerOrCoOwner()}
                />
              

              
                
                  Weekly Digest Day
                
                
                  Day to send weekly summary emails
                
                <Select 
                  value={formData.settings.weekly_digest_day} 
                  onValueChange={(value) => handleToggleSetting('weekly_digest_day', value)}
                  disabled={!isOwnerOrCoOwner()}
                >
                  
                    
                  
                  
                    Monday
                    Tuesday
                    Wednesday
                    Thursday
                    Friday
                    Saturday
                    Sunday
                  
                
              
            
          
        

        {/* Statistics Tab */}
        
          
            
              
              Family Statistics
            
            
            
              
                
                  Total Chores Completed
                
                
                  {family.statistics?.total_chores_completed || 0}
                
              

              
                
                  Total Points Awarded
                
                
                  {family.statistics?.total_points_awarded || 0}
                
              

              
                
                  Rewards Redeemed
                
                
                  {family.statistics?.total_rewards_redeemed || 0}
                
              

              
                
                  This Week's Completions
                
                
                  {family.statistics?.current_week_completions || 0}
                
              
            

            {family.statistics?.last_activity_at && (
              
                
                  Last activity: {new Date(family.statistics.last_activity_at).toLocaleString()}
                
              
            )}
          
        
      

      {/* Save Button */}
      {isOwnerOrCoOwner() && (
        
          
            {saving ? 'Saving...' : 'Save All Changes'}
          
        
      )}

      {/* Danger Zone (Owner Only) */}
      {isOwner() && (
        
          
            
            
              
                Danger Zone
              
              
                These actions are permanent and cannot be undone
              
            
          
          
          <Button
            variant="destructive"
            className="bg-red-600 hover:bg-red-700"
            onClick={() => {
              toast.error('Family deletion must be done through support');
            }}
          >
            Delete Family
          
          
            Please contact support to permanently delete your family
          
        
      )}
    
  );
}
