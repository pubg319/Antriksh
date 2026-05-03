import { useState, useEffect } from "react";
import { Button } from "./Button";
import { supabase } from "../lib/supabase";
import { CheckCircle2, XCircle, FileText, RefreshCw } from "lucide-react";

interface TestPlayerProps {
  testId: string;
  courseId: string;
  onComplete: () => void;
}

export function TestPlayer({ testId, courseId, onComplete }: TestPlayerProps) {
  const [test, setTest] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  
  // Results state
  const [result, setResult] = useState<{score: number, passed: boolean} | null>(null);
  const [previousAttempt, setPreviousAttempt] = useState<any>(null);

  useEffect(() => {
    fetchTestAndAttempts();
  }, [testId]);

  const fetchTestAndAttempts = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch test details
      const { data: testData } = await supabase
        .from("tests")
        .select("*")
        .eq("id", testId)
        .single();
      
      setTest(testData);

      // 2. Fetch questions and options
      const { data: qData } = await supabase
        .from("questions")
        .select("*, options(*)")
        .eq("test_id", testId)
        .order("position", { ascending: true });
        
      if (qData) {
        setQuestions(qData);
      }

      // 3. Check for previous attempts
      const { data: attemptData } = await supabase
        .from("test_attempts")
        .select("*")
        .eq("test_id", testId)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (attemptData) {
        setPreviousAttempt(attemptData);
        // If they already passed, maybe show results immediately? Let's let them retake it if they want.
      }
    } catch (error) {
      console.error("Error fetching test data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (questionId: string, optionId: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionId
    }));
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      if (!confirm("You haven't answered all questions. Submit anyway?")) {
        return;
      }
    }

    setSubmitting(true);
    try {
      let correctAnswers = 0;
      
      // Client-side grading logic
      questions.forEach(q => {
        const selectedOptionId = answers[q.id];
        const correctOption = q.options.find((o: any) => o.is_correct);
        
        if (selectedOptionId === correctOption?.id) {
          correctAnswers++;
        }
      });

      const scorePercentage = Math.round((correctAnswers / questions.length) * 100);
      const passed = scorePercentage >= (test?.passing_score || 80);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("test_attempts").insert({
          test_id: testId,
          user_id: user.id,
          score: scorePercentage,
          passed: passed
        });
      }

      setResult({ score: scorePercentage, passed });
      
      if (passed) {
        onComplete();
      }
    } catch (error) {
      console.error("Error submitting test", error);
      alert("Failed to submit test. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetake = () => {
    setAnswers({});
    setResult(null);
  };

  if (loading) {
    return <div className="flex-1 flex items-center justify-center text-muted-foreground p-12">Loading Test...</div>;
  }

  if (result) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-background overflow-y-auto">
        <div className="max-w-md w-full bg-white rounded-2xl border border-border p-8 text-center shadow-lg">
          {result.passed ? (
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
          ) : (
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
          )}
          
          <h2 className="text-2xl font-bold mb-2">
            {result.passed ? "Congratulations!" : "Keep Trying!"}
          </h2>
          <p className="text-muted-foreground mb-6">
            You scored {result.score}% (Passing score: {test?.passing_score}%)
          </p>

          <div className="space-y-3">
            <Button className="w-full" onClick={onComplete}>
              Continue Course
            </Button>
            {!result.passed && (
              <Button variant="outline" className="w-full" onClick={handleRetake}>
                <RefreshCw className="w-4 h-4 mr-2" /> Retake Test
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden relative">
      {/* Test Header */}
      <div className="bg-white border-b border-border p-6 flex-shrink-0 z-10 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-orange-500 text-sm font-bold uppercase tracking-wider mb-1">
              <FileText className="w-4 h-4" />
              Module Assessment
            </div>
            <h1 className="text-2xl font-bold">{test?.title}</h1>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Passing Score</div>
            <div className="text-xl font-bold text-foreground">{test?.passing_score}%</div>
          </div>
        </div>
      </div>

      {/* Test Content */}
      <div className="flex-1 overflow-y-auto p-6 md:p-12">
        <div className="max-w-3xl mx-auto space-y-8">
          {test?.description && (
            <div className="text-muted-foreground text-lg mb-8 leading-relaxed">
              {test.description}
            </div>
          )}

          {questions.map((q, index) => (
            <div key={q.id} className="bg-white border border-border rounded-2xl p-6 md:p-8 shadow-sm">
              <h3 className="text-lg font-bold mb-6">
                <span className="text-muted-foreground mr-2">{index + 1}.</span> 
                {q.question_text}
              </h3>
              
              <div className="space-y-3">
                {q.options.map((opt: any) => {
                  const isSelected = answers[q.id] === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleOptionSelect(q.id, opt.id)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                        isSelected 
                          ? 'border-[#5B47ED] bg-[#5B47ED]/5 shadow-sm' 
                          : 'border-transparent bg-accent/30 hover:bg-accent/60'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          isSelected ? 'border-[#5B47ED]' : 'border-muted-foreground/30'
                        }`}>
                          {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#5B47ED]" />}
                        </div>
                        <span className={`font-medium ${isSelected ? 'text-[#5B47ED]' : 'text-foreground/80'}`}>
                          {opt.option_text}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="pt-8 pb-12 flex items-center justify-between">
            <div className="text-sm font-bold text-muted-foreground">
              {Object.keys(answers).length} of {questions.length} answered
            </div>
            <Button 
              size="lg" 
              onClick={handleSubmit} 
              disabled={submitting || questions.length === 0}
              className="px-12 shadow-lg shadow-[#5B47ED]/20"
            >
              {submitting ? "Submitting..." : "Submit Test"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
