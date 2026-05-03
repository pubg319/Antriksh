import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { Stream } from "@cloudflare/stream-react";
import { Button } from "../components/Button";
import { supabase } from "../lib/supabase";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  PlayCircle,
  Menu,
  X,
  FileText,
  Download,
  ExternalLink
} from "lucide-react";

import { TestPlayer } from "../components/TestPlayer";

export function CoursePlayerPage() {
  const { courseId, lessonId } = useParams();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [liveSessions, setLiveSessions] = useState<any[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(lessonId || null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [completedLessonsSet, setCompletedLessonsSet] = useState<Set<string>>(new Set());
  const [openModules, setOpenModules] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"description" | "notes" | "resources" | "doubts">("description");
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [resources, setResources] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchCourseAndProgress() {
      if (!courseId) return;

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate("/auth");
        return;
      }

      // 1. Verify access explicitly
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
        
      if (profile?.role !== "admin") {
        const { data: enrollment } = await supabase
          .from("enrollments")
          .select("id")
          .eq("user_id", user.id)
          .eq("course_id", courseId)
          .single();
          
        if (!enrollment) {
          // Redirect unauthorized students back to the course sales page
          navigate(`/course/${courseId}`);
          return;
        }
      }

      const { data: courseData, error: courseError } = await supabase
        .from("courses")
        .select(`
          *,
          modules (
            id,
            title,
            position,
            lessons (
              id,
              title,
              description,
              notes,
              position,
              is_preview,
              video_id
            ),
            tests (
              id,
              title,
              description,
              position,
              passing_score
            )
          )
        `)
        .eq("id", courseId)
        .single();

      if (!courseError && courseData) {
        // Sort modules and lessons
        courseData.modules.sort((a: any, b: any) => a.position - b.position);
        courseData.modules.forEach((m: any) => {
          if (m.lessons) m.lessons.sort((a: any, b: any) => a.position - b.position);
          if (m.tests) m.tests.sort((a: any, b: any) => a.position - b.position);
          
          m.items = [
            ...(m.lessons || []).map((l:any) => ({...l, type: 'lesson'})),
            ...(m.tests || []).map((t:any) => ({...t, type: 'test'}))
          ];
          m.items.sort((a: any, b: any) => a.position - b.position);
        });
        
        setCourse(courseData);
        
        if (courseData.modules?.[0]) {
          setOpenModules(new Set([courseData.modules[0].id]));
        }

        if (!selectedLessonId && courseData.modules?.[0]?.items?.[0]) {
          setSelectedLessonId(courseData.modules[0].items[0].id);
        }

        // Fetch Live Sessions for this course
        const { data: sessions } = await supabase
          .from("live_sessions")
          .select("*")
          .eq("course_id", courseId)
          .gte("scheduled_at", new Date().toISOString())
          .order("scheduled_at", { ascending: true });
        
        if (sessions) setLiveSessions(sessions);
      }

      if (user) {
        const { data: progressData } = await supabase
          .from("progress")
          .select("lesson_id")
          .eq("user_id", user.id)
          .eq("completed", true);
        
        if (progressData) {
          setCompletedLessonsSet(new Set(progressData.map(p => p.lesson_id)));
        }
      }
      
      setLoading(false);
    }
    fetchCourseAndProgress();
  }, [courseId]);

  useEffect(() => {
    async function fetchLessonResources() {
      if (!selectedLessonId) return;
      const { data } = await supabase
        .from("resources")
        .select("*")
        .eq("lesson_id", selectedLessonId);
      if (data) setResources(data);
    }
    fetchLessonResources();
  }, [selectedLessonId]);

  useEffect(() => {
    if (!courseId || activeTab !== "doubts") return;

    // Fetch existing messages
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select(`
          *,
          profiles (name, avatar_url)
        `)
        .eq("course_id", courseId)
        .order("created_at", { ascending: true });
      if (data) setMessages(data);
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`course_doubts_${courseId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `course_id=eq.${courseId}`,
        },
        async (payload) => {
          // Fetch profile for the new message
          const { data: profile } = await supabase
            .from("profiles")
            .select("name, avatar_url")
            .eq("id", payload.new.user_id)
            .single();
          
          const messageWithProfile = { ...payload.new, profiles: profile };
          setMessages((prev) => [...prev, messageWithProfile]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [courseId, activeTab]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !courseId) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const messageContent = newMessage;
    setNewMessage(""); // Clear input early for better UX

    const { error } = await supabase.from("messages").insert({
      course_id: courseId,
      user_id: user.id,
      content: messageContent,
    });

    if (error) {
      alert("Failed to send message");
      setNewMessage(messageContent); // Restore on error
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1>Course not found</h1>
          <Link to="/dashboard">
            <Button className="mt-4">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const allItems = course.modules?.flatMap((module: any) =>
    module.items?.map((item: any) => ({ ...item, moduleId: module.id, moduleTitle: module.title }))
  ) || [];

  const currentLessonIndex = allItems.findIndex((l: any) => l.id === selectedLessonId);
  const currentLesson = allItems[currentLessonIndex];
  const previousLesson = currentLessonIndex > 0 ? allItems[currentLessonIndex - 1] : null;
  const nextLesson =
    currentLessonIndex < allItems.length - 1 ? allItems[currentLessonIndex + 1] : null;

  const completedLessonsCount = completedLessonsSet.size;
  const progress = allItems.length ? Math.round((completedLessonsCount / allItems.length) * 100) : 0;

  const toggleLessonCompletion = async (targetLessonId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("Please login to mark as complete");

    const isCompleted = completedLessonsSet.has(targetLessonId);
    
    // Optimistic UI update
    const newSet = new Set(completedLessonsSet);
    if (isCompleted) {
      newSet.delete(targetLessonId);
    } else {
      newSet.add(targetLessonId);
    }
    setCompletedLessonsSet(newSet);

    // Call Supabase
    await supabase.from("progress").upsert({
      user_id: user.id,
      lesson_id: targetLessonId,
      completed: !isCompleted,
      updated_at: new Date().toISOString()
    }, { onConflict: "user_id, lesson_id" });
  };

  const toggleModule = (moduleId: string) => {
    const newSet = new Set(openModules);
    if (newSet.has(moduleId)) {
      newSet.delete(moduleId);
    } else {
      newSet.add(moduleId);
    }
    setOpenModules(newSet);
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <header className="bg-[#1C1D1F] text-white px-6 py-3 flex items-center justify-between flex-shrink-0 z-10 relative">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="text-sm text-white/80 hover:text-white transition-colors">
            ← Back to Dashboard
          </Link>
        </div>
        <h3 className="hidden md:block text-base font-normal">{course.title}</h3>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-sm">
            <span className="text-white/80">Your progress</span>
            <span className="font-semibold">{completedLessonsCount} of {allItems.length} ({progress}%)</span>
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden text-white hover:text-white/80 transition-colors">
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Live Session Alert Banner */}
      {liveSessions.length > 0 && (
        <div className="bg-[#5B47ED] text-white px-6 py-2 flex items-center justify-between animate-in slide-in-from-top duration-500">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-red-400 rounded-full animate-ping" />
            <span className="text-sm font-medium">
              Live Session: <span className="font-bold">{liveSessions[0].title}</span> is scheduled for {new Date(liveSessions[0].scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <a href={liveSessions[0].meeting_url} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline" className="bg-white text-[#5B47ED] hover:bg-white/90 border-none h-8 text-xs font-bold">
              JOIN LIVE NOW
            </Button>
          </a>
        </div>
      )}

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden relative">
        
        {/* Main Video Area (Left Desktop, Top Mobile) */}
        <main className="flex-1 flex flex-col overflow-y-auto bg-background relative">
          {currentLesson?.type === 'test' ? (
            <TestPlayer 
              testId={currentLesson.id} 
              courseId={courseId || ""} 
              onComplete={() => {
                if (!completedLessonsSet.has(currentLesson.id)) {
                  toggleLessonCompletion(currentLesson.id);
                }
                if (nextLesson) {
                  setSelectedLessonId(nextLesson.id);
                }
              }}
            />
          ) : (
            <>
              <div className="w-full bg-black aspect-video flex items-center justify-center relative flex-shrink-0 shadow-lg">
                {currentLesson?.video_id ? (
                  <Stream
                    controls
                    src={currentLesson.video_id}
                    className="w-full h-full object-contain"
                    onEnded={() => {
                      if (currentLesson && !completedLessonsSet.has(currentLesson.id)) {
                        toggleLessonCompletion(currentLesson.id);
                      }
                      if (nextLesson) {
                        setSelectedLessonId(nextLesson.id);
                      }
                    }}
                  />
                ) : (
                  <div className="text-center text-white">
                    <PlayCircle className="w-20 h-20 mx-auto mb-4 opacity-80" />
                    <p className="text-lg">No Video Available</p>
                    <p className="text-sm text-white/70 mt-2">
                      {currentLesson?.title}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex-1 p-6 lg:p-10 max-w-4xl mx-auto w-full">
                {/* Lesson specific tabs and details here */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-4">
              <div className="flex-1">
                <div className="text-sm text-muted-foreground mb-2 font-medium">
                  {currentLesson?.moduleTitle}
                </div>
                <h1 className="text-2xl md:text-3xl mb-1">{currentLesson?.title}</h1>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-8 border-b border-border mb-8 overflow-x-auto whitespace-nowrap">
              <button 
                onClick={() => setActiveTab("description")}
                className={`pb-4 text-sm font-bold transition-colors relative ${activeTab === "description" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                About
                {activeTab === "description" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5B47ED]" />}
              </button>
              <button 
                onClick={() => setActiveTab("notes")}
                className={`pb-4 text-sm font-bold transition-colors relative ${activeTab === "notes" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                Notes
                {activeTab === "notes" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5B47ED]" />}
              </button>
              <button 
                onClick={() => setActiveTab("resources")}
                className={`pb-4 text-sm font-bold transition-colors relative ${activeTab === "resources" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                Resources ({resources.length})
                {activeTab === "resources" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5B47ED]" />}
              </button>
              <button 
                onClick={() => setActiveTab("doubts")}
                className={`pb-4 text-sm font-bold transition-colors relative ${activeTab === "doubts" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                Doubts (Chat)
                {activeTab === "doubts" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5B47ED]" />}
              </button>
            </div>

            {/* Tab Content */}
            <div className="min-h-[200px]">
              {activeTab === "description" && (
                <p className="text-muted-foreground leading-relaxed">{currentLesson?.description || "No description provided for this lesson."}</p>
              )}

              {activeTab === "notes" && (
                <div className="prose prose-sm max-w-none">
                  {currentLesson?.notes ? (
                    <div className="whitespace-pre-wrap text-foreground/90 bg-muted/30 p-6 rounded-xl border border-border">
                      {currentLesson.notes}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground italic">
                      No study notes available for this lesson.
                    </div>
                  )}
                </div>
              )}

              {activeTab === "resources" && (
                <div className="grid gap-4">
                  {resources.length > 0 ? (
                    resources.map((res) => (
                      <a 
                        key={res.id} 
                        href={res.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-4 bg-white border border-border rounded-xl hover:border-[#5B47ED] hover:shadow-md transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-[#5B47ED]/10 rounded-lg flex items-center justify-center group-hover:bg-[#5B47ED] transition-colors">
                            {res.type === 'pdf' ? (
                              <FileText className="w-5 h-5 text-[#5B47ED] group-hover:text-white" />
                            ) : (
                              <ExternalLink className="w-5 h-5 text-[#5B47ED] group-hover:text-white" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold">{res.title}</div>
                            <div className="text-xs text-muted-foreground">{res.type.toUpperCase()} File</div>
                          </div>
                        </div>
                        <Download className="w-5 h-5 text-muted-foreground group-hover:text-[#5B47ED]" />
                      </a>
                    ))
                  ) : (
                    <div className="text-center py-12 text-muted-foreground italic">
                      No downloadable resources for this lesson.
                    </div>
                  )}
                </div>
              )}

              {activeTab === "doubts" && (
                <div className="flex flex-col h-[500px] bg-white border border-border rounded-xl shadow-sm overflow-hidden">
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-accent/5">
                    {messages.length > 0 ? (
                      messages.map((msg) => (
                        <div key={msg.id} className="flex gap-3">
                          <img 
                            src={msg.profiles?.avatar_url || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop"} 
                            alt={msg.profiles?.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold">{msg.profiles?.name || "Student"}</span>
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div className="text-sm bg-white p-3 rounded-2xl rounded-tl-none border border-border shadow-sm inline-block max-w-[90%]">
                              {msg.content}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground italic text-sm">
                        No doubts yet. Ask your first question!
                      </div>
                    )}
                  </div>
                  
                  <form onSubmit={handleSendMessage} className="p-4 border-t border-border flex gap-2 bg-white">
                    <input 
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Ask a doubt..."
                      className="flex-1 px-4 py-2 bg-accent/20 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B47ED]/50"
                    />
                    <Button type="submit" disabled={!newMessage.trim()}>Send</Button>
                  </form>
                </div>
              )}
            </div>

            {/* Navigation buttons below content on desktop, bottom sticky on mobile */}
            <div className="hidden lg:flex items-center justify-between mt-8">
              <Button
                variant="outline"
                disabled={!previousLesson}
                onClick={() => previousLesson && setSelectedLessonId(previousLesson.id)}
                className="min-w-[120px]"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              <Button
                variant="primary"
                disabled={!nextLesson}
                onClick={() => nextLesson && setSelectedLessonId(nextLesson.id)}
                className="min-w-[120px]"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
            </div>
          </>
        )}
        </main>

        {/* Sidebar (Right Desktop, Bottom Mobile) */}
        <aside
          className={`${
            sidebarOpen ? "flex" : "hidden"
          } lg:flex w-full lg:w-[400px] xl:w-[450px] flex-shrink-0 flex-col bg-white border-t lg:border-t-0 lg:border-l border-border h-[50vh] lg:h-auto overflow-hidden`}
        >
          <div className="p-4 border-b border-border flex items-center justify-between bg-white font-bold text-lg flex-shrink-0">
            Course content
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {course.modules?.map((module: any, index: number) => {
              const isOpen = openModules.has(module.id);
              const completedInModule = module.items.filter((l: any) => completedLessonsSet.has(l.id)).length;

              return (
                <div key={module.id} className="border-b border-border">
                  <button
                    onClick={() => toggleModule(module.id)}
                    className="w-full flex items-start justify-between p-4 bg-muted/20 hover:bg-muted/40 transition-colors text-left"
                  >
                    <div className="flex-1 pr-4">
                      <div className="font-bold text-sm mb-1">
                        Section {index + 1}: {module.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {completedInModule} / {module.items.length} completed
                      </div>
                    </div>
                    {isOpen ? <ChevronUp className="w-5 h-5 text-muted-foreground mt-0.5" /> : <ChevronDown className="w-5 h-5 text-muted-foreground mt-0.5" />}
                  </button>

                  {isOpen && (
                    <div className="bg-white">
                      {module.items?.map((item: any, itemIdx: number) => {
                        const isActive = item.id === selectedLessonId;
                        const isCompleted = completedLessonsSet.has(item.id);

                        return (
                          <div
                            key={item.id}
                            className={`group w-full flex items-start gap-3 p-4 transition-colors cursor-pointer ${
                              isActive ? "bg-accent/50" : "hover:bg-accent/20"
                            }`}
                            onClick={(e) => {
                              // If clicking the checkbox, don't change the selected lesson
                              if ((e.target as HTMLElement).tagName.toLowerCase() !== 'input') {
                                setSelectedLessonId(item.id);
                              }
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isCompleted}
                              onChange={() => toggleLessonCompletion(item.id)}
                              className="mt-1 w-4 h-4 rounded-sm border-gray-300 text-black focus:ring-black cursor-pointer flex-shrink-0 accent-black"
                              title="Mark as complete"
                            />
                            <div className="flex-1 text-left">
                              <div className={`text-sm ${isActive ? "font-bold" : "text-foreground/90"}`}>
                                {itemIdx + 1}. {item.title}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
                                {item.type === 'lesson' ? (
                                  <><PlayCircle className="w-3.5 h-3.5" /> Video Lesson</>
                                ) : (
                                  <><FileText className="w-3.5 h-3.5 text-orange-500" /> Assessment Test</>
                                )}
                              </div>
                            </div>
                            {isActive && item.type === 'lesson' && (
                              <div className="hidden group-hover:flex items-center mt-1">
                                <Button size="sm" variant="outline" className="h-7 text-xs px-2 py-0">
                                  <FileText className="w-3 h-3 mr-1" /> Resources
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* Sticky Mobile Bottom Navigation CTA */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-border flex items-center justify-between gap-4 z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
           <Button
             variant="outline"
             disabled={!previousLesson}
             onClick={() => previousLesson && setSelectedLessonId(previousLesson.id)}
             className="flex-1"
           >
             <ChevronLeft className="w-4 h-4 mr-1" />
             Prev
           </Button>
           
           <label className="flex items-center gap-2 px-4 py-2 bg-muted/30 rounded-md font-medium text-sm cursor-pointer whitespace-nowrap">
             <input 
               type="checkbox" 
               checked={currentLesson ? completedLessonsSet.has(currentLesson.id) : false}
               onChange={() => currentLesson && toggleLessonCompletion(currentLesson.id)}
               className="w-4 h-4 rounded-sm border-gray-300 accent-black"
             />
             Done
           </label>

           <Button
             variant="primary"
             disabled={!nextLesson}
             onClick={() => nextLesson && setSelectedLessonId(nextLesson.id)}
             className="flex-1"
           >
             Next
             <ChevronRight className="w-4 h-4 ml-1" />
           </Button>
        </div>
      </div>
      
      {/* Spacer for mobile bottom nav */}
      <div className="lg:hidden h-[73px] flex-shrink-0 w-full" />
    </div>
  );
}

