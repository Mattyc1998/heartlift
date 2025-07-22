import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Heart, Users, Shield, Lightbulb, Calendar, BookOpen, Target, Loader2 } from "lucide-react";
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
    name: "Secure",
    description: "You have a positive view of both yourself and others. You're comfortable with intimacy and independence.",
    characteristics: [
      "Comfortable with emotional intimacy",
      "Good communication skills",
      "Able to express needs clearly",
      "Trusting in relationships"
    ],
    icon: Heart,
    color: "bg-green-500"
  },
  anxious: {
    name: "Anxious-Preoccupied",
    description: "You have a negative view of yourself but positive view of others. You crave closeness but fear abandonment.",
    characteristics: [
      "Fear of abandonment",
      "Seeks constant reassurance",
      "Highly emotional in relationships",
      "Tendency to be clingy"
    ],
    icon: Users,
    color: "bg-yellow-500"
  },
  avoidant: {
    name: "Dismissive-Avoidant",
    description: "You have a positive view of yourself but negative view of others. You value independence over intimacy.",
    characteristics: [
      "Values independence highly",
      "Uncomfortable with emotional intimacy",
      "Tends to suppress emotions",
      "Difficulty depending on others"
    ],
    icon: Shield,
    color: "bg-blue-500"
  },
  disorganized: {
    name: "Fearful-Avoidant",
    description: "You have negative views of both yourself and others. You want close relationships but fear getting hurt.",
    characteristics: [
      "Conflicted about relationships",
      "Fear of intimacy and abandonment",
      "Unpredictable emotional responses",
      "Past trauma or inconsistent caregiving"
    ],
    icon: Lightbulb,
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

const getDailyQuestions = (): QuizQuestion[] => {
  // Get days since epoch, this ensures consistent daily rotation
  const daysSinceEpoch = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  const setIndex = daysSinceEpoch % questionSets.length;
  return questionSets[setIndex];
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
  
  const quizQuestions = getDailyQuestions();

  useEffect(() => {
    fetchPastResults();
  }, [user]);

  const fetchPastResults = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_attachment_results')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setPastResults(data || []);
    } catch (error) {
      console.error('Error fetching past results:', error);
    }
  };

  const handleAnswer = () => {
    if (selectedAnswer) {
      const newAnswers = [...answers, parseInt(selectedAnswer)];
      setAnswers(newAnswers);
      setSelectedAnswer("");
      
      if (currentQuestion < quizQuestions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
      } else {
        analyzeResults(newAnswers);
      }
    }
  };

  const analyzeResults = async (finalAnswers: number[]) => {
    setIsAnalyzing(true);
    
    try {
      // Convert answers to text for analysis
      const answerTexts = finalAnswers.map((answerIndex, questionIndex) => 
        quizQuestions[questionIndex].options[answerIndex]
      );

      const { data, error } = await supabase.functions.invoke('analyze-attachment-style', {
        body: {
          answers: answerTexts,
          userId: user?.id,
        },
      });

      if (error) throw error;

      setAttachmentStyle(data.attachmentStyle);
      setAnalysis(data.analysis);
      setShowResults(true);
      fetchPastResults(); // Refresh past results

      toast({
        title: "Analysis Complete!",
        description: "Your personalized attachment style report is ready.",
      });

    } catch (error) {
      console.error('Analysis error:', error);
      // Fallback to simple calculation
      const styleKeys = ['secure', 'anxious', 'avoidant', 'disorganized'];
      const scores = [0, 0, 0, 0];
      finalAnswers.forEach(answer => scores[answer]++);
      const dominantStyle = styleKeys[scores.indexOf(Math.max(...scores))];
      
      setAttachmentStyle(dominantStyle);
      setShowResults(true);
      
      toast({
        title: "Quiz Complete",
        description: "Basic results available. Full analysis requires internet connection.",
        variant: "destructive",
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
  };

  if (isAnalyzing) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mb-4" />
          <h3 className="text-lg font-semibold mb-2">Analyzing Your Responses</h3>
          <p className="text-muted-foreground text-center">
            Our AI is creating your personalized attachment style report...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (showResults && attachmentStyle) {
    const style = attachmentStyles[attachmentStyle];
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
            <CardTitle className="text-2xl">Your Attachment Style</CardTitle>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {style.name}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground text-center">{style.description}</p>
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

            {/* Healing Path */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📖 Your Personalized Healing Path
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{analysis.healingPath}</p>
              </CardContent>
            </Card>

            {/* Triggers & Coping */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    🎯 Triggers to Watch For
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.triggers.map((trigger, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{trigger}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    🛠 Coping Techniques
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysis.copingTechniques.map((technique, index) => (
                      <div key={index} className="border rounded p-3">
                        <h5 className="font-medium text-sm mb-1">{technique.technique}</h5>
                        <p className="text-xs text-muted-foreground mb-1">{technique.description}</p>
                        <p className="text-xs italic text-primary">Example: {technique.example}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Basic characteristics for fallback */}
        {!analysis && (
          <Card>
            <CardHeader>
              <CardTitle>Key Characteristics</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {style.characteristics.map((characteristic, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <span className="text-sm">{characteristic}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Past Results & Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={resetQuiz} variant="outline" className="flex-1">
            <Target className="w-4 h-4 mr-2" />
            Take Today's Quiz Again (5 Questions)
          </Button>
          <Button 
            onClick={() => setShowHistory(!showHistory)} 
            variant="outline" 
            className="flex-1"
          >
            <Calendar className="w-4 h-4 mr-2" />
            View Past Results ({pastResults.length})
          </Button>
        </div>

        {/* Past Results History */}
        {showHistory && pastResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Your Attachment Style History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pastResults.map((result, index) => (
                  <div key={result.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{result.attachment_style}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(result.quiz_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <CardTitle>Daily Attachment Style Quiz</CardTitle>
          <Badge variant="outline">Today's Questions</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Progress value={((currentQuestion + 1) / quizQuestions.length) * 100} className="flex-1" />
          <span className="text-sm text-muted-foreground">
            {currentQuestion + 1} of {quizQuestions.length}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="font-semibold mb-4">{quizQuestions[currentQuestion].question}</h3>
          <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer}>
            {quizQuestions[currentQuestion].options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`} className="text-sm cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="flex justify-center">
          <Button 
            onClick={handleAnswer} 
            disabled={!selectedAnswer}
            className="min-w-24"
          >
            {currentQuestion < quizQuestions.length - 1 ? "Next" : "Get AI Analysis"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};