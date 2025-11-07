#!/usr/bin/env python3
import os
from supabase import create_client

SUPABASE_URL = "https://hmmimemzznsyilxqakty.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtbWltZW16em5zeWlseHFha3R5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjUxNTYyOCwiZXhwIjoyMDY4MDkxNjI4fQ.HnbU_eP3O5wnN97uJOLT1H_H7RYgZQSXrWlSyQoM1eg"

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

email = "matthew.crawford23@aol.com"

print(f"🔍 Looking for user: {email}")

# First, find the user ID - try auth.admin API or query auth.users
try:
    # Try to find user in subscribers table first
    sub_response = supabase.table('subscribers').select('*').execute()
    print(f"\n📊 ALL Subscribers table data:")
    print(sub_response.data)
    
    kit_response = supabase.table('user_healing_kits').select('*').execute()
    print(f"\n📊 ALL User_healing_kits table data:")
    print(kit_response.data)
    
    users_response = supabase.table('users').select('*').execute()
    print(f"\n📊 ALL Users table data:")
    print(users_response.data if users_response.data else "No data or table doesn't exist")
    
except Exception as e:
    print(f"❌ Error: {e}")
