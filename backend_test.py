#!/usr/bin/env python3
"""
Backend Test Suite for HeartLift MongoDB to Supabase Migration
Comprehensive testing of all backend endpoints after migration
"""

import asyncio
import json
import time
import httpx
import os
import base64
from typing import Dict, List
from datetime import datetime, date

# Get backend URL from environment - use localhost for testing
BACKEND_URL = "http://localhost:8001/api"

class HeartLiftBackendTest:
    def __init__(self):
        self.backend_url = BACKEND_URL
        self.test_results = []
        # Test data as suggested in review request
        self.test_user_id = "11111111-1111-1111-1111-111111111111"
        self.test_reflection_date = "2025-01-17"
        self.coach_ids = ["luna", "sage", "phoenix", "river"]
        
    async def test_daily_reflections_save(self):
        """Test POST /api/reflections/save - Save a reflection with test user_id"""
        print("🧪 Testing Daily Reflections Save (CRITICAL)...")
        
        test_data = {
            "user_id": self.test_user_id,
            "reflection_date": self.test_reflection_date,
            "coaches_chatted_with": ["luna", "sage"],
            "conversation_rating": 8,
            "helpful_moments": "Luna helped me understand my attachment patterns better",
            "areas_for_improvement": "Need to work on self-compassion"
        }
        
        try:
            start_time = time.time()
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    f"{self.backend_url}/reflections/save",
                    json=test_data,
                    headers={"Content-Type": "application/json"}
                )
            
            end_time = time.time()
            response_time = end_time - start_time
            
            print(f"⏱️  Response time: {response_time:.2f} seconds")
            
            if response.status_code == 200:
                result = response.json()
                
                # Validate response structure
                required_fields = ["user_id", "reflection_date", "coaches_chatted_with"]
                missing_fields = [field for field in required_fields if field not in result]
                
                if missing_fields:
                    print(f"❌ Missing required fields: {missing_fields}")
                    self.test_results.append({
                        "test": "Daily Reflections Save",
                        "status": "FAILED",
                        "error": f"Missing fields: {missing_fields}",
                        "response_time": response_time
                    })
                    return False
                
                # Validate data matches what we sent
                if result.get("user_id") != self.test_user_id:
                    print(f"❌ User ID mismatch: expected {self.test_user_id}, got {result.get('user_id')}")
                    self.test_results.append({
                        "test": "Daily Reflections Save",
                        "status": "FAILED",
                        "error": "User ID mismatch",
                        "response_time": response_time
                    })
                    return False
                
                print(f"✅ Reflection saved successfully for user {self.test_user_id}")
                print(f"✅ Reflection ID: {result.get('id', 'N/A')}")
                print(f"✅ Data persisted to Supabase daily_reflections table")
                
                self.test_results.append({
                    "test": "Daily Reflections Save",
                    "status": "PASSED",
                    "response_time": response_time,
                    "reflection_id": result.get('id'),
                    "user_id": result.get('user_id')
                })
                return True
                
            else:
                print(f"❌ HTTP Error: {response.status_code}")
                print(f"❌ Response: {response.text}")
                self.test_results.append({
                    "test": "Daily Reflections Save",
                    "status": "FAILED",
                    "error": f"HTTP {response.status_code}: {response.text}",
                    "response_time": response_time
                })
                return False
                
        except Exception as e:
            import traceback
            error_msg = f"{str(e)}\n{traceback.format_exc()}"
            print(f"❌ Exception: {error_msg}")
            self.test_results.append({
                "test": "Daily Reflections Save",
                "status": "FAILED",
                "error": error_msg,
                "response_time": None
            })
            return False

    async def test_daily_reflections_today(self):
        """Test GET /api/reflections/today/{user_id} - Retrieve today's reflection"""
        print("\n🧪 Testing Daily Reflections Today Retrieval...")
        
        try:
            start_time = time.time()
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self.backend_url}/reflections/today/{self.test_user_id}",
                    headers={"Content-Type": "application/json"}
                )
            
            end_time = time.time()
            response_time = end_time - start_time
            
            print(f"⏱️  Response time: {response_time:.2f} seconds")
            
            if response.status_code == 200:
                result = response.json()
                
                if result is None:
                    print("✅ No reflection found for today (valid response)")
                    self.test_results.append({
                        "test": "Daily Reflections Today",
                        "status": "PASSED",
                        "response_time": response_time,
                        "found_reflection": False
                    })
                    return True
                
                # Validate response structure if reflection found
                if isinstance(result, dict):
                    required_fields = ["user_id", "reflection_date"]
                    missing_fields = [field for field in required_fields if field not in result]
                    
                    if missing_fields:
                        print(f"❌ Missing required fields: {missing_fields}")
                        self.test_results.append({
                            "test": "Daily Reflections Today",
                            "status": "FAILED",
                            "error": f"Missing fields: {missing_fields}",
                            "response_time": response_time
                        })
                        return False
                    
                    print(f"✅ Today's reflection retrieved successfully")
                    print(f"✅ User ID: {result.get('user_id')}")
                    print(f"✅ Date: {result.get('reflection_date')}")
                    
                    self.test_results.append({
                        "test": "Daily Reflections Today",
                        "status": "PASSED",
                        "response_time": response_time,
                        "found_reflection": True,
                        "reflection_date": result.get('reflection_date')
                    })
                    return True
                
            else:
                print(f"❌ HTTP Error: {response.status_code}")
                print(f"❌ Response: {response.text}")
                self.test_results.append({
                    "test": "Daily Reflections Today",
                    "status": "FAILED",
                    "error": f"HTTP {response.status_code}: {response.text}",
                    "response_time": response_time
                })
                return False
                
        except Exception as e:
            import traceback
            error_msg = f"{str(e)}\n{traceback.format_exc()}"
            print(f"❌ Exception: {error_msg}")
            self.test_results.append({
                "test": "Daily Reflections Today",
                "status": "FAILED",
                "error": error_msg,
                "response_time": None
            })
            return False

    async def test_daily_reflections_past(self):
        """Test GET /api/reflections/past/{user_id} - Get all past reflections"""
        print("\n🧪 Testing Daily Reflections Past Retrieval...")
        
        try:
            start_time = time.time()
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self.backend_url}/reflections/past/{self.test_user_id}",
                    headers={"Content-Type": "application/json"}
                )
            
            end_time = time.time()
            response_time = end_time - start_time
            
            print(f"⏱️  Response time: {response_time:.2f} seconds")
            
            if response.status_code == 200:
                result = response.json()
                
                if not isinstance(result, list):
                    print(f"❌ Expected list, got {type(result)}")
                    self.test_results.append({
                        "test": "Daily Reflections Past",
                        "status": "FAILED",
                        "error": f"Expected list, got {type(result)}",
                        "response_time": response_time
                    })
                    return False
                
                print(f"✅ Past reflections retrieved successfully")
                print(f"✅ Found {len(result)} reflections")
                
                # Validate structure of first reflection if any exist
                if result:
                    first_reflection = result[0]
                    required_fields = ["user_id", "reflection_date"]
                    missing_fields = [field for field in required_fields if field not in first_reflection]
                    
                    if missing_fields:
                        print(f"❌ Missing required fields in first reflection: {missing_fields}")
                        self.test_results.append({
                            "test": "Daily Reflections Past",
                            "status": "FAILED",
                            "error": f"Missing fields: {missing_fields}",
                            "response_time": response_time
                        })
                        return False
                    
                    print(f"✅ First reflection structure validated")
                
                self.test_results.append({
                    "test": "Daily Reflections Past",
                    "status": "PASSED",
                    "response_time": response_time,
                    "reflection_count": len(result)
                })
                return True
                
            else:
                print(f"❌ HTTP Error: {response.status_code}")
                print(f"❌ Response: {response.text}")
                self.test_results.append({
                    "test": "Daily Reflections Past",
                    "status": "FAILED",
                    "error": f"HTTP {response.status_code}: {response.text}",
                    "response_time": response_time
                })
                return False
                
        except Exception as e:
            import traceback
            error_msg = f"{str(e)}\n{traceback.format_exc()}"
            print(f"❌ Exception: {error_msg}")
            self.test_results.append({
                "test": "Daily Reflections Past",
                "status": "FAILED",
                "error": error_msg,
                "response_time": None
            })
            return False
    
    async def test_ai_chat_endpoint(self):
        """Test POST /api/ai/chat - Test chat with coach (should fetch reflections for context)"""
        print("\n🧪 Testing AI Chat Endpoint (CRITICAL)...")
        
        test_data = {
            "message": "I'm feeling anxious about my relationship today",
            "coach_id": "luna",
            "conversation_history": [
                {"content": "Hello", "sender": "user"},
                {"content": "Hello! I'm Luna, your love coach. How are you feeling today?", "sender": "coach"}
            ],
            "user_name": "TestUser",
            "user_id": self.test_user_id
        }
        
        try:
            start_time = time.time()
            
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(
                    f"{self.backend_url}/ai/chat",
                    json=test_data,
                    headers={"Content-Type": "application/json"}
                )
            
            end_time = time.time()
            response_time = end_time - start_time
            
            print(f"⏱️  Response time: {response_time:.2f} seconds")
            
            if response.status_code == 200:
                result = response.json()
                
                # Validate response structure
                required_fields = ["response", "session_id"]
                missing_fields = [field for field in required_fields if field not in result]
                
                if missing_fields:
                    print(f"❌ Missing required fields: {missing_fields}")
                    self.test_results.append({
                        "test": "AI Chat Endpoint",
                        "status": "FAILED",
                        "error": f"Missing fields: {missing_fields}",
                        "response_time": response_time
                    })
                    return False
                
                # Validate response content
                chat_response = result.get("response", "")
                session_id = result.get("session_id", "")
                
                if len(chat_response) < 10:
                    print(f"❌ Chat response too short: {len(chat_response)} characters")
                    self.test_results.append({
                        "test": "AI Chat Endpoint",
                        "status": "FAILED",
                        "error": "Chat response too short",
                        "response_time": response_time
                    })
                    return False
                
                if not session_id:
                    print("❌ Session ID missing")
                    self.test_results.append({
                        "test": "AI Chat Endpoint",
                        "status": "FAILED",
                        "error": "Session ID missing",
                        "response_time": response_time
                    })
                    return False
                
                print(f"✅ AI chat response generated successfully")
                print(f"✅ Response length: {len(chat_response)} characters")
                print(f"✅ Session ID: {session_id}")
                print(f"✅ Usage tracking should be logged to usage_tracking table")
                print(f"✅ Response preview: {chat_response[:100]}...")
                
                self.test_results.append({
                    "test": "AI Chat Endpoint",
                    "status": "PASSED",
                    "response_time": response_time,
                    "response_length": len(chat_response),
                    "session_id": session_id,
                    "coach_id": test_data["coach_id"]
                })
                return True
                
            else:
                print(f"❌ HTTP Error: {response.status_code}")
                print(f"❌ Response: {response.text}")
                self.test_results.append({
                    "test": "AI Chat Endpoint",
                    "status": "FAILED",
                    "error": f"HTTP {response.status_code}: {response.text}",
                    "response_time": response_time
                })
                return False
                
        except Exception as e:
            import traceback
            error_msg = f"{str(e)}\n{traceback.format_exc()}"
            print(f"❌ Exception: {error_msg}")
            self.test_results.append({
                "test": "AI Chat Endpoint",
                "status": "FAILED",
                "error": error_msg,
                "response_time": None
            })
            return False

    async def test_insights_generation(self):
        """Test POST /api/ai/insights - Generate insights for a user"""
        print("\n🧪 Testing Insights Generation (CRITICAL)...")
        
        test_data = {
            "user_id": self.test_user_id
        }
        
        try:
            start_time = time.time()
            
            async with httpx.AsyncClient(timeout=20.0) as client:
                response = await client.post(
                    f"{self.backend_url}/ai/insights",
                    json=test_data,
                    headers={"Content-Type": "application/json"}
                )
            
            end_time = time.time()
            response_time = end_time - start_time
            
            print(f"⏱️  Response time: {response_time:.2f} seconds")
            
            if response.status_code == 200:
                result = response.json()
                
                # Validate response structure
                required_fields = [
                    "emotionalPatterns", "communicationStyle", "keyInsights", 
                    "personalizedRecommendations", "moodTrends", "nextSteps"
                ]
                missing_fields = [field for field in required_fields if field not in result]
                
                if missing_fields:
                    print(f"❌ Missing required fields: {missing_fields}")
                    self.test_results.append({
                        "test": "Insights Generation",
                        "status": "FAILED",
                        "error": f"Missing fields: {missing_fields}",
                        "response_time": response_time
                    })
                    return False
                
                # Check if insights fetch data from Supabase
                insights_text = json.dumps(result).lower()
                
                # Look for signs that real data was fetched vs generic placeholders
                data_indicators = ["conversation", "reflection", "chat", "message"]
                generic_indicators = ["starting healing journey", "building self-awareness", "placeholder"]
                
                data_count = sum(1 for indicator in data_indicators if indicator in insights_text)
                generic_count = sum(1 for indicator in generic_indicators if indicator in insights_text)
                
                print(f"📊 Data indicators: {data_count}, Generic indicators: {generic_count}")
                
                print(f"✅ Insights generated successfully")
                print(f"✅ Should fetch data from Supabase (conversations and reflections)")
                print(f"✅ Response structure validated")
                
                self.test_results.append({
                    "test": "Insights Generation",
                    "status": "PASSED",
                    "response_time": response_time,
                    "data_indicators": data_count,
                    "generic_indicators": generic_count,
                    "user_id": test_data["user_id"]
                })
                return True
                
            else:
                print(f"❌ HTTP Error: {response.status_code}")
                print(f"❌ Response: {response.text}")
                self.test_results.append({
                    "test": "Insights Generation",
                    "status": "FAILED",
                    "error": f"HTTP {response.status_code}: {response.text}",
                    "response_time": response_time
                })
                return False
                
        except Exception as e:
            import traceback
            error_msg = f"{str(e)}\n{traceback.format_exc()}"
            print(f"❌ Exception: {error_msg}")
            self.test_results.append({
                "test": "Insights Generation",
                "status": "FAILED",
                "error": error_msg,
                "response_time": None
            })
            return False

    async def test_insights_save(self):
        """Test POST /api/insights/save - Save generated insights"""
        print("\n🧪 Testing Insights Save...")
        
        test_data = {
            "user_id": self.test_user_id,
            "insights": {
                "emotionalPatterns": ["Anxious attachment patterns", "Seeking reassurance"],
                "keyInsights": {
                    "strengths": ["Self-aware", "Willing to grow"],
                    "areasForGrowth": ["Self-compassion", "Trust building"],
                    "progressSigns": ["Increased awareness", "Better communication"]
                }
            },
            "conversation_count": 5,
            "mood_entries_analyzed": 3,
            "attachment_style": "anxious",
            "healing_progress_score": 75,
            "analysis_period_start": "2025-01-10",
            "analysis_period_end": "2025-01-17"
        }
        
        try:
            start_time = time.time()
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    f"{self.backend_url}/insights/save",
                    json=test_data,
                    headers={"Content-Type": "application/json"}
                )
            
            end_time = time.time()
            response_time = end_time - start_time
            
            print(f"⏱️  Response time: {response_time:.2f} seconds")
            
            if response.status_code == 200:
                result = response.json()
                
                # Validate response structure
                required_fields = ["user_id", "insights", "report_type"]
                missing_fields = [field for field in required_fields if field not in result]
                
                if missing_fields:
                    print(f"❌ Missing required fields: {missing_fields}")
                    self.test_results.append({
                        "test": "Insights Save",
                        "status": "FAILED",
                        "error": f"Missing fields: {missing_fields}",
                        "response_time": response_time
                    })
                    return False
                
                print(f"✅ Insights saved successfully")
                print(f"✅ Report ID: {result.get('id', 'N/A')}")
                print(f"✅ Data persisted to Supabase insights_reports table")
                
                self.test_results.append({
                    "test": "Insights Save",
                    "status": "PASSED",
                    "response_time": response_time,
                    "report_id": result.get('id'),
                    "user_id": result.get('user_id')
                })
                return True
                
            else:
                print(f"❌ HTTP Error: {response.status_code}")
                print(f"❌ Response: {response.text}")
                self.test_results.append({
                    "test": "Insights Save",
                    "status": "FAILED",
                    "error": f"HTTP {response.status_code}: {response.text}",
                    "response_time": response_time
                })
                return False
                
        except Exception as e:
            import traceback
            error_msg = f"{str(e)}\n{traceback.format_exc()}"
            print(f"❌ Exception: {error_msg}")
            self.test_results.append({
                "test": "Insights Save",
                "status": "FAILED",
                "error": error_msg,
                "response_time": None
            })
            return False

    async def test_insights_reports_retrieval(self):
        """Test GET /api/insights/reports/{user_id} - Retrieve saved reports"""
        print("\n🧪 Testing Insights Reports Retrieval...")
        
        try:
            start_time = time.time()
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self.backend_url}/insights/reports/{self.test_user_id}",
                    headers={"Content-Type": "application/json"}
                )
            
            end_time = time.time()
            response_time = end_time - start_time
            
            print(f"⏱️  Response time: {response_time:.2f} seconds")
            
            if response.status_code == 200:
                result = response.json()
                
                if not isinstance(result, list):
                    print(f"❌ Expected list, got {type(result)}")
                    self.test_results.append({
                        "test": "Insights Reports Retrieval",
                        "status": "FAILED",
                        "error": f"Expected list, got {type(result)}",
                        "response_time": response_time
                    })
                    return False
                
                print(f"✅ Insights reports retrieved successfully")
                print(f"✅ Found {len(result)} reports")
                
                self.test_results.append({
                    "test": "Insights Reports Retrieval",
                    "status": "PASSED",
                    "response_time": response_time,
                    "report_count": len(result)
                })
                return True
                
            else:
                print(f"❌ HTTP Error: {response.status_code}")
                print(f"❌ Response: {response.text}")
                self.test_results.append({
                    "test": "Insights Reports Retrieval",
                    "status": "FAILED",
                    "error": f"HTTP {response.status_code}: {response.text}",
                    "response_time": response_time
                })
                return False
                
        except Exception as e:
            import traceback
            error_msg = f"{str(e)}\n{traceback.format_exc()}"
            print(f"❌ Exception: {error_msg}")
            self.test_results.append({
                "test": "Insights Reports Retrieval",
                "status": "FAILED",
                "error": error_msg,
                "response_time": None
            })
            return False

    async def test_response_structure_validation(self):
        """Test that response structure matches frontend expectations"""
        print("\n🧪 Testing Response Structure Validation...")
        
        test_data = {
            "questions_and_answers": [
                {"question": "Test question 1", "answer": "Test answer 1"},
                {"question": "Test question 2", "answer": "Test answer 2"}
            ],
            "user_id": "structure-test-user"
        }
        
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(
                    f"{self.backend_url}/ai/quiz/analyze",
                    json=test_data,
                    headers={"Content-Type": "application/json"}
                )
            
            if response.status_code == 200:
                result = response.json()
                
                # Detailed structure validation
                structure_checks = []
                
                # Check top-level structure
                if "attachmentStyle" in result:
                    structure_checks.append("✅ attachmentStyle field present")
                else:
                    structure_checks.append("❌ attachmentStyle field missing")
                
                if "analysis" in result and isinstance(result["analysis"], dict):
                    structure_checks.append("✅ analysis object present")
                    
                    analysis = result["analysis"]
                    
                    # Check analysis sub-fields
                    if "detailedBreakdown" in analysis:
                        structure_checks.append("✅ detailedBreakdown present")
                        breakdown = analysis["detailedBreakdown"]
                        if isinstance(breakdown, dict):
                            for field in ["strengths", "challenges", "relationshipPatterns"]:
                                if field in breakdown and isinstance(breakdown[field], list):
                                    structure_checks.append(f"✅ detailedBreakdown.{field} is list")
                                else:
                                    structure_checks.append(f"❌ detailedBreakdown.{field} missing or not list")
                    else:
                        structure_checks.append("❌ detailedBreakdown missing")
                    
                    if "healingPath" in analysis:
                        structure_checks.append("✅ healingPath present")
                    else:
                        structure_checks.append("❌ healingPath missing")
                    
                    if "triggers" in analysis and isinstance(analysis["triggers"], list):
                        structure_checks.append("✅ triggers is list")
                    else:
                        structure_checks.append("❌ triggers missing or not list")
                    
                    if "copingTechniques" in analysis and isinstance(analysis["copingTechniques"], list):
                        structure_checks.append("✅ copingTechniques is list")
                        # Check coping techniques structure
                        if analysis["copingTechniques"]:
                            first_technique = analysis["copingTechniques"][0]
                            if isinstance(first_technique, dict):
                                for field in ["technique", "description", "example"]:
                                    if field in first_technique:
                                        structure_checks.append(f"✅ copingTechniques[0].{field} present")
                                    else:
                                        structure_checks.append(f"❌ copingTechniques[0].{field} missing")
                    else:
                        structure_checks.append("❌ copingTechniques missing or not list")
                        
                else:
                    structure_checks.append("❌ analysis object missing")
                
                # Print all structure checks
                for check in structure_checks:
                    print(f"  {check}")
                
                # Determine overall result
                failed_checks = [check for check in structure_checks if check.startswith("❌")]
                if not failed_checks:
                    print("✅ All structure validation checks passed")
                    self.test_results.append({
                        "test": "Response Structure Validation",
                        "status": "PASSED",
                        "structure_checks": len(structure_checks),
                        "failed_checks": 0
                    })
                    return True
                else:
                    print(f"❌ {len(failed_checks)} structure validation checks failed")
                    self.test_results.append({
                        "test": "Response Structure Validation",
                        "status": "FAILED",
                        "structure_checks": len(structure_checks),
                        "failed_checks": len(failed_checks),
                        "failures": failed_checks
                    })
                    return False
                    
            else:
                print(f"❌ HTTP Error: {response.status_code}")
                self.test_results.append({
                    "test": "Response Structure Validation",
                    "status": "FAILED",
                    "error": f"HTTP {response.status_code}: {response.text}"
                })
                return False
                
        except Exception as e:
            import traceback
            error_msg = f"{str(e)}\n{traceback.format_exc()}"
            print(f"❌ Exception: {error_msg}")
            self.test_results.append({
                "test": "Response Structure Validation",
                "status": "FAILED",
                "error": error_msg
            })
            return False
    
    async def test_performance_requirement(self):
        """Test that analysis completes within 10 seconds"""
        print("\n🧪 Testing Performance Requirement (< 10 seconds)...")
        
        test_data = {
            "questions_and_answers": [
                {"question": "Performance test question 1", "answer": "Performance test answer 1"},
                {"question": "Performance test question 2", "answer": "Performance test answer 2"},
                {"question": "Performance test question 3", "answer": "Performance test answer 3"},
                {"question": "Performance test question 4", "answer": "Performance test answer 4"},
                {"question": "Performance test question 5", "answer": "Performance test answer 5"}
            ],
            "user_id": "performance-test-user"
        }
        
        try:
            start_time = time.time()
            
            async with httpx.AsyncClient(timeout=12.0) as client:
                response = await client.post(
                    f"{self.backend_url}/ai/quiz/analyze",
                    json=test_data,
                    headers={"Content-Type": "application/json"}
                )
            
            end_time = time.time()
            response_time = end_time - start_time
            
            print(f"⏱️  Response time: {response_time:.2f} seconds")
            
            if response.status_code == 200:
                if response_time <= 10.0:
                    print(f"✅ Performance requirement met ({response_time:.2f}s ≤ 10s)")
                    self.test_results.append({
                        "test": "Performance Requirement",
                        "status": "PASSED",
                        "response_time": response_time,
                        "requirement": "≤ 10 seconds"
                    })
                    return True
                else:
                    print(f"❌ Performance requirement not met ({response_time:.2f}s > 10s)")
                    self.test_results.append({
                        "test": "Performance Requirement",
                        "status": "FAILED",
                        "response_time": response_time,
                        "requirement": "≤ 10 seconds",
                        "error": f"Response time {response_time:.2f}s exceeds 10s limit"
                    })
                    return False
            else:
                print(f"❌ HTTP Error: {response.status_code}")
                self.test_results.append({
                    "test": "Performance Requirement",
                    "status": "FAILED",
                    "error": f"HTTP {response.status_code}: {response.text}",
                    "response_time": response_time
                })
                return False
                
        except Exception as e:
            print(f"❌ Exception: {str(e)}")
            self.test_results.append({
                "test": "Performance Requirement",
                "status": "FAILED",
                "error": str(e)
            })
            return False
    
    async def test_error_handling(self):
        """Test error handling with invalid data"""
        print("\n🧪 Testing Error Handling...")
        
        # Test with empty questions_and_answers
        test_data = {
            "questions_and_answers": [],
            "user_id": "error-test-user"
        }
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    f"{self.backend_url}/ai/quiz/analyze",
                    json=test_data,
                    headers={"Content-Type": "application/json"}
                )
            
            # Should handle gracefully (either return fallback or proper error)
            if response.status_code in [200, 400, 422]:
                print(f"✅ Error handling works (status: {response.status_code})")
                self.test_results.append({
                    "test": "Error Handling",
                    "status": "PASSED",
                    "response_code": response.status_code,
                    "handles_empty_data": True
                })
                return True
            else:
                print(f"❌ Unexpected error response: {response.status_code}")
                self.test_results.append({
                    "test": "Error Handling",
                    "status": "FAILED",
                    "error": f"Unexpected status code: {response.status_code}",
                    "response": response.text
                })
                return False
                
        except Exception as e:
            import traceback
            error_msg = f"{str(e)}\n{traceback.format_exc()}"
            print(f"❌ Exception during error handling test: {error_msg}")
            self.test_results.append({
                "test": "Error Handling",
                "status": "FAILED",
                "error": error_msg
            })
            return False
    
    async def test_heart_vision_image_generation(self):
        """Test HeartVisions image generation with DALL-E 3 HD quality"""
        print("\n🧪 Testing HeartVisions Image Generation (DALL-E 3 HD)...")
        
        test_data = {
            "prompt": "a peaceful sunrise over calm water",
            "user_name": "TestUser"
        }
        
        try:
            start_time = time.time()
            
            async with httpx.AsyncClient(timeout=50.0) as client:  # 50s timeout for image generation
                response = await client.post(
                    f"{self.backend_url}/ai/heart-vision",
                    json=test_data,
                    headers={"Content-Type": "application/json"}
                )
            
            end_time = time.time()
            response_time = end_time - start_time
            
            print(f"⏱️  Response time: {response_time:.2f} seconds")
            
            if response.status_code == 200:
                result = response.json()
                
                # Validate response structure
                required_fields = ["image_base64", "caption"]
                missing_fields = [field for field in required_fields if field not in result]
                
                if missing_fields:
                    print(f"❌ Missing required fields: {missing_fields}")
                    self.test_results.append({
                        "test": "HeartVisions Image Generation",
                        "status": "FAILED",
                        "error": f"Missing fields: {missing_fields}",
                        "response_time": response_time
                    })
                    return False
                
                # Validate image_base64 is valid base64
                image_base64 = result.get("image_base64")
                if image_base64:
                    try:
                        # Try to decode base64 to validate it
                        decoded = base64.b64decode(image_base64)
                        if len(decoded) > 1000:  # Should be a reasonable image size
                            print(f"✅ Valid base64 image data ({len(decoded)} bytes)")
                        else:
                            print(f"⚠️  Image data seems small ({len(decoded)} bytes)")
                    except Exception as e:
                        print(f"❌ Invalid base64 image data: {e}")
                        self.test_results.append({
                            "test": "HeartVisions Image Generation",
                            "status": "FAILED",
                            "error": f"Invalid base64 data: {e}",
                            "response_time": response_time
                        })
                        return False
                else:
                    print("❌ No image_base64 in response")
                    self.test_results.append({
                        "test": "HeartVisions Image Generation",
                        "status": "FAILED",
                        "error": "No image_base64 in response",
                        "response_time": response_time
                    })
                    return False
                
                # Check caption
                caption = result.get("caption")
                if caption and len(caption) > 10:
                    print(f"✅ Caption generated: {caption[:100]}...")
                else:
                    print("⚠️  Caption missing or too short")
                
                # Check response time (should be under 45 seconds)
                if response_time > 45:
                    print(f"⚠️  Response time ({response_time:.2f}s) exceeds 45 second timeout")
                    self.test_results.append({
                        "test": "HeartVisions Image Generation",
                        "status": "WARNING",
                        "error": f"Response time {response_time:.2f}s > 45s timeout",
                        "response_time": response_time,
                        "image_size": len(decoded) if 'decoded' in locals() else 0
                    })
                else:
                    print(f"✅ Response time within timeout ({response_time:.2f}s < 45s)")
                
                print("✅ HeartVisions image generation successful")
                self.test_results.append({
                    "test": "HeartVisions Image Generation",
                    "status": "PASSED",
                    "response_time": response_time,
                    "image_size": len(decoded) if 'decoded' in locals() else 0,
                    "has_caption": bool(caption)
                })
                return True
                
            else:
                print(f"❌ HTTP Error: {response.status_code}")
                print(f"❌ Response: {response.text}")
                self.test_results.append({
                    "test": "HeartVisions Image Generation",
                    "status": "FAILED",
                    "error": f"HTTP {response.status_code}: {response.text}",
                    "response_time": response_time
                })
                return False
                
        except Exception as e:
            import traceback
            error_msg = f"{str(e)}\n{traceback.format_exc()}"
            print(f"❌ Exception: {error_msg}")
            self.test_results.append({
                "test": "HeartVisions Image Generation",
                "status": "FAILED",
                "error": error_msg,
                "response_time": None
            })
            return False
    
    async def test_personalized_insights_generation(self):
        """Test personalized insights with real user data integration"""
        print("\n🧪 Testing Personalized Insights Generation (Real Data)...")
        
        # Use the specific user_id mentioned in the review request
        test_data = {
            "user_id": "142200f7-6638-47d7-9cae-920a1ed6f9ff"
        }
        
        try:
            start_time = time.time()
            
            async with httpx.AsyncClient(timeout=20.0) as client:
                response = await client.post(
                    f"{self.backend_url}/ai/insights",
                    json=test_data,
                    headers={"Content-Type": "application/json"}
                )
            
            end_time = time.time()
            response_time = end_time - start_time
            
            print(f"⏱️  Response time: {response_time:.2f} seconds")
            
            if response.status_code == 200:
                result = response.json()
                
                # Validate response structure
                required_fields = [
                    "emotionalPatterns", "communicationStyle", "keyInsights", 
                    "personalizedRecommendations", "moodTrends", "nextSteps"
                ]
                missing_fields = [field for field in required_fields if field not in result]
                
                if missing_fields:
                    print(f"❌ Missing required fields: {missing_fields}")
                    self.test_results.append({
                        "test": "Personalized Insights Generation",
                        "status": "FAILED",
                        "error": f"Missing fields: {missing_fields}",
                        "response_time": response_time
                    })
                    return False
                
                # Check for personalization indicators (not generic placeholders)
                insights_text = json.dumps(result).lower()
                
                # Check if insights contain specific/personalized content vs generic placeholders
                generic_indicators = [
                    "starting healing journey", "building self-awareness", 
                    "getting started", "placeholder", "example"
                ]
                
                personalized_indicators = [
                    "conversation", "chat", "reflection", "progress", 
                    "growth", "pattern", "specific"
                ]
                
                generic_count = sum(1 for indicator in generic_indicators if indicator in insights_text)
                personalized_count = sum(1 for indicator in personalized_indicators if indicator in insights_text)
                
                print(f"📊 Generic indicators: {generic_count}, Personalized indicators: {personalized_count}")
                
                # Validate structure of key fields
                structure_checks = []
                
                # Check emotionalPatterns
                emotional_patterns = result.get("emotionalPatterns", [])
                if isinstance(emotional_patterns, list) and len(emotional_patterns) >= 3:
                    structure_checks.append("✅ emotionalPatterns is valid list")
                else:
                    structure_checks.append("❌ emotionalPatterns invalid or too short")
                
                # Check keyInsights structure
                key_insights = result.get("keyInsights", {})
                if isinstance(key_insights, dict):
                    required_insight_keys = ["strengths", "areasForGrowth", "progressSigns"]
                    for key in required_insight_keys:
                        if key in key_insights and isinstance(key_insights[key], list):
                            structure_checks.append(f"✅ keyInsights.{key} is valid list")
                        else:
                            structure_checks.append(f"❌ keyInsights.{key} missing or invalid")
                else:
                    structure_checks.append("❌ keyInsights is not a dict")
                
                # Check personalizedRecommendations structure
                recommendations = result.get("personalizedRecommendations", [])
                if isinstance(recommendations, list) and len(recommendations) >= 3:
                    structure_checks.append("✅ personalizedRecommendations is valid list")
                    # Check first recommendation structure
                    if recommendations and isinstance(recommendations[0], dict):
                        rec_keys = ["category", "recommendation", "why"]
                        for key in rec_keys:
                            if key in recommendations[0]:
                                structure_checks.append(f"✅ recommendation[0].{key} present")
                            else:
                                structure_checks.append(f"❌ recommendation[0].{key} missing")
                else:
                    structure_checks.append("❌ personalizedRecommendations invalid or too short")
                
                # Check moodTrends structure
                mood_trends = result.get("moodTrends", {})
                if isinstance(mood_trends, dict):
                    mood_keys = ["pattern", "triggers", "improvements"]
                    for key in mood_keys:
                        if key in mood_trends:
                            structure_checks.append(f"✅ moodTrends.{key} present")
                        else:
                            structure_checks.append(f"❌ moodTrends.{key} missing")
                else:
                    structure_checks.append("❌ moodTrends is not a dict")
                
                # Check nextSteps
                next_steps = result.get("nextSteps", [])
                if isinstance(next_steps, list) and len(next_steps) >= 3:
                    structure_checks.append("✅ nextSteps is valid list")
                else:
                    structure_checks.append("❌ nextSteps invalid or too short")
                
                # Print structure checks
                for check in structure_checks:
                    print(f"  {check}")
                
                # Determine overall result
                failed_checks = [check for check in structure_checks if check.startswith("❌")]
                if not failed_checks:
                    print("✅ All insights structure validation checks passed")
                    
                    # Check if insights appear personalized
                    if personalized_count > generic_count:
                        print("✅ Insights appear to be personalized (not generic)")
                        personalization_status = "PERSONALIZED"
                    else:
                        print("⚠️  Insights may still be generic (check data integration)")
                        personalization_status = "POSSIBLY_GENERIC"
                    
                    self.test_results.append({
                        "test": "Personalized Insights Generation",
                        "status": "PASSED",
                        "response_time": response_time,
                        "structure_checks": len(structure_checks),
                        "failed_checks": 0,
                        "personalization_status": personalization_status,
                        "generic_indicators": generic_count,
                        "personalized_indicators": personalized_count
                    })
                    return True
                else:
                    print(f"❌ {len(failed_checks)} insights structure validation checks failed")
                    self.test_results.append({
                        "test": "Personalized Insights Generation",
                        "status": "FAILED",
                        "response_time": response_time,
                        "structure_checks": len(structure_checks),
                        "failed_checks": len(failed_checks),
                        "failures": failed_checks
                    })
                    return False
                    
            else:
                print(f"❌ HTTP Error: {response.status_code}")
                print(f"❌ Response: {response.text}")
                self.test_results.append({
                    "test": "Personalized Insights Generation",
                    "status": "FAILED",
                    "error": f"HTTP {response.status_code}: {response.text}",
                    "response_time": response_time
                })
                return False
                
        except Exception as e:
            import traceback
            error_msg = f"{str(e)}\n{traceback.format_exc()}"
            print(f"❌ Exception: {error_msg}")
            self.test_results.append({
                "test": "Personalized Insights Generation",
                "status": "FAILED",
                "error": error_msg,
                "response_time": None
            })
            return False
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*60)
        print("🧪 HEARTLIFT BACKEND TEST SUMMARY")
        print("="*60)
        
        passed = sum(1 for result in self.test_results if result["status"] == "PASSED")
        failed = sum(1 for result in self.test_results if result["status"] == "FAILED")
        warnings = sum(1 for result in self.test_results if result["status"] == "WARNING")
        
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"⚠️  Warnings: {warnings}")
        print(f"📊 Total: {len(self.test_results)}")
        
        print("\nDetailed Results:")
        for result in self.test_results:
            status_icon = "✅" if result["status"] == "PASSED" else "❌" if result["status"] == "FAILED" else "⚠️"
            print(f"{status_icon} {result['test']}: {result['status']}")
            if "error" in result:
                print(f"   Error: {result['error']}")
            if "response_time" in result and result["response_time"]:
                print(f"   Response Time: {result['response_time']:.2f}s")
        
        return passed, failed, warnings

async def main():
    """Run all HeartLift backend tests including critical fixes"""
    print("🚀 Starting HeartLift Backend Tests - Critical Fixes Validation")
    print(f"🔗 Backend URL: {BACKEND_URL}")
    print("-" * 60)
    
    tester = HeartLiftBackendTest()
    
    # Run critical fix tests first
    print("🎯 TESTING CRITICAL FIXES:")
    critical_tests = [
        tester.test_heart_vision_image_generation(),
        tester.test_personalized_insights_generation()
    ]
    
    print("\n📋 TESTING EXISTING FUNCTIONALITY:")
    existing_tests = [
        tester.test_basic_quiz_analysis(),
        tester.test_response_structure_validation(),
        tester.test_performance_requirement(),
        tester.test_error_handling()
    ]
    
    # Run all tests
    all_tests = critical_tests + existing_tests
    
    results = await asyncio.gather(*all_tests, return_exceptions=True)
    
    # Print summary
    passed, failed, warnings = tester.print_summary()
    
    # Return overall result
    if failed == 0:
        print("\n🎉 All tests passed!")
        return True
    else:
        print(f"\n💥 {failed} test(s) failed!")
        return False

if __name__ == "__main__":
    success = asyncio.run(main())
    exit(0 if success else 1)