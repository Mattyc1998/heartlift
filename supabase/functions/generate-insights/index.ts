import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// CORS configuration
const getAllowedOrigin = (requestOrigin: string | null): string => {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://yourdomain.com',
  ];
  
  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    return requestOrigin;
  }
  return allowedOrigins[0];
};

const getCorsHeaders = (origin: string) => ({
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Credentials': 'true',
});

serve(async (req) => {
  const origin = req.headers.get('origin') || '';
  const corsHeaders = getCorsHeaders(origin);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();

    // Input validation
    if (!userId || typeof userId !== 'string' || !userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      throw new Error('VALIDATION_ERROR');
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Generating insights for user:', userId);

    // Get user's conversation history (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: conversations, error: convError } = await supabase
      .from('conversation_history')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(50);

    if (convError) {
      console.error('Error fetching conversations:', convError);
      throw convError;
    }

    // Get user's mood entries (last 30 days)
    const { data: moodEntries, error: moodError } = await supabase
      .from('mood_entries')
      .select('*')
      .eq('user_id', userId)
      .gte('entry_date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('entry_date', { ascending: false })
      .limit(30);

    if (moodError) {
      console.error('Error fetching mood entries:', moodError);
    }

    // Get user's latest attachment style
    const { data: attachmentData, error: attachmentError } = await supabase
      .from('user_attachment_results')
      .select('attachment_style, detailed_breakdown, triggers, coping_techniques')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (attachmentError) {
      console.error('Error fetching attachment data:', attachmentError);
    }

    // Prepare data for AI analysis
    const conversationSummary = conversations?.map(conv => ({
      coach: conv.coach_id,
      sender: conv.sender,
      content: conv.message_content.substring(0, 500), // Limit message length
      date: conv.created_at
    })) || [];

    const moodSummary = moodEntries?.map(mood => ({
      date: mood.entry_date,
      level: mood.mood_level,
      label: mood.mood_label,
      emoji: mood.mood_emoji
    })) || [];

    const attachmentStyle = attachmentData?.[0]?.attachment_style || 'Unknown';
    const attachmentDetails = attachmentData?.[0] || null;

    console.log('Data summary:', {
      conversationCount: conversationSummary.length,
      moodEntryCount: moodSummary.length,
      attachmentStyle
    });

    // Generate AI insights using OpenAI
    const prompt = `
    As a relationship and emotional wellness expert, analyze the following user data and provide comprehensive insights:

    ATTACHMENT STYLE: ${attachmentStyle}
    ATTACHMENT DETAILS: ${JSON.stringify(attachmentDetails)}

    RECENT CONVERSATIONS (${conversationSummary.length} messages):
    ${JSON.stringify(conversationSummary, null, 2)}

    MOOD TRACKING DATA (${moodSummary.length} entries):
    ${JSON.stringify(moodSummary, null, 2)}

    Please provide a comprehensive analysis in the following JSON format:
    {
      "emotionalPatterns": ["pattern1", "pattern2", "pattern3"],
      "communicationStyle": "description of their communication patterns",
      "relationshipGoals": ["goal1", "goal2", "goal3"],
      "healingProgressScore": 75,
      "keyInsights": {
        "strengths": ["strength1", "strength2"],
        "areasForGrowth": ["area1", "area2"],
        "progressSigns": ["sign1", "sign2"]
      },
      "personalizedRecommendations": [
        {
          "category": "Communication",
          "recommendation": "specific actionable advice",
          "why": "explanation of why this helps"
        },
        {
          "category": "Emotional Regulation", 
          "recommendation": "specific actionable advice",
          "why": "explanation of why this helps"
        },
        {
          "category": "Relationship Building",
          "recommendation": "specific actionable advice", 
          "why": "explanation of why this helps"
        }
      ],
      "moodTrends": {
        "pattern": "description of mood patterns",
        "triggers": ["trigger1", "trigger2"],
        "improvements": ["improvement1", "improvement2"]
      },
      "nextSteps": ["step1", "step2", "step3"]
    }

    Base your analysis on actual patterns in the data. Be specific, actionable, and encouraging while being honest about areas for growth.
    `;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert relationship and emotional wellness analyst. Provide detailed, actionable insights based on user data. Always respond with valid JSON only.' 
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    const aiResponse = await response.json();
    console.log('OpenAI response status:', response.status);
    
    if (!response.ok) {
      console.error('OpenAI error:', aiResponse);
      
      // Handle quota exceeded specifically
      if (response.status === 429) {
        console.log('OpenAI quota exceeded, providing fallback insights');
        const analysisEnd = new Date();
        const analysisStart = thirtyDaysAgo;
        return await generateFallbackInsights(
          supabase, 
          userId, 
          JSON.stringify(conversationSummary), 
          JSON.stringify(moodSummary), 
          attachmentStyle, 
          JSON.stringify(attachmentDetails), 
          analysisStart, 
          analysisEnd
        );
      }
      
      throw new Error(`OpenAI API error: ${aiResponse.error?.message || 'Unknown error'}`);
    }

    const aiContent = aiResponse.choices[0].message.content;
    let insights;
    
    try {
      insights = JSON.parse(aiContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiContent);
      throw new Error('Failed to parse AI response as JSON');
    }

    // Calculate analysis period
    const analysisEnd = new Date();
    const analysisStart = thirtyDaysAgo;

    // Save insights to database
    const { data: savedInsight, error: saveError } = await supabase
      .from('user_insights_reports')
      .insert({
        user_id: userId,
        report_type: 'conversation_analysis',
        insights: insights,
        conversation_count: conversationSummary.length,
        mood_entries_analyzed: moodSummary.length,
        attachment_style: attachmentStyle,
        healing_progress_score: insights.healingProgressScore || 0,
        key_patterns: insights.emotionalPatterns || [],
        recommendations: insights.personalizedRecommendations || [],
        analysis_period_start: analysisStart.toISOString(),
        analysis_period_end: analysisEnd.toISOString()
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving insights:', saveError);
      throw saveError;
    }

    console.log('Insights generated and saved successfully');

    // Track premium feature usage
    await supabase.rpc('track_premium_feature_usage', {
      user_uuid: userId,
      feature_name: 'personalized_insights'
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        insights: insights,
        reportId: savedInsight.id,
        analysisDate: analysisEnd.toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[GENERATE-INSIGHTS-ERROR]', error); // Log server-side only
    
    const errorMessage = (error as Error).message || '';
    let statusCode = 500;
    let clientError = 'An error occurred generating insights.';
    
    if (errorMessage === 'VALIDATION_ERROR') {
      statusCode = 400;
      clientError = 'Invalid input provided.';
    } else if (errorMessage.includes('quota') || errorMessage.includes('429')) {
      statusCode = 503;
      clientError = 'AI service temporarily unavailable. Please try again later.';
    } else if (errorMessage.includes('auth')) {
      statusCode = 401;
      clientError = 'Authentication failed.';
    }
    
    return new Response(
      JSON.stringify({ error: clientError }),
      { status: statusCode, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Fallback insights function when OpenAI is unavailable
async function generateFallbackInsights(supabase: any, userId: string, conversationSummary: string, moodSummary: string, attachmentStyle: string, attachmentDetails: string, analysisStart: Date, analysisEnd: Date) {
  console.log('Generating fallback insights');
  
  // Generate basic insights based on available data
  const insights = {
    emotionalPatterns: [
      "Shows engagement in personal growth through coach conversations",
      "Demonstrates commitment to healing journey",
      "Active participation in mood tracking and self-reflection"
    ],
    communicationStyle: "Engaged and seeking guidance from coaches",
    relationshipGoals: [
      "Improving emotional well-being",
      "Building healthier relationship patterns",
      "Developing better self-awareness"
    ],
    healingProgressScore: Math.min(75, Math.max(25, (conversationSummary.length * 5) + (moodSummary.length * 3))),
    keyInsights: {
      strengths: [
        "Actively seeking help and guidance",
        "Committed to personal growth",
        "Willing to engage in self-reflection"
      ],
      areasForGrowth: [
        "Continue building emotional awareness",
        "Practice implementing coaching advice",
        "Maintain consistency in healing practices"
      ],
      progressSigns: [
        "Regular engagement with coaches",
        "Consistent mood tracking",
        "Growing self-awareness"
      ]
    },
    personalizedRecommendations: [
      {
        category: "Communication",
        recommendation: "Continue regular check-ins with coaches to maintain momentum",
        why: "Consistent guidance helps reinforce positive changes"
      },
      {
        category: "Emotional Regulation",
        recommendation: "Use daily mood tracking to identify patterns",
        why: "Awareness of emotional patterns is the first step to managing them"
      },
      {
        category: "Relationship Building",
        recommendation: "Practice applying insights from coach conversations in daily life",
        why: "Real-world application helps integrate new relationship skills"
      }
    ],
    moodTrends: {
      pattern: moodSummary.length > 0 ? "Regular mood tracking shows commitment to self-awareness" : "Consider starting regular mood tracking",
      triggers: ["Relationship challenges", "Personal growth moments"],
      improvements: ["Increased self-awareness", "Better emotional vocabulary"]
    },
    nextSteps: [
      "Continue regular coach conversations",
      "Implement one new insight from recent coaching sessions",
      "Maintain consistent mood tracking"
    ]
  };

  // Save fallback insights to database
  const { data: savedInsight, error: saveError } = await supabase
    .from('user_insights_reports')
    .insert({
      user_id: userId,
      report_type: 'conversation_analysis',
      insights: insights,
      conversation_count: conversationSummary.length,
      mood_entries_analyzed: moodSummary.length,
      attachment_style: attachmentStyle,
      healing_progress_score: insights.healingProgressScore,
      key_patterns: insights.emotionalPatterns,
      recommendations: insights.personalizedRecommendations,
      analysis_period_start: analysisStart.toISOString(),
      analysis_period_end: analysisEnd.toISOString()
    })
    .select()
    .single();

  if (saveError) {
    console.error('Error saving fallback insights:', saveError);
    throw saveError;
  }

  // Track premium feature usage
  await supabase.rpc('track_premium_feature_usage', {
    user_uuid: userId,
    feature_name: 'personalized_insights'
  });

  return new Response(
    JSON.stringify({ 
      success: true, 
      insights: insights,
      reportId: savedInsight.id,
      analysisDate: analysisEnd.toISOString(),
      fallback: true
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}