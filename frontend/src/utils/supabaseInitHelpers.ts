/**
 * Supabase Initialization Helpers
 * Fixes iOS race condition where first query can hang
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Warm up iOS WKWebView networking stack
 * CRITICAL: First network request in WKWebView can hang if networking stack isn't ready
 * This lightweight fetch wakes up the network layer before Supabase queries
 */
export const warmupNetwork = async (): Promise<void> => {
  console.log('[Network Warmup] 🔥 Warming up iOS networking stack...');
  
  try {
    const startTime = Date.now();
    // Simple GET request to wake up WKWebView networking
    await fetch('https://httpbin.org/get', { 
      method: 'GET',
      cache: 'no-cache'
    });
    const elapsed = Date.now() - startTime;
    console.log(`[Network Warmup] ✅ Network ready (${elapsed}ms)`);
  } catch (err: any) {
    console.warn('[Network Warmup] ⚠️ Warmup failed, continuing anyway:', err.message);
    // Don't throw - we'll proceed even if warmup fails
  }
};

/**
 * Wait for Supabase client to be ready on iOS
 * CRITICAL: iOS needs 200-400ms for Supabase client to fully initialize
 */
export const waitForSupabaseReady = async (): Promise<void> => {
  console.log('[Supabase Init] ⏳ Waiting for Supabase client to be ready on iOS...');
  
  // Small delay to let Supabase client fully initialize
  // This prevents the first query from hanging
  await new Promise(resolve => setTimeout(resolve, 300));
  
  console.log('[Supabase Init] ✅ Supabase should be ready now');
};

/**
 * Execute a Supabase query with timeout
 * Prevents queries from hanging forever
 * 
 * @param queryFn - The Supabase query function to execute
 * @param timeoutMs - Timeout in milliseconds (default 7000ms)
 * @param queryName - Name of the query for logging
 */
export const executeWithTimeout = async <T>(
  queryFn: () => Promise<T>,
  timeoutMs: number = 7000,
  queryName: string = 'query'
): Promise<T> => {
  console.log(`[Query Timeout] ⏱️ Starting ${queryName} with ${timeoutMs}ms timeout`);
  
  const timeoutPromise = new Promise<T>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`${queryName} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([queryFn(), timeoutPromise]);
    console.log(`[Query Timeout] ✅ ${queryName} completed successfully`);
    return result;
  } catch (error: any) {
    console.error(`[Query Timeout] ❌ ${queryName} failed:`, error.message);
    throw error;
  }
};

/**
 * Execute a function with retry logic
 * 
 * @param fn - Function to execute
 * @param maxAttempts - Maximum number of attempts (default 3)
 * @param delayMs - Delay between attempts in ms (default 1000)
 * @param operationName - Name for logging
 */
export const executeWithRetry = async <T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000,
  operationName: string = 'operation'
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`[Retry] 🔄 ${operationName} - Attempt ${attempt}/${maxAttempts}`);
      const result = await fn();
      console.log(`[Retry] ✅ ${operationName} succeeded on attempt ${attempt}`);
      return result;
    } catch (error: any) {
      lastError = error;
      console.error(`[Retry] ❌ ${operationName} failed on attempt ${attempt}:`, error.message);
      
      if (attempt < maxAttempts) {
        console.log(`[Retry] ⏳ Waiting ${delayMs}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  
  console.error(`[Retry] 💥 ${operationName} failed after ${maxAttempts} attempts`);
  throw lastError;
};

/**
 * Check if Supabase session is valid and ready
 */
export const ensureSessionReady = async (): Promise<boolean> => {
  console.log('[Session Check] 🔍 Checking Supabase session...');
  
  try {
    const { data: { session }, error } = await executeWithTimeout(
      () => supabase.auth.getSession(),
      5000,
      'getSession'
    );
    
    if (error) {
      console.error('[Session Check] ❌ Error getting session:', error);
      return false;
    }
    
    if (!session) {
      console.log('[Session Check] ⚠️ No session found');
      return false;
    }
    
    const isExpired = new Date(session.expires_at * 1000) < new Date();
    console.log('[Session Check] 📊 Session:', {
      hasSession: true,
      userId: session.user.id,
      expiresAt: session.expires_at,
      isExpired
    });
    
    if (isExpired) {
      console.log('[Session Check] ⚠️ Session expired, refreshing...');
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.error('[Session Check] ❌ Refresh failed:', refreshError);
        return false;
      }
      console.log('[Session Check] ✅ Session refreshed');
    }
    
    return true;
  } catch (error: any) {
    console.error('[Session Check] ❌ Session check failed:', error.message);
    return false;
  }
};
