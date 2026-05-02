import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { Navbar } from "../components/Navbar";
import { Sidebar } from "../components/Sidebar";
import { Button } from "../components/Button";
import { 
  TrendingUp, 
  BookOpen, 
  Users, 
  DollarSign, 
  Plus, 
  GripVertical, 
  Edit2, 
  Trash2, 
  ChevronDown, 
  ChevronUp,
  Video,
  FileText,
  ArrowLeft
} from "lucide-react";
import { supabase } from "../lib/supabase";

export function AdminCourseContentPage() {
  const { id: courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  // Modal states
  const [moduleModalOpen, setModuleModalOpen] = useState(false);
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);

  // Form states
  const [moduleTitle, setModuleTitle] = useState("");
  const [modulePosition, setModulePosition] = useState("1");
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonDescription, setLessonDescription] = useState("");
  const [lessonVideoId, setLessonVideoId] = useState("");
  const [lessonNotes, setLessonNotes] = useState("");
  const [lessonPosition, setLessonPosition] = useState("1");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sidebarItems = [
    { path: "/admin", label: "Dashboard", icon: TrendingUp },
    { path: "/admin/courses", label: "Courses", icon: BookOpen },
    { path: "/admin/students", label: "Students", icon: Users },
    { path: "/admin/payments", label: "Payments", icon: DollarSign },
  ];

  const fetchContent = async () => {
    if (!courseId) return;
    setLoading(true);
    try {
      const { data: courseData } = await supabase.from("courses").select("title").eq("id", courseId).single();
      setCourse(courseData);

      const { data: modulesData } = await supabase
        .from("modules")
        .select(`
          *,
          lessons (*)
        `)
        .eq("course_id", courseId)
        .order("position", { ascending: true });

      if (modulesData) {
        modulesData.forEach(m => {
          if (m.lessons) m.lessons.sort((a: any, b: any) => a.position - b.position);
        });
        setModules(modulesData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, [courseId]);

  const toggleModule = (id: string) => {
    const newSet = new Set(expandedModules);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedModules(newSet);
  };

  const handleModuleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingItem) {
        await supabase.from("modules").update({
          title: moduleTitle,
          position: parseInt(modulePosition)
        }).eq("id", editingItem.id);
      } else {
        await supabase.from("modules").insert({
          course_id: courseId,
          title: moduleTitle,
          position: parseInt(modulePosition)
        });
      }
      setModuleModalOpen(false);
      setEditingItem(null);
      fetchContent();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLessonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingItem) {
        await supabase.from("lessons").update({
          title: lessonTitle,
          description: lessonDescription,
          video_id: lessonVideoId,
          notes: lessonNotes,
          position: parseInt(lessonPosition)
        }).eq("id", editingItem.id);
      } else {
        await supabase.from("lessons").insert({
          module_id: activeModuleId,
          title: lessonTitle,
          description: lessonDescription,
          video_id: lessonVideoId,
          notes: lessonNotes,
          position: parseInt(lessonPosition)
        });
      }
      setLessonModalOpen(false);
      setEditingItem(null);
      fetchContent();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteModule = async (id: string) => {
    if (!confirm("Are you sure? This will delete all lessons in this module.")) return;
    await supabase.from("modules").delete().eq("id", id);
    fetchContent();
  };

  const deleteLesson = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    await supabase.from("lessons").delete().eq("id", id);
    fetchContent();
  };

  const openModuleModal = (module?: any) => {
    if (module) {
      setEditingItem(module);
      setModuleTitle(module.title);
      setModulePosition(module.position.toString());
    } else {
      setEditingItem(null);
      setModuleTitle("");
      setModulePosition((modules.length + 1).toString());
    }
    setModuleModalOpen(true);
  };

  const openLessonModal = (moduleId: string, lesson?: any) => {
    setActiveModuleId(moduleId);
    if (lesson) {
      setEditingItem(lesson);
      setLessonTitle(lesson.title);
      setLessonDescription(lesson.description || "");
      setLessonVideoId(lesson.video_id || "");
      setLessonNotes(lesson.notes || "");
      setLessonPosition(lesson.position.toString());
    } else {
      setEditingItem(null);
      setLessonTitle("");
      setLessonDescription("");
      setLessonVideoId("");
      setLessonNotes("");
      const mod = modules.find(m => m.id === moduleId);
      setLessonPosition((mod?.lessons?.length + 1 || 1).toString());
    }
    setLessonModalOpen(true);
  };

  if (loading && !modules.length) return <div className="min-h-screen bg-background flex items-center justify-center">Loading Content Builder...</div>;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex">
        <Sidebar items={sidebarItems} />
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
             <button 
              onClick={() => navigate("/admin/courses")}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Courses
            </button>

            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold mb-1">{course?.title}</h1>
                <p className="text-muted-foreground text-sm">Course Content & Curriculum Builder</p>
              </div>
              <Button onClick={() => openModuleModal()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Module
              </Button>
            </div>

            <div className="space-y-4">
              {modules.map((module, idx) => (
                <div key={module.id} className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
                  <div className="flex items-center justify-between p-4 bg-accent/20">
                    <div className="flex items-center gap-4">
                      <GripVertical className="w-5 h-5 text-muted-foreground cursor-move" />
                      <button 
                        onClick={() => toggleModule(module.id)}
                        className="flex items-center gap-2 font-bold hover:text-[#5B47ED] transition-colors"
                      >
                        {expandedModules.has(module.id) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        Section {idx + 1}: {module.title}
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => openModuleModal(module)} className="p-2 hover:bg-accent rounded-lg text-muted-foreground hover:text-foreground">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteModule(module.id)} className="p-2 hover:bg-accent rounded-lg text-red-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {expandedModules.has(module.id) && (
                    <div className="p-4 bg-white space-y-2 border-t border-border">
                      {module.lessons?.map((lesson: any, lIdx: number) => (
                        <div key={lesson.id} className="flex items-center justify-between p-3 border border-border rounded-lg hover:border-[#5B47ED]/50 hover:bg-accent/10 transition-all">
                          <div className="flex items-center gap-3">
                            <Video className="w-4 h-4 text-[#5B47ED]" />
                            <span className="text-sm font-medium">{lIdx + 1}. {lesson.title}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={() => openLessonModal(module.id, lesson)} className="p-1.5 hover:bg-accent rounded-md text-muted-foreground">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => deleteLesson(lesson.id)} className="p-1.5 hover:bg-accent rounded-md text-red-400">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                      <button 
                        onClick={() => openLessonModal(module.id)}
                        className="w-full mt-2 py-2 border border-dashed border-border rounded-lg text-sm text-muted-foreground hover:text-[#5B47ED] hover:border-[#5B47ED]/50 transition-all flex items-center justify-center gap-2"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Lesson
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* Module Modal */}
      {moduleModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-xl font-bold mb-4">{editingItem ? "Edit Module" : "Add New Module"}</h2>
            <form onSubmit={handleModuleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Module Title</label>
                <input 
                  type="text" required value={moduleTitle} onChange={e => setModuleTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B47ED]/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Position</label>
                <input 
                  type="number" required value={modulePosition} onChange={e => setModulePosition(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B47ED]/50"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setModuleModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save Module"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lesson Modal */}
      {lessonModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editingItem ? "Edit Lesson" : "Add New Lesson"}</h2>
            <form onSubmit={handleLessonSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Lesson Title</label>
                  <input 
                    type="text" required value={lessonTitle} onChange={e => setLessonTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B47ED]/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Position</label>
                  <input 
                    type="number" required value={lessonPosition} onChange={e => setLessonPosition(e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B47ED]/50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Cloudflare Video ID</label>
                <input 
                  type="text" value={lessonVideoId} onChange={e => setLessonVideoId(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B47ED]/50"
                  placeholder="Paste Cloudflare Stream UID here"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Description</label>
                <textarea 
                  rows={2} value={lessonDescription} onChange={e => setLessonDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B47ED]/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Study Notes (Markdown supported)</label>
                <textarea 
                  rows={4} value={lessonNotes} onChange={e => setLessonNotes(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B47ED]/50"
                  placeholder="Add detailed notes for this lesson..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setLessonModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save Lesson"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
