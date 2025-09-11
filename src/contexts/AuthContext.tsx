import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
  isPremium: boolean;
  hasHealingKit: boolean;
  subscriptionStatus: 'free' | 'premium';
  checkSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  // Initialize with cached values to eliminate delays
  const [isPremium, setIsPremium] = useState(() => {
    const cached = localStorage.getItem('isPremium');
    return cached ? JSON.parse(cached) : false;
  });
  const [hasHealingKit, setHasHealingKit] = useState(() => {
    const cached = localStorage.getItem('hasHealingKit');
    return cached ? JSON.parse(cached) : false;
  });
  const [subscriptionStatus, setSubscriptionStatus] = useState<'free' | 'premium'>(() => {
    const cached = localStorage.getItem('subscriptionStatus');
    return cached ? JSON.parse(cached) : 'free';
  });

  const clearAllConversations = async (userId: string) => {
    try {
      // Clear all conversation history from database
      await supabase
        .from('conversation_history')
        .delete()
        .eq('user_id', userId);
      
      console.log('[AuthContext] Cleared all conversations for user on login');
    } catch (error) {
      console.error('[AuthContext] Error clearing conversations:', error);
    }
  };

  const checkSubscription = async () => {
    if (!user) return;

    try {
      // Check premium status
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (!error && data) {
        const premiumStatus = data.subscribed || false;
        const planType = data.plan_type || 'free';
        setIsPremium(premiumStatus);
        setSubscriptionStatus(planType);
        // Cache premium status for immediate access
        localStorage.setItem('isPremium', JSON.stringify(premiumStatus));
        localStorage.setItem('subscriptionStatus', JSON.stringify(planType));
      }

      // Check healing kit access using the database function
      const { data: healingKitData, error: healingKitError } = await supabase
        .rpc('user_has_healing_kit', { user_uuid: user.id });

      if (!healingKitError) {
        console.log('[AuthContext] Healing kit status:', healingKitData);
        const healingKitStatus = healingKitData || false;
        setHasHealingKit(healingKitStatus);
        // Cache healing kit status for immediate access
        localStorage.setItem('hasHealingKit', JSON.stringify(healingKitStatus));
      } else {
        console.error('[AuthContext] Error checking healing kit:', healingKitError);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // If Supabase logs the user in immediately after signup and email isn't verified, force sign out
        if (event === 'SIGNED_IN' && session?.user && !session.user.email_confirmed_at) {
          await supabase.auth.signOut();
          return;
        }
        
        // Check subscription when user logs in
        if (session?.user && event === 'SIGNED_IN') {
          await checkSubscription();
        } else if (event === 'SIGNED_OUT') {
          // Clear all conversations when user logs out
          if (user) {
            await clearAllConversations(user.id);
          }
          setIsPremium(false);
          setHasHealingKit(false);
          setSubscriptionStatus('free');
          // Clear cached status
          localStorage.removeItem('isPremium');
          localStorage.removeItem('hasHealingKit');
          localStorage.removeItem('subscriptionStatus');
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Check subscription for existing session
      if (session?.user) {
        await checkSubscription();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Auto-refresh subscription status every 10 seconds when user is logged in
    // This ensures subscription/healing kit access persists through login/logout
    if (!user) return;

    const interval = setInterval(checkSubscription, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // Check if user has verified their email
    if (!error && data.user && !data.user.email_confirmed_at) {
      // Sign out the user immediately if email is not verified
      await supabase.auth.signOut();
      return { 
        error: { 
          message: "Please verify your email before signing in. Check your inbox for the verification code." 
        } 
      };
    }

    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });

    // If Supabase auto-signs in after signup, immediately sign out until email is verified
    if (data?.user && !data.user.email_confirmed_at) {
      await supabase.auth.signOut();
    }

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const value = {
    user,
    session,
    signIn,
    signUp,
    signOut,
    loading,
    isPremium,
    hasHealingKit,
    subscriptionStatus,
    checkSubscription,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};