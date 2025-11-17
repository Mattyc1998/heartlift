import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Heart, Users, Shield, Lightbulb, Calendar, BookOpen, Target, Loader2, Clock, CheckCircle, Brain } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
}

interface AttachmentStyle {
  name: string;
  description: string;
  characteristics: string[];
  icon: any;
  color: string;
}

interface Analysis {
  detailedBreakdown: {
    strengths: string[];
    challenges: string[];
    relationshipPatterns: string[];
  };
  healingPath: string;
  triggers: string[];
  copingTechniques: Array<{
    technique: string;
    description: string;
    example: string;
  }>;
}

const attachmentStyles: Record<string, AttachmentStyle> = {
  secure: {
    name: "Secure Attached",
    description: "You have a positive view of yourself and others. You're comfortable with intimacy while maintaining healthy independence.",
    characteristics: [
      "Comfortable with emotional intimacy",
      "Excellent communication skills",
      "Able to express needs clearly",
      "Trusting and reliable in relationships"
    ],
    icon: Heart,
    color: "bg-green-500"
  },
  anxious: {
    name: "Anxious-Preoccupied",
    description: "You deeply value connection and may worry about relationship security. You're emotionally expressive and seek reassurance.",
    characteristics: [
      "Highly attuned to partner's emotions",
      "Seeks frequent reassurance",
      "Fear of abandonment present",
      "Deeply committed when in love"
    ],
    icon: Users,
    color: "bg-yellow-500"
  },
  avoidant: {
    name: "Dismissive-Avoidant",
    description: "You highly value independence and self-reliance. You prefer emotional distance and may find intimacy uncomfortable.",
    characteristics: [
      "Values independence highly",
      "Uncomfortable with vulnerability",
      "Self-sufficient approach to life",
      "Prefers to handle emotions alone"
    ],
    icon: Shield,
    color: "bg-blue-500"
  },
  "compassionate-connector": {
    name: "Compassionate Connector",
    description: "You're securely attached with exceptional empathy. You naturally create safe spaces for emotional intimacy while respecting boundaries.",
    characteristics: [
      "Highly empathetic and intuitive",
      "Creates emotional safety for others",
      "Balances giving and receiving support",
      "Strong emotional intelligence"
    ],
    icon: Heart,
    color: "bg-pink-500"
  },
  "independent-secure": {
    name: "Independent Secure",
    description: "You're secure but particularly value autonomy. You enjoy relationships while maintaining strong sense of self and personal space.",
    characteristics: [
      "Comfortable in relationships and alone",
      "Strong sense of personal identity",
      "Respects partner's independence",
      "Confident in relationship security"
    ],
    icon: Target,
    color: "bg-teal-500"
  },
  "recovering-anxious": {
    name: "Evolving Secure",
    description: "You're actively healing anxious attachment patterns. You're developing confidence while maintaining your caring, attentive nature.",
    characteristics: [
      "Self-awareness of attachment patterns",
      "Working on self-soothing skills",
      "Building internal security",
      "Balancing needs with independence"
    ],
    icon: Lightbulb,
    color: "bg-orange-500"
  },
  "guarded-growing": {
    name: "Cautiously Opening",
    description: "You're moving from avoidant patterns toward security. You're learning to embrace vulnerability while honoring your need for space.",
    characteristics: [
      "Gradually opening to intimacy",
      "Recognizing value of connection",
      "Learning to trust others",
      "Balancing independence with closeness"
    ],
    icon: Shield,
    color: "bg-indigo-500"
  },
  "relationship-focused": {
    name: "Partnership-Oriented",
    description: "You thrive in committed relationships and prioritize partnership. You're deeply invested in creating strong, lasting bonds.",
    characteristics: [
      "Highly committed to relationships",
      "Naturally collaborative",
      "Values quality time together",
      "Strong relationship investment"
    ],
    icon: Users,
    color: "bg-rose-500"
  },
  "self-sufficient-secure": {
    name: "Contentedly Independent",
    description: "You're secure with a strong preference for solitude. You enjoy relationships but are equally fulfilled by your own company.",
    characteristics: [
      "Comfortable with long-term singlehood",
      "Rich internal life",
      "Selective about relationships",
      "Self-contained happiness"
    ],
    icon: Target,
    color: "bg-cyan-500"
  },
  "emotionally-aware": {
    name: "Emotionally Attuned",
    description: "You have exceptional emotional intelligence and self-awareness. You navigate relationships with insight and intentionality.",
    characteristics: [
      "Deep self-understanding",
      "Skilled at emotional regulation",
      "Insightful about relationship dynamics",
      "Intentional in communication"
    ],
    icon: Brain,
    color: "bg-purple-500"
  }
};

