import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { DashboardLayout } from "../components/DashboardLayout";
import { Button } from "../components/Button";
import { supabase } from "../lib/supabase";
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Save,
  CheckCircle2,
  Circle,
  TrendingUp,
  BookOpen,
  Users,
  DollarSign
} from "lucide-react";

export function AdminTestBuilderPage() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const sidebarItems = [
    { path: "/admin", label: "Dashboard", icon: TrendingUp },
    { path: "/admin/courses", label: "Courses", icon: BookOpen },
    { path: "/admin/students", label: "Students", icon: Users },
    { path: "/admin/payments", label: "Payments", icon: DollarSign },
  ];

  useEffect(() => {
    fetchTestDetails();
  }, [testId]);

  const fetchTestDetails = async () => {
    if (!testId) return;
    setLoading(true);
    try {
      // Fetch test details
      const { data: testData } = await supabase
        .from("tests")
        .select("*, modules(course_id)")
        .eq("id", testId)
        .single();
      
      setTest(testData);

      // Fetch questions and their options
      const { data: questionsData } = await supabase
        .from("questions")
        .select("*, options(*)")
        .eq("test_id", testId)
        .order("position", { ascending: true });

      if (questionsData) {
        // Sort options by id or position if we add it, for now just as they come
        setQuestions(questionsData.map(q => ({
          ...q,
          // If a new question, it might not have options yet from DB, but we initialize with empty array
          options: q.options || []
        })));
      }
    } catch (error) {
      console.error("Error fetching test details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = () => {
    const newQuestion = {
      id: `temp-${Date.now()}`,
      test_id: testId,
      question_text: "",
      position: questions.length + 1,
      options: [
        { id: `temp-opt-${Date.now()}-1`, option_text: "", is_correct: true },
        { id: `temp-opt-${Date.now()}-2`, option_text: "", is_correct: false },
      ],
      isNew: true
    };
    setQuestions([...questions, newQuestion]);
  };

  const handleQuestionChange = (qId: string, text: string) => {
    setQuestions(questions.map(q => q.id === qId ? { ...q, question_text: text } : q));
  };

  const handleAddOption = (qId: string) => {
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        const newOption = {
          id: `temp-opt-${Date.now()}`,
          option_text: "",
          is_correct: false,
          isNew: true
        };
        return { ...q, options: [...q.options, newOption] };
      }
      return q;
    }));
  };

  const handleOptionChange = (qId: string, optId: string, text: string) => {
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        return {
          ...q,
          options: q.options.map((opt: any) => opt.id === optId ? { ...opt, option_text: text } : opt)
        };
      }
      return q;
    }));
  };

  const handleSetCorrectOption = (qId: string, optId: string) => {
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        return {
          ...q,
          options: q.options.map((opt: any) => ({ ...opt, is_correct: opt.id === optId }))
        };
      }
      return q;
    }));
  };

  const handleRemoveOption = (qId: string, optId: string) => {
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        return {
          ...q,
          options: q.options.filter((opt: any) => opt.id !== optId)
        };
      }
      return q;
    }));
  };

  const handleRemoveQuestion = (qId: string) => {
    if (!confirm("Are you sure you want to remove this question?")) return;
    setQuestions(questions.filter(q => q.id !== qId));
    // We should ideally mark it for deletion in DB, but for simplicity, we'll just re-sync on save.
    // In a real app, you'd want to explicitly delete removed items from DB.
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      // Since managing deep inserts/updates/deletes is complex, a simpler approach for this scale 
      // is to delete all existing questions for this test and re-insert them.
      // However, deleting cascades to test_attempts and options. We don't want to lose test_attempts!
      // So we must update existing, insert new, delete removed.

      // Get current IDs from state
      const currentQIds = questions.filter(q => !q.id.startsWith('temp-')).map(q => q.id);
      
      // Delete questions not in state
      if (currentQIds.length > 0) {
        await supabase.from("questions").delete().eq("test_id", testId).not("id", "in", `(${currentQIds.join(',')})`);
      } else {
        await supabase.from("questions").delete().eq("test_id", testId);
      }

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        let savedQId = q.id;

        // Upsert Question
        if (q.id.startsWith('temp-')) {
          const { data: newQ, error: qErr } = await supabase.from("questions").insert({
            test_id: testId,
            question_text: q.question_text,
            position: i + 1
          }).select().single();
          if (qErr) throw qErr;
          savedQId = newQ.id;
        } else {
          await supabase.from("questions").update({
            question_text: q.question_text,
            position: i + 1
          }).eq("id", q.id);
        }

        // Manage Options for this Question
        const currentOptIds = q.options.filter((o: any) => !o.id.startsWith('temp-')).map((o: any) => o.id);
        
        if (currentOptIds.length > 0) {
          await supabase.from("options").delete().eq("question_id", savedQId).not("id", "in", `(${currentOptIds.join(',')})`);
        } else {
          await supabase.from("options").delete().eq("question_id", savedQId);
        }

        for (const opt of q.options) {
          if (opt.id.startsWith('temp-')) {
            await supabase.from("options").insert({
              question_id: savedQId,
              option_text: opt.option_text,
              is_correct: opt.is_correct
            });
          } else {
            await supabase.from("options").update({
              option_text: opt.option_text,
              is_correct: opt.is_correct
            }).eq("id", opt.id);
          }
        }
      }

      alert("Test saved successfully!");
      fetchTestDetails(); // Reload to get fresh DB IDs
    } catch (error: any) {
      console.error("Error saving test:", error);
      alert("Failed to save test: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading Test Builder...</div>;
  }

  return (
    <DashboardLayout sidebarItems={sidebarItems}>
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => navigate(`/admin/courses/content/${test?.modules?.course_id}`)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Course Content
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1">{test?.title}</h1>
            <p className="text-muted-foreground">Test Builder</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleAddQuestion} className="shadow-sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Question
            </Button>
            <Button onClick={handleSaveAll} disabled={saving} className="shadow-lg shadow-[#5B47ED]/20">
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Save Test"}
            </Button>
          </div>
        </div>

        {questions.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 border border-border text-center shadow-sm">
            <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">No questions yet</h3>
            <p className="text-muted-foreground mb-6">Start building your test by adding the first question.</p>
            <Button onClick={handleAddQuestion}>Add First Question</Button>
          </div>
        ) : (
          <div className="space-y-8">
            {questions.map((q, qIndex) => (
              <div key={q.id} className="bg-white border border-border rounded-2xl p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div className="flex-1">
                    <label className="block text-sm font-bold mb-2 text-muted-foreground uppercase tracking-wider">
                      Question {qIndex + 1}
                    </label>
                    <textarea 
                      value={q.question_text}
                      onChange={(e) => handleQuestionChange(q.id, e.target.value)}
                      placeholder="Enter your question here..."
                      className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5B47ED]/50 text-base resize-none"
                      rows={2}
                    />
                  </div>
                  <button 
                    onClick={() => handleRemoveQuestion(q.id)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-6"
                    title="Remove Question"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 pl-4 border-l-2 border-accent">
                  <label className="block text-sm font-bold mb-3 text-muted-foreground uppercase tracking-wider">
                    Options (Select the correct one)
                  </label>
                  {q.options.map((opt: any, oIndex: number) => (
                    <div key={opt.id} className="flex items-center gap-3">
                      <button 
                        onClick={() => handleSetCorrectOption(q.id, opt.id)}
                        className={`p-1 rounded-full transition-colors ${opt.is_correct ? 'text-green-500' : 'text-muted-foreground hover:text-foreground'}`}
                      >
                        {opt.is_correct ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                      </button>
                      <input 
                        type="text"
                        value={opt.option_text}
                        onChange={(e) => handleOptionChange(q.id, opt.id, e.target.value)}
                        placeholder={`Option ${oIndex + 1}`}
                        className={`flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B47ED]/50 ${opt.is_correct ? 'border-green-200 bg-green-50' : 'border-border'}`}
                      />
                      {q.options.length > 2 && (
                        <button 
                          onClick={() => handleRemoveOption(q.id, opt.id)}
                          className="p-2 text-muted-foreground hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  
                  <div className="pt-2">
                    <button 
                      onClick={() => handleAddOption(q.id)}
                      className="text-sm font-bold text-[#5B47ED] hover:text-[#4938D6] flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-4 h-4" /> Add Option
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
