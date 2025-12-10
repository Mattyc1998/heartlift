import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { purchaseService } from '@/services/purchaseService';

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
  unlockPremium: () => void;
  unlockHealingKit: () => void;
  lockPremium: () => void;
  lockHealingKit: () => void;
  checkSupabaseSubscriptionStatus: () => Promise<{ isPremium: boolean; hasHealingKit: boolean }>;
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

  const initializeApp = async () => {
    console.log('[App Init] 🚀 Initializing app...');
    setIsAppReady(false);
    
    // SAFETY: Force ready after 15 seconds no matter what
    const timeoutId = setTimeout(() => {
      console.warn('[App Init] ⏱️ Timeout (15s) - forcing ready');
      setIsAppReady(true);
    }, 15000);
    
    try {
      // Check Supabase connection
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('[App Init] ❌ Auth error:', authError);
        return;
      }
      
      console.log('[App Init] ✅ Supabase connected, user:', currentUser?.id || 'none');
      
      if (currentUser) {
        // Load purchases from Supabase
        console.log('[App Init] 📦 Loading purchases from Supabase...');
        await checkSupabaseSubscriptionStatus();
        console.log('[App Init] ✅ checkSupabaseSubscriptionStatus() completed');
        
        // CRITICAL: Actually verify state has the data
        console.log('[App Init] 🔍 Verifying state has purchase data...');
        let stateVerified = false;
        let attempts = 0;
        const maxAttempts = 30; // 30 attempts × 100ms = 3 seconds max
        
        while (!stateVerified && attempts < maxAttempts) {
          // Check if state actually has data by checking localStorage
          const localHealingKit = localStorage.getItem('hasHealingKit');
          const localPremium = localStorage.getItem('isPremium');
          
          console.log(`[App Init] Attempt ${attempts + 1}: localStorage hasHealingKit=${localHealingKit}, isPremium=${localPremium}`);
          
          // If localStorage has values (even if false), state is initialized
          if (localHealingKit !== null || localPremium !== null) {
            // Give React one more moment to sync
            await new Promise(resolve => setTimeout(resolve, 100));
            stateVerified = true;
            console.log('[App Init] ✅ State verified - purchases loaded into localStorage and state');
            console.log('[App Init] 📊 Final localStorage - hasHealingKit:', localHealingKit, 'isPremium:', localPremium);
          } else {
            // Wait and retry
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
          }
        }
        
        if (!stateVerified) {
          console.warn('[App Init] ⚠️ Could not verify state after 3 seconds - proceeding anyway');
        }
        
        // Purchases verified in localStorage ✓
        // Now verify Supabase is ready for CONTENT queries (chats, journals, etc.)
        console.log('[App Init] 🔍 Verifying Supabase connection for content queries...');
        let connectionVerified = false;
        let connectionAttempts = 0;
        const maxConnectionAttempts = 20; // 20 × 200ms = 4 seconds
        
        while (!connectionVerified && connectionAttempts < maxConnectionAttempts) {
          try {
            // Test if Supabase can actually respond to queries
            const { data, error } = await supabase
              .from('profiles') // Test with profiles table
              .select('id')
              .eq('id', currentUser.id)
              .limit(1);
            
            if (!error && data !== undefined) {
              connectionVerified = true;
              console.log('[App Init] ✅ Supabase connection verified - content queries will work');
            } else {
              console.log(`[App Init] Connection test ${connectionAttempts + 1}/${maxConnectionAttempts} - no response yet, error:`, error?.message);
              await new Promise(resolve => setTimeout(resolve, 200));
              connectionAttempts++;
            }
          } catch (err: any) {
            console.log(`[App Init] Connection test ${connectionAttempts + 1} failed:`, err?.message);
            await new Promise(resolve => setTimeout(resolve, 200));
            connectionAttempts++;
          }
        }
        
        if (!connectionVerified) {
          console.warn('[App Init] ⚠️ Could not verify Supabase connection for queries after 4 seconds - proceeding anyway');
        }
        
        console.log('[App Init] ✅ All data loaded and verified');
      } else {
        console.log('[App Init] ℹ️ No user logged in - skipping data load');
      }
      
      console.log('[App Init] ✅ App initialized successfully');
    } catch (error) {
      console.error('[App Init] ❌ App init failed:', error);
    } finally {
      clearTimeout(timeoutId); // Cancel timeout if we finished
      setIsAppReady(true); // ALWAYS set to true
      console.log('[App Init] ✅ App ready (isAppReady = true)');
      console.log('[App Init] 📊 Final state check - hasHealingKit:', localStorage.getItem('hasHealingKit'), 'isPremium:', localStorage.getItem('isPremium'));
    }
  };

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
      console.log('[AuthContext] Checking subscription for user:', user.id);
      
      // Check premium status from subscribers table
      const { data: subscriberData, error: subError } = await supabase
        .from('subscribers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      let isPremiumActive = false;
      if (!subError && subscriberData) {
        console.log('[AuthContext] RAW Subscriber data:', JSON.stringify(subscriberData));
        
        // Check if premium is active
        // EITHER: subscribed=true (works for both Stripe and Apple IAP)
        // OR: plan_type=premium AND payment_status=active
        if (subscriberData.subscribed === true) {
          isPremiumActive = true;
          console.log('[AuthContext] ✅ Premium ACTIVE (subscribed=true)');
        } else if (subscriberData.plan_type === 'premium' && subscriberData.payment_status === 'active') {
          isPremiumActive = true;
          console.log('[AuthContext] ✅ Premium ACTIVE (plan_type=premium, payment_status=active)');
        } else {
          console.log('[AuthContext] ❌ NO PREMIUM - Data:', subscriberData);
        }
      } else if (subError) {
        console.error('[AuthContext] Error fetching subscriber:', subError);
      } else {
        console.log('[AuthContext] No subscriber record found for user');
      }

      // Check healing kit status using the RPC function (correct table is healing_kit_purchases)
      const { data: healingKitStatus, error: kitError } = await supabase
        .rpc('user_has_healing_kit', { user_uuid: user.id });

      let hasKit = false;
      if (!kitError) {
        console.log('[AuthContext] Healing kit status:', healingKitStatus);
        hasKit = healingKitStatus === true;
      } else {
        console.error('[AuthContext] Error checking healing kit:', kitError);
      }

      // Update state
      setIsPremium(isPremiumActive);
      setSubscriptionStatus(isPremiumActive ? 'premium' : 'free');
      setHasHealingKit(hasKit);
      
      // Cache for immediate access
      localStorage.setItem('isPremium', JSON.stringify(isPremiumActive));
      localStorage.setItem('subscriptionStatus', JSON.stringify(isPremiumActive ? 'premium' : 'free'));
      localStorage.setItem('hasHealingKit', JSON.stringify(hasKit));
      
      console.log('[AuthContext] Subscription check complete - Premium:', isPremiumActive, 'Healing Kit:', hasKit);
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
          
          // Initialize purchase service for this user
          try {
            await purchaseService.initialize(session.user.id);
            console.log('[AuthContext] Purchase service initialized successfully');
          } catch (error) {
            console.error('[AuthContext] Failed to initialize purchase service:', error);
          }
          
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
      
      // Initialize purchase service if user exists
      if (session?.user) {
        try {
          await purchaseService.initialize(session.user.id);
          console.log('[AuthContext] Purchase service initialized for existing session');
        } catch (error) {
          console.error('[AuthContext] Failed to initialize purchase service:', error);
        }
      }
      
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
    // Initialize app on mount
    console.log('[App Init] Component mounted, initializing app...');
    initializeApp();
  }, []);

  useEffect(() => {
    // Only check subscription once on mount when user exists - no polling
    if (!user) return;

    // Single subscription check when user is detected
    checkSubscription();
  }, [user]);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('[AuthContext] Attempting sign in for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('[AuthContext] Sign in error:', error);
        return { error };
      }

      // Check if user has verified their email
      if (data.user && !data.user.email_confirmed_at) {
        console.log('[AuthContext] Email not verified, signing out');
        // Sign out the user immediately if email is not verified
        await supabase.auth.signOut();
        return { 
          error: { 
            message: "Please verify your email before signing in. Check your inbox for the verification code." 
          } 
        };
      }

      console.log('[AuthContext] Sign in successful for:', data.user?.email);
      return { error: null };
    } catch (err: any) {
      console.error('[AuthContext] Unexpected sign in error:', err);
      return { 
        error: { 
          message: err?.message || "An unexpected error occurred during sign in" 
        } 
      };
    }
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

  // Function to unlock features IMMEDIATELY after purchase
  const unlockPremium = () => {
    console.log('[AuthContext] 🔓 unlockPremium() CALLED');
    console.log('[AuthContext] 📊 Before unlock - isPremium:', isPremium);
    setIsPremium(true);
    console.log('[AuthContext] ✅ setIsPremium(true) executed');
    setSubscriptionStatus('premium');
    console.log('[AuthContext] ✅ setSubscriptionStatus(premium) executed');
    localStorage.setItem('isPremium', 'true');
    localStorage.setItem('subscriptionStatus', JSON.stringify('premium'));
    console.log('[AuthContext] 💾 localStorage updated - isPremium: true');
    console.log('[AuthContext] 📊 After unlock - isPremium:', isPremium);
  };

  const unlockHealingKit = () => {
    console.log('[AuthContext] 🔓 unlockHealingKit() CALLED');
    console.log('[AuthContext] 📊 Before unlock - hasHealingKit:', hasHealingKit);
    setHasHealingKit(true);
    console.log('[AuthContext] ✅ setHasHealingKit(true) executed');
    localStorage.setItem('hasHealingKit', 'true');
    console.log('[AuthContext] 💾 localStorage updated - hasHealingKit: true');
    console.log('[AuthContext] 📊 After unlock - hasHealingKit:', hasHealingKit);
  };

  // Function to lock features when subscription expires
  const lockPremium = () => {
    console.log('[AuthContext] 🔒 LOCKING PREMIUM - subscription expired/cancelled');
    setIsPremium(false);
    setSubscriptionStatus('free');
    localStorage.setItem('isPremium', 'false');
    localStorage.setItem('subscriptionStatus', JSON.stringify('free'));
  };

  const lockHealingKit = () => {
    console.log('[AuthContext] 🔒 LOCKING HEALING KIT - subscription expired/cancelled');
    setHasHealingKit(false);
    localStorage.setItem('hasHealingKit', 'false');
  };

  // Check Supabase subscription status and update local state
  const checkSupabaseSubscriptionStatus = async (): Promise<{ isPremium: boolean; hasHealingKit: boolean }> => {
    if (!user) {
      return { isPremium: false, hasHealingKit: false };
    }

    console.log('[AuthContext] 🔍 Checking Supabase for subscription status...');

    try {
      const [subResult, kitResult] = await Promise.all([
        supabase.from('subscribers').select('subscribed').eq('user_id', user.id).single(),
        supabase.from('healing_kit_purchases').select('status').eq('user_id', user.id).single()
      ]);

      const isPremiumFromDB = subResult.data?.subscribed || false;
      const hasHealingKitFromDB = kitResult.data?.status === 'completed';

      console.log('[AuthContext] 📊 Supabase status:', { isPremiumFromDB, hasHealingKitFromDB });

      // CRITICAL FIX: Check localStorage FIRST - it's the source of truth for recent purchases
      const localIsPremium = localStorage.getItem('isPremium') === 'true';
      const localHasHealingKit = localStorage.getItem('hasHealingKit') === 'true';

      // Update local state based on Supabase OR localStorage (whichever is true)
      // This prevents race conditions where DB sync is slower than local state update
      if (isPremiumFromDB || localIsPremium) {
        unlockPremium();
      } else {
        lockPremium();
      }

      if (hasHealingKitFromDB || localHasHealingKit) {
        unlockHealingKit();
      } else {
        lockHealingKit();
      }

      console.log('[AuthContext] ✅ Final state - Premium:', (isPremiumFromDB || localIsPremium), 'HealingKit:', (hasHealingKitFromDB || localHasHealingKit));

      return { isPremium: isPremiumFromDB || localIsPremium, hasHealingKit: hasHealingKitFromDB || localHasHealingKit };
    } catch (error) {
      console.error('[AuthContext] ❌ Error checking Supabase:', error);
      return { isPremium: false, hasHealingKit: false };
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
    isAppReady,
    initializeApp,
    isPremium,
    hasHealingKit,
    subscriptionStatus,
    checkSubscription,
    unlockPremium,
    unlockHealingKit,
    lockPremium,
    lockHealingKit,
    checkSupabaseSubscriptionStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};