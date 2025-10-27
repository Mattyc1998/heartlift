#!/usr/bin/env python3
"""
Backend Test Suite for HeartLift Quiz Analysis
Tests the POST /api/ai/quiz/analyze endpoint functionality
"""

import asyncio
import json
import time
import httpx
import os
from typing import Dict, List

# Get backend URL from environment
BACKEND_URL = "https://ai-migration-hub.preview.emergentagent.com/api"

class QuizAnalysisTest:
    def __init__(self):
        self.backend_url = BACKEND_URL
        self.test_results = []
        
    async def test_basic_quiz_analysis(self):
        """Test basic quiz analysis with sample questions and answers"""
        print("🧪 Testing Basic Quiz Analysis...")
        
        # Sample quiz data as specified in the review request
        test_data = {
            "questions_and_answers": [
                {"question": "When facing a disagreement with your partner, you tend to:", "answer": "Become anxious and seek immediate resolution"},
                {"question": "How do you typically react when your partner needs space?", "answer": "Feel abandoned or anxious"},
                {"question": "In relationships, you generally:", "answer": "Seek constant reassurance"},
                {"question": "When someone shows interest in you, you:", "answer": "Worry about when they'll lose interest"},
                {"question": "Your comfort level with emotional intimacy is:", "answer": "High, but accompanied by anxiety"}
            ],
            "user_id": "test-user-123"
        }
        
        try:
            start_time = time.time()
            
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(
                    f"{self.backend_url}/ai/quiz/analyze",
                    json=test_data,
                    headers={"Content-Type": "application/json"}
                )
            
            end_time = time.time()
            response_time = end_time - start_time
            
            print(f"⏱️  Response time: {response_time:.2f} seconds")
            
            if response.status_code == 200:
                result = response.json()
                
                # Validate response structure
                required_fields = ["attachmentStyle", "analysis"]
                missing_fields = [field for field in required_fields if field not in result]
                
                if missing_fields:
                    print(f"❌ Missing required fields: {missing_fields}")
                    self.test_results.append({
                        "test": "Basic Quiz Analysis",
                        "status": "FAILED",
                        "error": f"Missing fields: {missing_fields}",
                        "response_time": response_time
                    })
                    return False
                
                # Validate analysis structure
                analysis = result.get("analysis", {})
                required_analysis_fields = ["detailedBreakdown", "healingPath", "triggers", "copingTechniques"]
                missing_analysis_fields = [field for field in required_analysis_fields if field not in analysis]
                
                if missing_analysis_fields:
                    print(f"❌ Missing analysis fields: {missing_analysis_fields}")
                    self.test_results.append({
                        "test": "Basic Quiz Analysis",
                        "status": "FAILED",
                        "error": f"Missing analysis fields: {missing_analysis_fields}",
                        "response_time": response_time
                    })
                    return False
                
                # Check attachment style value
                attachment_style = result.get("attachmentStyle")
                valid_styles = ["secure", "anxious", "avoidant", "fearful-avoidant"]
                
                if attachment_style not in valid_styles:
                    print(f"❌ Invalid attachment style: {attachment_style}")
                    self.test_results.append({
                        "test": "Basic Quiz Analysis",
                        "status": "FAILED",
                        "error": f"Invalid attachment style: {attachment_style}",
                        "response_time": response_time
                    })
                    return False
                
                # Check response time requirement (under 10 seconds)
                if response_time > 10:
                    print(f"⚠️  Response time ({response_time:.2f}s) exceeds 10 second requirement")
                    self.test_results.append({
                        "test": "Basic Quiz Analysis",
                        "status": "WARNING",
                        "error": f"Response time {response_time:.2f}s > 10s requirement",
                        "response_time": response_time
                    })
                else:
                    print(f"✅ Response time within requirement ({response_time:.2f}s < 10s)")
                
                print(f"✅ Attachment Style: {attachment_style}")
                print(f"✅ Analysis structure validated")
                print(f"✅ Response: {json.dumps(result, indent=2)[:500]}...")
                
                self.test_results.append({
                    "test": "Basic Quiz Analysis",
                    "status": "PASSED",
                    "attachment_style": attachment_style,
                    "response_time": response_time,
                    "response_structure": "Valid"
                })
                return True
                
            else:
                print(f"❌ HTTP Error: {response.status_code}")
                print(f"❌ Response: {response.text}")
                self.test_results.append({
                    "test": "Basic Quiz Analysis",
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
                "test": "Basic Quiz Analysis",
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
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*60)
        print("🧪 QUIZ ANALYSIS TEST SUMMARY")
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
    """Run all quiz analysis tests"""
    print("🚀 Starting HeartLift Quiz Analysis Backend Tests")
    print(f"🔗 Backend URL: {BACKEND_URL}")
    print("-" * 60)
    
    tester = QuizAnalysisTest()
    
    # Run all tests
    tests = [
        tester.test_basic_quiz_analysis(),
        tester.test_response_structure_validation(),
        tester.test_performance_requirement(),
        tester.test_error_handling()
    ]
    
    results = await asyncio.gather(*tests, return_exceptions=True)
    
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