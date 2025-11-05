import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  forceSignOut: () => Promise<void>;
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
  // Initialize with cached values for immediate loading
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
      const backendUrl = import.meta.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || '';
      
      // Check subscription status from MongoDB backend (where purchases sync)
      const response = await fetch(`${backendUrl}/api/subscriptions/status/${user.id}`, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        const premiumStatus = data.has_premium || false;
        const healingKitStatus = data.has_healing_kit || false;
        
        setIsPremium(premiumStatus);
        setHasHealingKit(healingKitStatus);
        setSubscriptionStatus(premiumStatus ? 'premium' : 'free');
        
        // Cache for immediate access on reload
        localStorage.setItem('isPremium', JSON.stringify(premiumStatus));
        localStorage.setItem('hasHealingKit', JSON.stringify(healingKitStatus));
        localStorage.setItem('subscriptionStatus', JSON.stringify(premiumStatus ? 'premium' : 'free'));
        
        console.log('✅ [AuthContext] Subscription status updated:', { premiumStatus, healingKitStatus });
      } else {
        console.warn('[AuthContext] Failed to check subscription status:', response.status);
      }
    } catch (error) {
      console.error('[AuthContext] Error checking subscription:', error);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AuthContext] Auth state change:', event, session?.user?.email);
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // If Supabase logs the user in immediately after signup and email isn't verified, force sign out
        if (event === 'SIGNED_IN' && session?.user && !session.user.email_confirmed_at) {
          console.log('[AuthContext] Forcing sign out - email not verified');
          await supabase.auth.signOut();
          return;
        }
        
        // Check subscription when user logs in OR when we detect an existing session
        if (session?.user && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
          console.log('[AuthContext] User session detected, checking subscription immediately');
          // Call checkSubscription synchronously to ensure immediate update
          setTimeout(() => checkSubscription(), 0);
        } else if (event === 'SIGNED_OUT') {
          console.log('[AuthContext] User signed out, clearing state');
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

    // Check for existing session with error handling
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error) {
        console.error('[AuthContext] Error getting session:', error);
        // If there's an error getting session, clear everything
        await supabase.auth.signOut({ scope: 'local' });
        localStorage.clear();
        setSession(null);
        setUser(null);
        setLoading(false);
        return;
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Check subscription for existing session immediately
      if (session?.user) {
        console.log('[AuthContext] Found existing session for:', session.user.email);
        // Force immediate subscription check for existing sessions
        setTimeout(() => checkSubscription(), 0);
      } else {
        console.log('[AuthContext] No existing session found');
      }
    }).catch(async (error) => {
      console.error('[AuthContext] Failed to get session:', error);
      // Clear everything on error
      await supabase.auth.signOut({ scope: 'local' });
      localStorage.clear();
      setSession(null);
      setUser(null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Only check subscription once on mount when user exists - no polling
    if (!user) return;

    // Single subscription check when user is detected
    checkSubscription();
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

    // Check if the user already exists (Supabase returns existing user data)
    if (data?.user && data.user.identities && data.user.identities.length === 0) {
      return { 
        error: { 
          message: "An account with this email already exists. Please sign in instead." 
        } 
      };
    }

    // If Supabase auto-signs in after signup, immediately sign out until email is verified
    if (data?.user && !data.user.email_confirmed_at) {
      await supabase.auth.signOut();
    }

    return { error };
  };

  const signOut = async () => {
    try {
      // Clear all local state first
      setUser(null);
      setSession(null);
      setIsPremium(false);
      setHasHealingKit(false);
      setSubscriptionStatus('free');
      
      // Clear all localStorage items
      localStorage.removeItem('isPremium');
      localStorage.removeItem('hasHealingKit');
      localStorage.removeItem('subscriptionStatus');
      
      // Clear all conversations if user exists
      if (user) {
        await clearAllConversations(user.id);
      }
      
      // Standard sign out - don't force scope to avoid session validation issues
      await supabase.auth.signOut();
      
      // Navigate to home page
      window.location.href = '/';
    } catch (error) {
      console.error('Error during sign out:', error);
      // Even if there's an error, clear local state and redirect
      localStorage.clear();
      window.location.href = '/';
    }
  };

  const forceSignOut = async () => {
    try {
      console.log('[AuthContext] Force sign out initiated');
      
      // Immediately clear all local state
      setUser(null);
      setSession(null);
      setIsPremium(false);
      setHasHealingKit(false);
      setSubscriptionStatus('free');
      
      // Clear all localStorage and sessionStorage
      localStorage.clear();
      sessionStorage.clear();
      
      // Force sign out with global scope only if really needed
      await supabase.auth.signOut();
      
      // Force a complete page reload to clear any remaining state
      window.location.href = '/';
    } catch (error) {
      console.error('Error during force sign out:', error);
      // Clear everything and reload anyway
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/';
    }
  };

  const value = {
    user,
    session,
    signIn,
    signUp,
    signOut,
    forceSignOut,
    loading,
    isPremium,
    hasHealingKit,
    subscriptionStatus,
    checkSubscription,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};