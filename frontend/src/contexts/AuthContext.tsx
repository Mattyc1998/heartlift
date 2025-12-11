import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { purchaseService } from '@/services/purchaseService';
import { 
  warmupNetwork,
  waitForSupabaseReady, 
  executeWithTimeout, 
  executeWithRetry,
  ensureSessionReady 
} from '@/utils/supabaseInitHelpers';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  forceSignOut: () => Promise<void>;
  loading: boolean;
  isAppReady: boolean;
  initializeApp: () => Promise<void>;
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
  const [isAppReady, setIsAppReady] = useState(false);
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

  /**
   * FINAL NON-BLOCKING INITIALIZATION WITH NETWORK WARMUP
   * CRITICAL: Uses user from auth listener, doesn't call getUser() again
   * 
   * Sequence:
   * 1. Warm up iOS network stack (400ms delay)
   * 2. Set isAppReady = true IMMEDIATELY (no blocking)
   * 3. Initialize IAP if user exists (from context)
   * 4. Run Supabase subscription check in background
   */
  const initializeApp = async () => {
    console.log('[App Init] 🚀 Starting FINAL non-blocking initialization...');
    console.log('[App Init] 📱 Platform: iOS Capacitor with WKWebView');
    
    try {
      // STEP 1: Warm up iOS networking stack
      // Simple delay approach - more reliable than fetch
      console.log('[App Init] 🔥 Step 1: Warming up network...');
      await warmupNetwork();
      
      // STEP 2: Set app ready IMMEDIATELY
      // Don't wait for user check or subscriptions
      console.log('[App Init] ✅ Step 2: Setting app ready NOW (no blocking)');
      setIsAppReady(true);
      console.log('[App Init] 🎉 App is ready! User can interact.');
      
      // STEP 3: Check if user exists (from context, not a new query)
      console.log('[App Init] 🔍 Step 3: Checking user from context...');
      if (user) {
        console.log('[App Init] ✅ User found in context:', user.id);
        
        // Initialize IAP (non-blocking)
        console.log('[App Init] 🛍️ Step 4: Initializing IAP (non-blocking)...');
        purchaseService.initialize(user.id).catch((error) => {
          console.error('[App Init] ⚠️ IAP init failed (non-critical):', error.message);
        });
        
        // Run subscription check in BACKGROUND
        console.log('[App Init] 🔄 Step 5: Starting BACKGROUND subscription check...');
        checkSubscriptionInBackground(user.id);
      } else {
        console.log('[App Init] ℹ️ No user in context yet, will wait for auth listener');
      }
      
    } catch (error: any) {
      console.error('[App Init] ❌ Critical initialization error:', error.message);
      // Always set app ready - never block user
      setIsAppReady(true);
      console.log('[App Init] ⚠️ App set to ready despite error');
    }
  };

  /**
   * Run subscription check in background with timeout and retries
   * Network is already warmed up by initializeApp, so Supabase won't hang
   * This does NOT block app initialization
   */
  const checkSubscriptionInBackground = async (userId: string) => {
    console.log('[Background Check] 🔄 Starting subscription check (network pre-warmed)...');
    console.log('[Background Check] ℹ️ Using retries + timeout for reliability');
    
    try {
      // Use retry logic: 3 attempts with 1 second delay
      await executeWithRetry(
        async () => {
          // Wrap the actual check in a timeout
          await executeWithTimeout(
            async () => {
              console.log('[Background Check] 📊 Querying Supabase for subscription...');
              await checkSupabaseSubscriptionStatus();
              console.log('[Background Check] ✅ Query completed');
            },
            7000, // 7 second timeout per attempt
            'Supabase subscription query'
          );
        },
        3, // 3 attempts
        1000, // 1 second between attempts
        'Background subscription check'
      );
      
      console.log('[Background Check] 🎉 All subscription data loaded successfully');
    } catch (error: any) {
      console.error('[Background Check] ❌ All 3 attempts failed:', error.message);
      console.warn('[Background Check] ⚠️ App will use CACHED subscription status from localStorage');
      console.log('[Background Check] 📦 Cached: isPremium =', localStorage.getItem('isPremium'));
      console.log('[Background Check] 📦 Cached: hasHealingKit =', localStorage.getItem('hasHealingKit'));
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

  /**
   * Ensure Supabase session is ready before making queries
   * CRITICAL: Prevents hanging queries when auth state is SIGNED_IN
   */
  const ensureSessionReady = async () => {
    console.log('[AuthContext] 🔍 Ensuring Supabase session is ready...');
    
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('[AuthContext] ❌ Error getting session:', error);
      throw error;
    }
    
    console.log('[AuthContext] 📊 Session check:', {
      hasSession: !!session,
      expiresAt: session?.expires_at,
      isExpired: session ? new Date(session.expires_at * 1000) < new Date() : null,
      userId: session?.user?.id
    });
    
    // If session expired, refresh it
    if (session && new Date(session.expires_at * 1000) < new Date()) {
      console.log('[AuthContext] ⚠️ Session expired, refreshing...');
      const { data, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.error('[AuthContext] ❌ Session refresh failed:', refreshError);
        throw refreshError;
      }
      console.log('[AuthContext] ✅ Session refreshed successfully');
    } else if (session) {
      console.log('[AuthContext] ✅ Session is valid and ready');
    } else {
      console.error('[AuthContext] ❌ No session found');
      throw new Error('No session found');
    }
  };

  /**
   * Check subscription with timeout protection
   * Used by auth state listener
   */
  const checkSubscription = async () => {
    if (!user) return;

    try {
      console.log('[checkSubscription] 🔄 Starting check for user:', user.id);
      
      // Wrap in timeout to prevent hanging
      await executeWithTimeout(
        async () => {
          // Ensure session is ready
          const sessionReady = await ensureSessionReady();
          if (!sessionReady) {
            console.warn('[checkSubscription] ⚠️ Session not ready, using cached data');
            return;
          }
          
          // Check premium status from subscribers table
          const { data: subscriberData, error: subError } = await supabase
            .from('subscribers')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

          let isPremiumActive = false;
          if (!subError && subscriberData) {
            console.log('[checkSubscription] RAW Subscriber data:', JSON.stringify(subscriberData));
            
            // Check if premium is active
            if (subscriberData.subscribed === true) {
              isPremiumActive = true;
              console.log('[checkSubscription] ✅ Premium ACTIVE (subscribed=true)');
            } else if (subscriberData.plan_type === 'premium' && subscriberData.payment_status === 'active') {
              isPremiumActive = true;
              console.log('[checkSubscription] ✅ Premium ACTIVE (plan_type=premium, payment_status=active)');
            } else {
              console.log('[checkSubscription] ❌ NO PREMIUM - Data:', subscriberData);
            }
          } else if (subError) {
            console.error('[checkSubscription] Error fetching subscriber:', subError);
          } else {
            console.log('[checkSubscription] No subscriber record found for user');
          }

          // Check healing kit status
          const { data: healingKitStatus, error: kitError } = await supabase
            .rpc('user_has_healing_kit', { user_uuid: user.id });

          let hasKit = false;
          if (!kitError) {
            console.log('[checkSubscription] Healing kit status:', healingKitStatus);
            hasKit = healingKitStatus === true;
          } else {
            console.error('[checkSubscription] Error checking healing kit:', kitError);
          }

          // Update state
          setIsPremium(isPremiumActive);
          setSubscriptionStatus(isPremiumActive ? 'premium' : 'free');
          setHasHealingKit(hasKit);
          
          // Cache for immediate access
          localStorage.setItem('isPremium', JSON.stringify(isPremiumActive));
          localStorage.setItem('subscriptionStatus', JSON.stringify(isPremiumActive ? 'premium' : 'free'));
          localStorage.setItem('hasHealingKit', JSON.stringify(hasKit));
          
          console.log('[checkSubscription] ✅ Complete - Premium:', isPremiumActive, 'Healing Kit:', hasKit);
        },
        7000, // 7 second timeout
        'checkSubscription'
      );
    } catch (error: any) {
      console.error('[checkSubscription] ❌ Failed:', error.message);
      console.log('[checkSubscription] ℹ️ Using cached subscription data');
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AuthContext] 🔔 Auth event:', event, {
          userEmail: session?.user?.email,
          sessionValid: !!session,
          expiresAt: session?.expires_at
        });
        
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
  /**
   * Check Supabase subscription status with timeout and retry protection
   * THIS IS CALLED FROM BACKGROUND - does not block app initialization
   */
  const checkSupabaseSubscriptionStatus = async (): Promise<{ isPremium: boolean; hasHealingKit: boolean }> => {
    if (!user) {
      console.log('[checkSupabaseStatus] ⚠️ No user, returning false');
      return { isPremium: false, hasHealingKit: false };
    }

    console.log('[checkSupabaseStatus] 🔍 Checking Supabase with timeout protection...');

    try {
      // Wrap the entire check in timeout
      const result = await executeWithTimeout(
        async () => {
          // Ensure session is ready
          const sessionReady = await ensureSessionReady();
          if (!sessionReady) {
            console.warn('[checkSupabaseStatus] ⚠️ Session not ready, using cached data');
            const localIsPremium = localStorage.getItem('isPremium') === 'true';
            const localHasHealingKit = localStorage.getItem('hasHealingKit') === 'true';
            return { isPremium: localIsPremium, hasHealingKit: localHasHealingKit };
          }
          
          console.log('[checkSupabaseStatus] 📊 Querying subscribers and healing_kit_purchases...');
          const [subResult, kitResult] = await Promise.all([
            supabase.from('subscribers').select('subscribed').eq('user_id', user.id).single(),
            supabase.from('healing_kit_purchases').select('status').eq('user_id', user.id).single()
          ]);

          const isPremiumFromDB = subResult.data?.subscribed || false;
          const hasHealingKitFromDB = kitResult.data?.status === 'completed';

          console.log('[checkSupabaseStatus] 📊 Supabase results:', { isPremiumFromDB, hasHealingKitFromDB });

          // Check localStorage as backup
          const localIsPremium = localStorage.getItem('isPremium') === 'true';
          const localHasHealingKit = localStorage.getItem('hasHealingKit') === 'true';

          // Update state based on Supabase OR localStorage (whichever is true)
          const finalPremium = isPremiumFromDB || localIsPremium;
          const finalKit = hasHealingKitFromDB || localHasHealingKit;

          if (finalPremium) {
            unlockPremium();
          } else {
            lockPremium();
          }

          if (finalKit) {
            unlockHealingKit();
          } else {
            lockHealingKit();
          }

          console.log('[checkSupabaseStatus] ✅ Final state - Premium:', finalPremium, 'HealingKit:', finalKit);
          return { isPremium: finalPremium, hasHealingKit: finalKit };
        },
        7000, // 7 second timeout
        'checkSupabaseSubscriptionStatus'
      );
      
      return result;
    } catch (error: any) {
      console.error('[checkSupabaseStatus] ❌ Query failed:', error.message);
      console.log('[checkSupabaseStatus] ℹ️ Using cached data from localStorage');
      
      // Fallback to cached data
      const localIsPremium = localStorage.getItem('isPremium') === 'true';
      const localHasHealingKit = localStorage.getItem('hasHealingKit') === 'true';
      return { isPremium: localIsPremium, hasHealingKit: localHasHealingKit };
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