// Daily rotating questions - each day gets 7 questions
const questionSets = [
  // Day 1
  [
    {
      id: 1,
      question: "How do you typically feel when starting a new romantic relationship?",
      options: [
        "Excited and optimistic about the possibilities",
        "Nervous and worried about being hurt",
        "Cautious and prefer to keep some emotional distance",
        "Confused about what I want from the relationship"
      ]
    },
    {
      id: 2,
      question: "When your partner doesn't respond to your texts right away, you:",
      options: [
        "Assume they're busy and don't worry about it",
        "Start wondering if you said something wrong",
        "Feel relieved to have some space",
        "Feel confused and don't know what to think"
      ]
    },
    {
      id: 3,
      question: "How comfortable are you with emotional intimacy?",
      options: [
        "Very comfortable sharing and receiving emotions",
        "Want it badly but fear being too much",
        "Prefer to keep things light and not too deep",
        "It feels overwhelming and confusing"
      ]
    },
    {
      id: 4,
      question: "When someone gets too close emotionally, you tend to:",
      options: [
        "Welcome the closeness and feel secure",
        "Feel both excited and terrified at the same time",
        "Create distance to maintain your independence",
        "Feel unpredictable emotions that confuse you"
      ]
    },
    {
      id: 5,
      question: "Your past relationships have taught you that:",
      options: [
        "Love can be secure and lasting when both people commit",
        "People you love often leave or hurt you",
        "Getting too attached leads to disappointment",
        "Relationships are confusing and unpredictable"
      ]
    },
    {
      id: 6,
      question: "In conflicts with your partner, you tend to:",
      options: [
        "Work together to find a solution",
        "Worry excessively about the relationship ending",
        "Shut down or withdraw from the conversation",
        "Feel overwhelmed and react inconsistently"
      ]
    },
    {
      id: 7,
      question: "Your ideal relationship would be:",
      options: [
        "A balanced partnership with mutual support",
        "Very close and connected, almost inseparable",
        "Independent but committed, with plenty of personal space",
        "I'm not sure what I want in a relationship"
      ]
    }
  ],
  // Day 2
  [
    {
      id: 1,
      question: "How do you handle your partner needing space?",
      options: [
        "Respect their need and trust they'll return",
        "Feel anxious and worry about the relationship",
        "Feel relieved and enjoy the independence",
        "Feel confused about what it means"
      ]
    },
    {
      id: 2,
      question: "When you're upset, you prefer to:",
      options: [
        "Talk it through with your partner openly",
        "Seek immediate comfort and reassurance",
        "Process your feelings alone first",
        "Sometimes seek comfort, sometimes withdraw"
      ]
    },
    {
      id: 3,
      question: "Trust in relationships comes:",
      options: [
        "Naturally to me with the right person",
        "Hard - I want to trust but fear being disappointed",
        "Very slowly - I need to see consistent proof",
        "In waves - sometimes I trust, sometimes I don't"
      ]
    },
    {
      id: 4,
      question: "When you think about your childhood relationship with caregivers:",
      options: [
        "Generally felt secure and supported",
        "Often felt anxious about their approval or availability",
        "Learned to be self-reliant early on",
        "It was unpredictable or chaotic"
      ]
    },
    {
      id: 5,
      question: "Your approach to expressing needs in relationships:",
      options: [
        "Communicate them clearly and directly",
        "Worry about being too needy or demanding",
        "Prefer to handle things myself rather than ask",
        "Struggle to identify what I actually need"
      ]
    },
    {
      id: 6,
      question: "How do you typically respond to relationship uncertainty?",
      options: [
        "Stay calm and communicate about it",
        "Feel very anxious and seek constant reassurance",
        "Mentally prepare for the worst outcome",
        "Feel paralyzed and don't know how to react"
      ]
    },
    {
      id: 7,
      question: "When your partner is stressed or distant:",
      options: [
        "Give them support while respecting their process",
        "Assume it's about you and try to fix it immediately",
        "Give them space and focus on your own life",
        "Feel confused about how to respond appropriately"
      ]
    }
  ],
  // Day 3 (continues the daily rotation - one set per day)
  [
    {
      id: 1,
      question: "Your biggest fear in relationships is:",
      options: [
        "Growing apart due to lack of communication",
        "Being abandoned or rejected",
        "Losing your sense of self or independence",
        "Not knowing if the relationship is real or stable"
      ]
    },
    {
      id: 2,
      question: "When making important decisions, you:",
      options: [
        "Consider your partner's input while trusting your judgment",
        "Constantly seek reassurance from your partner",
        "Prefer to decide independently without outside influence",
        "Feel torn between different approaches and get paralyzed"
      ]
    },
    {
      id: 3,
      question: "Physical affection in relationships feels:",
      options: [
        "Natural and comforting",
        "Amazing but sometimes I crave more",
        "Nice but I need my personal space too",
        "Complicated - sometimes I want it, sometimes I don't"
      ]
    },
    {
      id: 4,
      question: "When your partner shares their problems with you:",
      options: [
        "Listen supportively and offer help if asked",
        "Feel anxious and responsible for fixing everything",
        "Listen but maintain some emotional distance",
        "Feel overwhelmed by their emotions"
      ]
    },
    {
      id: 5,
      question: "Your view of yourself in relationships is:",
      options: [
        "I'm a good partner who deserves love",
        "I need to work hard to be worthy of love",
        "I'm fine on my own and don't need anyone",
        "I'm unsure of my worth and role in relationships"
      ]
    },
    {
      id: 6,
      question: "When relationships end, you typically:",
      options: [
        "Grieve the loss but maintain hope for future love",
        "Feel devastated and struggle to imagine moving on",
        "Feel relief and focus on the benefits of being single",
        "Experience confusing mix of relief, sadness, and fear"
      ]
    },
    {
      id: 7,
      question: "Your communication style in relationships is:",
      options: [
        "Direct and honest while being considerate",
        "Sometimes too emotional or reactive",
        "Logical and measured, sometimes distant",
        "Inconsistent - varies with my mood and fears"
      ]
    }
  ]
];

