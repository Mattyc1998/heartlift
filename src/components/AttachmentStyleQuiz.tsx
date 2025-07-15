import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Heart, Users, Shield, Lightbulb } from "lucide-react";

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
    color: "text-green-600"
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
    color: "text-yellow-600"
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
    color: "text-blue-600"
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
    color: "text-purple-600"
  }
};

const quizQuestions: QuizQuestion[] = [
  {
    id: 1,
    question: "When my partner seems distant, I usually:",
    options: [
      "Give them space and trust they'll come to me when ready",
      "Worry that I've done something wrong and try to reconnect immediately", 
      "Feel relieved and use the time for myself",
      "Feel confused and don't know how to respond"
    ]
  },
  {
    id: 2,
    question: "In conflicts with my partner, I tend to:",
    options: [
      "Stay calm and work together to find a solution",
      "Get emotional and fear the relationship is ending",
      "Shut down or walk away from the discussion",
      "Feel overwhelmed and react unpredictably"
    ]
  },
  {
    id: 3,
    question: "When it comes to expressing my needs in relationships:",
    options: [
      "I communicate them clearly and directly",
      "I drop hints hoping my partner will notice",
      "I prefer to handle things myself",
      "I struggle to even identify what I need"
    ]
  },
  {
    id: 4,
    question: "My biggest fear in relationships is:",
    options: [
      "Normal relationship challenges that we can work through",
      "Being abandoned or rejected",
      "Losing my independence or being controlled",
      "Getting hurt again like I have in the past"
    ]
  },
  {
    id: 5,
    question: "When my partner expresses strong emotions, I:",
    options: [
      "Listen and provide support",
      "Feel responsible and try to fix everything",
      "Feel uncomfortable and want to change the subject",
      "Don't know how to respond appropriately"
    ]
  }
];

export const AttachmentStyleQuiz = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");

  const handleAnswer = () => {
    if (selectedAnswer) {
      const newAnswers = [...answers, parseInt(selectedAnswer)];
      setAnswers(newAnswers);
      setSelectedAnswer("");
      
      if (currentQuestion < quizQuestions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
      } else {
        setShowResults(true);
      }
    }
  };

  const calculateResult = () => {
    const scores = [0, 0, 0, 0]; // secure, anxious, avoidant, disorganized
    
    answers.forEach(answer => {
      scores[answer]++;
    });
    
    const maxScore = Math.max(...scores);
    const dominantStyle = scores.indexOf(maxScore);
    const styleKeys = ['secure', 'anxious', 'avoidant', 'disorganized'];
    
    return styleKeys[dominantStyle];
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setAnswers([]);
    setShowResults(false);
    setSelectedAnswer("");
  };

  if (showResults) {
    const resultStyle = calculateResult();
    const style = attachmentStyles[resultStyle];
    const IconComponent = style.icon;

    return (
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconComponent className={`w-5 h-5 ${style.color}`} />
            Attachment Style Quiz Results
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <Badge variant="secondary" className="text-lg px-4 py-2 mb-4">
              {style.name}
            </Badge>
            <p className="text-muted-foreground mb-6">{style.description}</p>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Key Characteristics:</h4>
            <ul className="space-y-2">
              {style.characteristics.map((characteristic, index) => (
                <li key={index} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span className="text-sm">{characteristic}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-secondary/20 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">💡 Growth Tips:</h4>
            <p className="text-sm text-muted-foreground">
              Understanding your attachment style is the first step towards healthier relationships. 
              Consider discussing these insights with a therapist or trusted friend to explore how 
              your attachment patterns might be influencing your current healing journey.
            </p>
          </div>

          <div className="flex justify-center">
            <Button onClick={resetQuiz} variant="outline">
              Take Quiz Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <CardTitle>Attachment Style Quiz</CardTitle>
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
            {currentQuestion < quizQuestions.length - 1 ? "Next" : "Get Results"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};