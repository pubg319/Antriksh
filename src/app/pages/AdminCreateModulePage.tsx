import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Navbar } from "../components/Navbar";
import { Sidebar } from "../components/Sidebar";
import { Button } from "../components/Button";
import { TrendingUp, BookOpen, Users, DollarSign, Layers } from "lucide-react";
import { supabase } from "../lib/supabase";

export function AdminCreateModulePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const courseIdParam = searchParams.get("courseId");
  
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState(courseIdParam || "");
  const [title, setTitle] = useState("");
  const [position, setPosition] = useState("1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sidebarItems = [
    { path: "/admin", label: "Dashboard", icon: TrendingUp },
    { path: "/admin/courses", label: "Courses", icon: BookOpen },
    { path: "/admin/students", label: "Students", icon: Users },
    { path: "/admin/payments", label: "Payments", icon: DollarSign },
  ];

  useEffect(() => {
    async function fetchCourses() {
      const { data } = await supabase.from("courses").select("id, title");
      if (data) setCourses(data);
    }
    fetchCourses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!selectedCourse) throw new Error("Please select a course");

      const { error: insertError } = await supabase
        .from('modules')
        .insert({
          course_id: selectedCourse,
          title,
          position: parseInt(position, 10),
        });

      if (insertError) throw insertError;

      alert("Module created successfully!");
      navigate("/admin/courses");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to create module");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="flex">
        <Sidebar items={sidebarItems} />

        <main className="flex-1 p-8">
          <div className="max-w-2xl mx-auto">
            <h1 className="mb-2">Create New Module</h1>
            <p className="text-muted-foreground mb-8">Add a section or module to an existing course</p>

            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg border border-red-100">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-border p-8 shadow-sm">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Select Course</label>
                  <select
                    required
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B47ED]/50"
                  >
                    <option value="">-- Choose a course --</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Module Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B47ED]/50"
                    placeholder="e.g. Introduction to React"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Position (Order)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B47ED]/50"
                    placeholder="1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Controls the order in which modules appear in the curriculum.</p>
                </div>

                <div className="pt-4 flex justify-end gap-4 border-t border-border">
                  <Button type="button" variant="outline" onClick={() => navigate("/admin/courses")}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    <Layers className="w-4 h-4 mr-2" />
                    {loading ? "Creating..." : "Create Module"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
