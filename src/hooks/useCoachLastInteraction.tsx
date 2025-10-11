import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface LastInteraction {
  [coachId: string]: Date | null;
}

export const useCoachLastInteraction = () => {
  const { user } = useAuth();
  const [lastInteractions, setLastInteractions] = useState<LastInteraction>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchLastInteractions = async () => {
      try {
        // Get the most recent message for each coach
        const { data, error } = await supabase
          .from('conversation_history')
          .select('coach_id, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Group by coach_id and get the most recent timestamp
        const interactions: LastInteraction = {};
        if (data) {
          data.forEach((message) => {
            if (message.coach_id && !interactions[message.coach_id]) {
              interactions[message.coach_id] = new Date(message.created_at);
            }
          });
        }

        setLastInteractions(interactions);
      } catch (error) {
        console.error('Error fetching last interactions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLastInteractions();
  }, [user]);

  const getLastInteractionText = (coachId: string): string => {
    const lastTime = lastInteractions[coachId];
    
    if (!lastTime) {
      return 'Available';
    }

    const now = new Date();
    const diffMs = now.getTime() - lastTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 5) {
      return 'Online now';
    } else if (diffMins < 60) {
      return `Last spoke ${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `Last spoke ${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays === 1) {
      return 'Last spoke yesterday';
    } else if (diffDays < 7) {
      return `Last spoke ${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `Last spoke ${weeks} week${weeks !== 1 ? 's' : ''} ago`;
    } else {
      const months = Math.floor(diffDays / 30);
      return `Last spoke ${months} month${months !== 1 ? 's' : ''} ago`;
    }
  };

  return { getLastInteractionText, loading };
};