const getDailyQuestions = (): { questions: QuizQuestion[], setNumber: number, nextChangeTime: Date } => {
  // Get days since epoch, this ensures consistent daily rotation
  const now = new Date();
  const daysSinceEpoch = Math.floor(now.getTime() / (1000 * 60 * 60 * 24));
  const setIndex = daysSinceEpoch % questionSets.length;
  
  // Calculate next change time (midnight tomorrow)
  const nextChange = new Date(now);
  nextChange.setDate(nextChange.getDate() + 1);
  nextChange.setHours(0, 0, 0, 0);
  
  return {
    questions: questionSets[setIndex],
    setNumber: setIndex + 1,
    nextChangeTime: nextChange
  };
};

export const AttachmentStyleQuiz = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [attachmentStyle, setAttachmentStyle] = useState<string>("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [pastResults, setPastResults] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedPastResult, setSelectedPastResult] = useState<any | null>(null);
  const [hasCompletedToday, setHasCompletedToday] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  const [questionsError, setQuestionsError] = useState<string | null>(null);
  
  // Remove the old daily questions logic since we're now using AI-generated questions
  const formatTimeUntilNextChange = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const msUntilChange = tomorrow.getTime() - now.getTime();
    const hoursUntil = Math.floor(msUntilChange / (1000 * 60 * 60));
    const minutesUntil = Math.floor((msUntilChange % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hoursUntil}h ${minutesUntil}m`;
  };

  useEffect(() => {
    if (user) {
      loadDailyQuestions();
      fetchPastResults();
      checkTodayCompletion();
    }
  }, [user]);

  const loadDailyQuestions = async () => {
    setIsLoadingQuestions(true);
    setQuestionsError(null);
    
    try {
      console.log('Loading daily AI-generated questions...');
      
      // Call the new AI backend endpoint
      const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
      const response = await fetch(`${backendUrl}/api/ai/quiz/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: 'attachment_style',
          num_questions: 10
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to generate quiz: ${response.statusText}`);
      }

      const data = await response.json();

      console.log('Backend response:', data);

      // The backend always returns questions (either AI or fallback)
      if (data && data.questions && Array.isArray(data.questions)) {
        setQuizQuestions(data.questions);
        console.log('Successfully loaded', data.questions.length, 'fresh AI-generated questions');
        return;
      }

      // Only throw error if we truly have no questions
      throw new Error('No questions available');
      
    } catch (error) {
      console.error('Failed to load quiz questions:', error);
      
      // Ultimate fallback - hardcoded questions in the frontend
      const hardcodedQuestions = [
        {
          id: 1,
          question: "How do you typically approach new relationships?",
          options: [
            "With excitement and openness to connection",
            "With hope but worry about being hurt",
            "With caution and preference for independence", 
            "With confusion about what I want"
          ]
        },
        {
          id: 2,
          question: "When conflict arises, you tend to:",
          options: [
            "Address issues directly and work toward resolution",
            "Become anxious and seek immediate reassurance",
            "Withdraw and avoid confrontation",
            "Feel overwhelmed and react unpredictably"
          ]
        },
        {
          id: 3,
          question: "Your emotional regulation involves:",
          options: [
            "Processing feelings and seeking appropriate support",
            "Becoming overwhelmed and needing constant comfort",
            "Shutting down emotions and handling things alone",
            "Experiencing intense, conflicting emotions"
          ]
        },
        {
          id: 4,
          question: "When someone gets close emotionally, you tend to:",
          options: [
            "Welcome the closeness and feel secure",
            "Feel both excited and terrified",
            "Create distance to maintain independence",
            "Feel unpredictable emotions"
          ]
        },
        {
          id: 5,
          question: "Your view of yourself in relationships is:",
          options: [
            "Confident and worthy of love",
            "Dependent on others' validation",
            "Self-reliant but emotionally distant",
            "Inconsistent and self-doubting"
          ]
        },
        {
          id: 6,
          question: "When your partner needs space, you:",
          options: [
            "Respect their need while maintaining connection",
            "Feel rejected and seek reassurance",
            "Feel relieved and prefer the distance",
            "Feel confused about how to respond"
          ]
        },
        {
          id: 7,
          question: "Trust in relationships comes:",
          options: [
            "Naturally with the right person",
            "Hard - you want to trust but fear disappointment",
            "Very slowly - you need consistent proof",
            "In waves - sometimes you trust, sometimes you don't"
          ]
        },
        {
          id: 8,
          question: "When you're upset, you prefer to:",
          options: [
            "Talk it through with your partner openly",
            "Seek immediate comfort and reassurance",
            "Process your feelings alone first",
            "Sometimes seek comfort, sometimes withdraw"
          ]
        },
        {
          id: 9,
          question: "Your biggest fear in relationships is:",
          options: [
            "Growing apart due to lack of communication",
            "Being abandoned or rejected",
            "Losing your sense of self",
            "Not knowing if the relationship is stable"
          ]
        },
        {
          id: 10,
          question: "Physical affection in relationships feels:",
          options: [
            "Natural and comforting",
            "Amazing but sometimes you crave more",
            "Nice but you need personal space too",
            "Complicated - sometimes you want it, sometimes you don't"
          ]
        }
      ];
      
      setQuizQuestions(hardcodedQuestions);
      console.log('Using hardcoded fallback questions');
      // Don't set error state - we have questions to show
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const checkTodayCompletion = async () => {
    if (!user) return;
    
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD format
    
    try {
      const { data, error } = await supabase
        .from('quiz_results')  // Fixed: use quiz_results table
        .select('id, completed_at')
        .eq('user_id', user.id)
        .gte('completed_at', `${today}T00:00:00`)
        .lte('completed_at', `${today}T23:59:59`)
        .limit(1);

      if (error) throw error;
      setHasCompletedToday(data && data.length > 0);
    } catch (error) {
      console.error('Error checking today completion:', error);
      // Don't block if there's an error - let them take the quiz
      setHasCompletedToday(false);
    }
  };

  const fetchPastResults = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('quiz_results')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setPastResults(data || []);
    } catch (error) {
      console.error('Error fetching past results:', error);
    }
  };

  const viewPastResult = (result: any) => {
    setSelectedPastResult(result);
    setAttachmentStyle(result.attachment_style);
    setAnalysis(result.analysis);
    setShowResults(true);
    setShowHistory(false);
  };

  const handleAnswer = () => {
    if (selectedAnswer) {
      const newAnswers = [...answers, parseInt(selectedAnswer)];
      setAnswers(newAnswers);
      setSelectedAnswer("");
      
      if (currentQuestion < quizQuestions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
      } else {
        analyseResults(newAnswers);
      }
    }
  };

  const analyseResults = async (finalAnswers: number[]) => {
    setIsAnalyzing(true);
    
    try {
      // Convert answers to text for analysis with their questions
      const questionsAndAnswers = finalAnswers.map((answerIndex, questionIndex) => ({
        question: quizQuestions[questionIndex].question,
        answer: quizQuestions[questionIndex].options[answerIndex]
      }));

      // Call new AI backend endpoint for analysis
      const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
      const response = await fetch(`${backendUrl}/api/ai/quiz/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questions_and_answers: questionsAndAnswers,
          user_id: user?.id
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to analyze quiz: ${response.statusText}`);
      }

      const data = await response.json();

      setAttachmentStyle(data.attachmentStyle);
      setAnalysis(data.analysis);
      setShowResults(true);
      setHasCompletedToday(true);
      
      // Save result to database
      if (user?.id) {
        try {
          const { error: saveError } = await supabase
            .from('quiz_results')
            .insert({
              user_id: user.id,
              attachment_style: data.attachmentStyle,
              analysis: data.analysis,
              questions_and_answers: questionsAndAnswers,
              completed_at: new Date().toISOString()
            });
          
          if (saveError) {
            console.error('Error saving quiz result:', saveError);
          } else {
            fetchPastResults(); // Refresh past results
          }
        } catch (saveError) {
          console.error('Error saving to database:', saveError);
        }
      }

      toast({
        title: "Analysis Complete!",
        description: "Your personalised attachment style report is ready.",
      });

    } catch (error) {
      console.error('Analysis error:', error);
      // Fallback to simple calculation
      const styleScores: Record<string, number> = {
        secure: 0,
        anxious: 0,
        avoidant: 0,
        'compassionate-connector': 0,
        'independent-secure': 0,
        'recovering-anxious': 0,
        'guarded-growing': 0,
        'relationship-focused': 0,
        'self-sufficient-secure': 0,
        'emotionally-aware': 0
      };
      
      // Enhanced scoring based on answer patterns with 10 outcomes
      finalAnswers.forEach((answerIndex, questionIndex) => {
        const answer = quizQuestions[questionIndex].options[answerIndex].toLowerCase();
        
        // Secure patterns
        if (answer.includes('comfortable') && answer.includes('express')) styleScores.secure += 2;
        if (answer.includes('trust') && answer.includes('open')) styleScores.secure++;
        
        // Anxious patterns
        if (answer.includes('worry') || answer.includes('anxious')) styleScores.anxious += 2;
        if (answer.includes('reassurance') || answer.includes('fear') && answer.includes('abandon')) styleScores.anxious++;
        
        // Avoidant patterns
        if (answer.includes('independent') || answer.includes('self-reliant')) styleScores.avoidant += 2;
        if (answer.includes('distance') || answer.includes('space')) styleScores.avoidant++;
        
        // Compassionate connector
        if (answer.includes('support') && answer.includes('understand')) styleScores['compassionate-connector']++;
        if (answer.includes('empathy') || answer.includes('listen')) styleScores['compassionate-connector']++;
        
        // Independent secure
        if (answer.includes('balance') || (answer.includes('independent') && answer.includes('comfortable'))) {
          styleScores['independent-secure']++;
        }
        
        // Recovering anxious
        if (answer.includes('working on') || answer.includes('trying to')) styleScores['recovering-anxious']++;
        
        // Guarded growing
        if (answer.includes('gradually') || answer.includes('learning to')) styleScores['guarded-growing']++;
        
        // Relationship-focused
        if (answer.includes('partner') && answer.includes('together')) styleScores['relationship-focused']++;
        if (answer.includes('committed') || answer.includes('quality time')) styleScores['relationship-focused']++;
        
        // Self-sufficient secure
        if (answer.includes('alone') && answer.includes('content')) styleScores['self-sufficient-secure']++;
        
        // Emotionally aware
        if (answer.includes('aware') || answer.includes('reflect')) styleScores['emotionally-aware']++;
      });
      
      // Find highest scoring style
      const dominantStyle = Object.entries(styleScores).reduce((a, b) => 
        styleScores[a[0]] > styleScores[b[0]] ? a : b
      )[0];
      
      setAttachmentStyle(dominantStyle);
      setShowResults(true);
      setHasCompletedToday(true);

      // Save a minimal result so it appears in history
      if (user?.id) {
        try {
          await supabase
            .from('user_attachment_results')
            .insert({
              user_id: user.id,
              attachment_style: dominantStyle,
              quiz_date: new Date().toISOString().slice(0, 10)
            });
          await fetchPastResults();
        } catch (saveErr) {
          console.error('Failed to save fallback result:', saveErr);
        }
      }
      
      toast({
        title: "Here are your results!",
        description: "Your attachment style analysis is complete.",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setAnswers([]);
    setShowResults(false);
    setSelectedAnswer("");
    setAttachmentStyle("");
    setAnalysis(null);
    setSelectedPastResult(null);
    loadDailyQuestions(); // Reload questions when resetting
  };

  const formatTimeUntilNext = (nextTime: Date): string => {
    const now = new Date();
    const diff = nextTime.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Show loading state while fetching questions
  if (isLoadingQuestions) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
            <CardTitle className="text-2xl">Loading Today's Questions...</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">
              AI is generating fresh attachment style questions for you.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Skip error display - we always have questions to show

  // Show completion status if user has completed today's quiz
  if (hasCompletedToday && !showResults) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-green-100">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl">Daily Quiz Completed!</CardTitle>
            <div className="flex items-center justify-center gap-4 mt-4">
              <Badge variant="outline" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                AI-Generated Questions
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Next: {formatTimeUntilNextChange()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-muted-foreground">
              You've completed today's attachment style quiz. Check back tomorrow for new questions!
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => setShowHistory(true)} variant="outline">
                View Past Results
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Show history modal */}
        {showHistory && (
          <Card>
            <CardHeader>
              <CardTitle>Your Quiz History</CardTitle>
            </CardHeader>
            <CardContent>
              {pastResults.length > 0 ? (
                <div className="space-y-4">
                  {pastResults.map((result, index) => (
                    <button 
                      key={result.id} 
                      onClick={() => viewPastResult(result)}
                      className="w-full flex justify-between items-center p-3 border rounded-lg hover:bg-accent transition-colors cursor-pointer text-left"
                    >
                      <div>
                        <p className="font-medium capitalize">{result.attachment_style?.replace(/-/g, ' ')}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(result.completed_at).toLocaleDateString()} at {new Date(result.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <Badge variant="outline" className="capitalize">{result.attachment_style?.replace(/-/g, ' ')}</Badge>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No past results available.</p>
              )}
              <Button 
                onClick={() => setShowHistory(false)} 
                variant="outline" 
                className="mt-4 w-full"
              >
                Close
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  if (isAnalyzing) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mb-4" />
          <h3 className="text-lg font-semibold mb-2">Analyzing Your Responses</h3>
          <p className="text-muted-foreground text-center">
            Our AI is creating your personalised attachment style report...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (showResults && attachmentStyle) {
    const style = attachmentStyles[attachmentStyle];
    if (!style) {
      console.error('Unknown attachment style:', attachmentStyle);
      return (
        <Card className="max-w-2xl mx-auto">
          <CardContent className="text-center py-8">
            <p className="text-destructive">Unable to display results. Please try again.</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Reload Page
            </Button>
          </CardContent>
        </Card>
      );
    }
    const IconComponent = style.icon;
    
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Main Results Card */}
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className={`p-4 rounded-full ${style.color}`}>
                <IconComponent className="w-8 h-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl">
              {selectedPastResult ? 'Past Quiz Result' : 'Your Attachment Style'}
            </CardTitle>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {style.name}
            </Badge>
            <div className="flex items-center justify-center gap-4 mt-4">
              {selectedPastResult ? (
                <Badge variant="outline" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {new Date(selectedPastResult.completed_at).toLocaleDateString()} at {new Date(selectedPastResult.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Badge>
              ) : (
                <>
                  <Badge variant="outline" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    AI-Generated Quiz
                  </Badge>
                  <Badge variant="secondary" className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Next: {formatTimeUntilNextChange()}
                  </Badge>
                </>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground text-center">{style.description}</p>
            
            {/* Core Characteristics */}
            <div>
              <h4 className="font-medium mb-3">Key Characteristics</h4>
              <div className="grid md:grid-cols-2 gap-2">
                {style.characteristics.map((char, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                    {char}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <Button onClick={() => setShowHistory(true)} variant="outline">
                View History
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Results with AI Analysis */}
        {analysis && (
          <>
            {/* Detailed Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🔍 Full Breakdown of Your Style
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="font-medium mb-2 text-green-700">Strengths</h4>
                    <ul className="space-y-1">
                      {analysis.detailedBreakdown.strengths.map((strength, index) => (
                        <li key={index} className="text-sm text-muted-foreground">• {strength}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2 text-orange-700">Challenges</h4>
                    <ul className="space-y-1">
                      {analysis.detailedBreakdown.challenges.map((challenge, index) => (
                        <li key={index} className="text-sm text-muted-foreground">• {challenge}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2 text-blue-700">Relationship Patterns</h4>
                    <ul className="space-y-1">
                      {analysis.detailedBreakdown.relationshipPatterns.map((pattern, index) => (
                        <li key={index} className="text-sm text-muted-foreground">• {pattern}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Triggers and Coping */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    ⚡ Common Triggers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.triggers.map((trigger, index) => (
                      <li key={index} className="text-sm">• {trigger}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    🛠️ Coping Techniques
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysis.copingTechniques.map((technique, index) => (
                      <div key={index} className="border-l-2 border-primary pl-3">
                        <h5 className="font-medium text-sm">{technique.technique}</h5>
                        <p className="text-xs text-muted-foreground mb-1">{technique.description}</p>
                        <p className="text-xs italic">Example: {technique.example}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Healing Path */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🌱 Your Personalised Healing Path
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{analysis.healingPath}</p>
              </CardContent>
            </Card>
          </>
        )}

        {/* Action buttons */}
        {showResults && (
          <div className="flex gap-3 justify-center mt-6">
            {selectedPastResult ? (
              <Button onClick={() => {
                setShowHistory(true);
                setShowResults(false);
                setSelectedPastResult(null);
              }} variant="outline">
                Back to History
              </Button>
            ) : (
              <Button onClick={() => setShowHistory(true)} variant="outline">
                View Past Results
              </Button>
            )}
          </div>
        )}

        {/* Show history modal */}
        {showHistory && (
          <Card>
            <CardHeader>
              <CardTitle>Your Quiz History</CardTitle>
            </CardHeader>
            <CardContent>
              {pastResults.length > 0 ? (
                <div className="space-y-4">
                  {pastResults.map((result, index) => (
                    <button 
                      key={result.id} 
                      onClick={() => viewPastResult(result)}
                      className="w-full flex justify-between items-center p-3 border rounded-lg hover:bg-accent transition-colors cursor-pointer text-left"
                    >
                      <div>
                        <p className="font-medium capitalize">{result.attachment_style?.replace(/-/g, ' ')}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(result.completed_at).toLocaleDateString()} at {new Date(result.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <Badge variant="outline" className="capitalize">{result.attachment_style?.replace(/-/g, ' ')}</Badge>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No past results available.</p>
              )}
              <Button 
                onClick={() => setShowHistory(false)} 
                variant="outline" 
                className="mt-4 w-full"
              >
                Close
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Show the quiz
  // Don't render quiz if no questions loaded
  if (!quizQuestions || quizQuestions.length === 0) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">No Questions Available</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Unable to load quiz questions. Please try refreshing the page.
            </p>
            <Button onClick={loadDailyQuestions} variant="outline">
              Reload Questions
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-2xl mx-auto px-4 sm:px-0">
      {/* Quiz Header */}
      <Card>
        <CardHeader className="text-center p-4 sm:p-6">
          <CardTitle className="flex items-center justify-center gap-2 text-lg sm:text-xl">
            <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            Daily Attachment Style Quiz
          </CardTitle>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 mt-3 sm:mt-4">
            <Badge variant="outline" className="flex items-center gap-2 text-xs sm:text-sm">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
              AI-Generated Questions
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-2 text-xs sm:text-sm">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
              New questions in {formatTimeUntilNextChange()}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            AI generates fresh questions daily to provide deeper insights into your attachment patterns
          </p>
          <div className="mt-3 flex justify-center">
            <Button variant="ghost" onClick={() => setShowHistory(true)} size="sm">
              View Past Results
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Quiz Progress */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex justify-between items-center">
            <span className="text-xs sm:text-sm text-muted-foreground">
              Question {currentQuestion + 1} of {quizQuestions.length}
            </span>
            <Badge variant="outline" className="text-xs sm:text-sm">
              {Math.round(((currentQuestion + 1) / quizQuestions.length) * 100)}%
            </Badge>
          </div>
          <Progress value={((currentQuestion + 1) / quizQuestions.length) * 100} className="mt-2" />
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0">
          <div>
            <h3 className="text-lg sm:text-xl font-semibold mb-4 leading-tight">
              {quizQuestions[currentQuestion].question}
            </h3>
            
            <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer} className="space-y-3 sm:space-y-2">
              {quizQuestions[currentQuestion].options.map((option, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                  <RadioGroupItem 
                    value={index.toString()} 
                    id={`option-${index}`} 
                    className="mt-0.5 flex-shrink-0"
                  />
                  <Label 
                    htmlFor={`option-${index}`} 
                    className="flex-1 cursor-pointer text-sm sm:text-base leading-relaxed"
                  >
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          
          <Button 
            onClick={handleAnswer} 
            disabled={!selectedAnswer}
            className="w-full py-3 text-base font-medium"
            size="lg"
          >
            {currentQuestion < quizQuestions.length - 1 ? 'Next Question' : 'Complete Quiz'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};