
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../hooks/use-subscription';

interface RestrictedFeatureRedirectProps {
  featureName: string;
  children: React.ReactNode;
}

const RestrictedFeatureRedirect: React.FC<RestrictedFeatureRedirectProps> = ({ 
  featureName, 
  children 
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tier } = useSubscription(user?.id);

  useEffect(() => {
    // Check if the user is on the free plan
    if (tier === 'free') {
      toast.error(`Upgrade to Basic or Pro for ${featureName}`);
      navigate('/pricing');
    }
  }, [featureName, navigate, tier]);

  // Only render children if not on free plan
  if (tier === 'free') {
    return null;
  }

  return <>{children}</>;
};

export default RestrictedFeatureRedirect;
