// Quick script to check user purchase data in Supabase
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://hmmimemzznsyilxqakty.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtbWltZW16em5zeWlseHFha3R5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjUxNTYyOCwiZXhwIjoyMDY4MDkxNjI4fQ.HnbU_eP3O5wnN97uJOLT1H_H7RYgZQSXrWlSyQoM1eg";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkUserData() {
  const email = "matthew.crawford23@aol.com";
  
  console.log('🔍 Checking data for:', email);
  
  // Get user ID
  const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
  const user = userData?.users?.find(u => u.email === email);
  
  if (!user) {
    console.log('❌ User not found!');
    return;
  }
  
  console.log('✅ User found:', user.id);
  
  // Check subscribers table
  const { data: subData, error: subError } = await supabase
    .from('subscribers')
    .select('*')
    .eq('user_id', user.id);
  
  console.log('\n📊 Subscribers table:');
  console.log('Data:', subData);
  console.log('Error:', subError);
  
  // Check user_healing_kits table
  const { data: kitData, error: kitError } = await supabase
    .from('user_healing_kits')
    .select('*')
    .eq('user_id', user.id);
  
  console.log('\n📊 User_healing_kits table:');
  console.log('Data:', kitData);
  console.log('Error:', kitError);
  
  // Check users table
  const { data: usersData, error: usersError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id);
  
  console.log('\n📊 Users table:');
  console.log('Data:', usersData);
  console.log('Error:', usersError);
}

checkUserData().catch(console.error);
