import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Lock, Zap } from 'lucide-react';
import { useSubscriptionAccess } from '../hooks/useSubscriptionAccess';

export default function FeatureGate({ 
  feature, 
  children, 
  fallback = null, 
  showUpgradePrompt = true,
  customMessage = null 
}) {
  const { canAccess, getRequiredTier, getTierDisplayName } = useSubscriptionAccess();
  
  if (canAccess(feature)) {
    return children;
  }

  if (fallback) {
    return fallback;
  }

  if (!showUpgradePrompt) {
    return null;
  }

  const requiredTier = getRequiredTier(feature);
  const displayName = getTierDisplayName(requiredTier);

  return (
    <div className="funky-card p-6 text-center border-4 border-dashed border-gray-300 bg-gray-50">
      <div className="mx-auto w-16 h-16 funky-button bg-gray-200 flex items-center justify-center mb-4">
        <Lock className="w-8 h-8 text-gray-500" />
      </div>
      <h3 className="header-font text-xl text-gray-600 mb-2">Premium Feature</h3>
      <p className="body-font-light text-gray-500 mb-4">
        {customMessage || `This feature requires a ${displayName} subscription.`}
      </p>
      <Link to={createPageUrl('Pricing')}>
        <Button className="funky-button bg-[#FF6B35] text-white px-6 py-3 header-font">
          <Zap className="w-5 h-5 mr-2" />
          Upgrade to {displayName}
        </Button>
      </Link>
    </div>
  );
}