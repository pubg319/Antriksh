import { useState, useEffect } from "react";
import { Navbar } from "../components/Navbar";
import { Sidebar } from "../components/Sidebar";
import { Button } from "../components/Button";
import { supabase } from "../lib/supabase";
import { 
  TrendingUp, 
  BookOpen, 
  Users, 
  DollarSign, 
  Video, 
  Calendar, 
  Link as LinkIcon, 
  Plus, 
  Trash2,
  Clock
} from "lucide-react";

export function AdminLiveClassesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [selectedCourse, setSelectedCourse] = useState("");
  const [title, setTitle] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [duration, setDuration] = useState("60");

  const sidebarItems = [
    { path: "/admin", label: "Dashboard", icon: TrendingUp },
    { path: "/admin/courses", label: "Courses", icon: BookOpen },
    { path: "/admin/students", label: "Students", icon: Users },
    { path: "/admin/payments", label: "Payments", icon: DollarSign },
  ];

  useEffect(() => {
    async function fetchData() {
      const { data: coursesData } = await supabase.from("courses").select("id, title");
      if (coursesData) setCourses(coursesData);

      const { data: sessionsData } = await supabase
        .from("live_sessions")
        .select("*, courses(title)")
        .order("scheduled_at", { ascending: true });
      if (sessionsData) setSessions(sessionsData);
      
      setLoading(false);
    }
    fetchData();
  }, []);

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !title || !meetingUrl || !scheduledAt) return;

    try {
      // 1. Insert the session
      const { data: insertedData, error: insertError } = await supabase.from("live_sessions").insert({
        course_id: selectedCourse,
        title,
        meeting_url: meetingUrl,
        scheduled_at: new Date(scheduledAt).toISOString(),
        duration_minutes: parseInt(duration),
        status: 'upcoming'
      }).select().single();

      if (insertError) {
        console.error("Insert Error:", insertError);
        throw insertError;
      }

      // 2. Fetch with relationship separately to avoid 400 errors during POST
      const { data: fullData, error: fetchError } = await supabase
        .from("live_sessions")
        .select("*, courses(title)")
        .eq("id", insertedData.id)
        .single();

      if (fetchError) {
        // Fallback if relationship fetch fails
        setSessions([...sessions, { ...insertedData, courses: { title: "Course" } }]);
      } else {
        setSessions([...sessions, fullData]);
      }
      
      setTitle("");
      setMeetingUrl("");
      setScheduledAt("");
      alert("Live class scheduled successfully!");
    } catch (err: any) {
      console.error("Full Error Object:", err);
      alert(`Error: ${err.message || "Check console for details"}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this live session?")) return;
    const { error } = await supabase.from("live_sessions").delete().eq("id", id);
    if (!error) {
      setSessions(sessions.filter(s => s.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="flex">
        <Sidebar items={sidebarItems} />

        <main className="flex-1 p-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold mb-2">Live Classes</h1>
                <p className="text-muted-foreground">Schedule and manage live interactive sessions</p>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Scheduling Form */}
              <div className="lg:col-span-1">
                <form onSubmit={handleSchedule} className="bg-white p-6 rounded-2xl border border-border shadow-sm sticky top-24">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[#5B47ED]" />
                    Schedule New
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Target Course</label>
                      <select 
                        value={selectedCourse}
                        onChange={e => setSelectedCourse(e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm"
                        required
                      >
                        <option value="">-- Select Course --</option>
                        {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-medium">Session Title</label>
                      <input 
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                        placeholder="e.g. Q&A Session"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-medium">Meeting URL (Zoom/Meet)</label>
                      <div className="relative">
                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input 
                          type="url"
                          value={meetingUrl}
                          onChange={e => setMeetingUrl(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm"
                          placeholder="https://..."
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-sm font-medium">Date & Time</label>
                        <input 
                          type="datetime-local"
                          value={scheduledAt}
                          onChange={e => setScheduledAt(e.target.value)}
                          className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-medium">Duration (Min)</label>
                        <input 
                          type="number"
                          value={duration}
                          onChange={e => setDuration(e.target.value)}
                          className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                          required
                        />
                      </div>
                    </div>

                    <Button type="submit" className="w-full py-6 rounded-xl mt-4">
                      <Plus className="w-5 h-5 mr-2" />
                      Schedule Session
                    </Button>
                  </div>
                </form>
              </div>

              {/* Sessions List */}
              <div className="lg:col-span-2 space-y-6">
                <h3 className="text-xl font-bold">Upcoming Sessions ({sessions.length})</h3>
                
                {sessions.length === 0 ? (
                  <div className="bg-white border border-dashed border-border rounded-3xl p-20 text-center">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <Video className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground italic">No live sessions scheduled yet.</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {sessions.map((session) => (
                      <div key={session.id} className="bg-white p-5 rounded-2xl border border-border flex items-center justify-between group hover:border-[#5B47ED] transition-all">
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 bg-[#5B47ED]/10 rounded-xl flex items-center justify-center shrink-0">
                            <Video className="w-7 h-7 text-[#5B47ED]" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-[#5B47ED] mb-1 uppercase tracking-wider">
                              {session.courses?.title}
                            </div>
                            <h4 className="text-lg font-bold mb-1">{session.title}</h4>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1.5">
                                <Calendar className="w-4 h-4" />
                                {new Date(session.scheduled_at).toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Clock className="w-4 h-4" />
                                {new Date(session.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <a href={session.meeting_url} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm" className="rounded-lg">
                              Join Link
                            </Button>
                          </a>
                          <button 
                            onClick={() => handleDelete(session.id)}
                            className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
