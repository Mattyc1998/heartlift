import { supabase } from '@/integrations/supabase/client';

/**
 * Query Supabase with automatic retry logic for auth session propagation delays
 * 
 * @param queryFn - The function that executes the Supabase query
 * @param componentName - Name for logging purposes
 * @param maxAttempts - Maximum number of retry attempts (default: 5)
 * @returns Query result with data or error
 */
export const queryWithRetry = async (
  queryFn: () => Promise<any>,
  componentName: string,
  maxAttempts: number = 5
) => {
  console.log(`[${componentName}] Starting query with retry...`);
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`[${componentName}] Attempt ${attempt}/${maxAttempts}`);
      
      // Check auth first
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.log(`[${componentName}] No user yet, waiting...`);
        await new Promise(resolve => setTimeout(resolve, 500));
        continue;
      }
      
      console.log(`[${componentName}] User: ${user.id}, executing query...`);
      
      // Execute the actual query
      const result = await queryFn();
      
      if (result.error) {
        console.error(`[${componentName}] Query error:`, result.error.message);
        
        // If permission denied or JWT error, retry
        if (result.error.message.includes('JWT') || 
            result.error.message.includes('permission') ||
            result.error.message.includes('policy') ||
            result.error.message.includes('expired')) {
          console.log(`[${componentName}] Auth issue, retrying in 500ms...`);
          await new Promise(resolve => setTimeout(resolve, 500));
          continue;
        }
        
        // Other errors, return immediately
        return result;
      }
      
      console.log(`[${componentName}] ✅ Success! Got ${result.data?.length || (result.data ? 1 : 0)} items`);
      return result;
      
    } catch (err: any) {
      console.error(`[${componentName}] Exception:`, err?.message || err);
      
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }
  
  console.error(`[${componentName}] ❌ Failed after ${maxAttempts} attempts`);
  return { data: null, error: { message: 'Max retries exceeded' } };
};
