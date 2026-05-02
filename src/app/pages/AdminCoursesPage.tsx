import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Navbar } from "../components/Navbar";
import { Sidebar } from "../components/Sidebar";
import { Button } from "../components/Button";
import { supabase } from "../lib/supabase";
import { BookOpen, Users, DollarSign, Plus, MoreVertical, TrendingUp, Video, Edit2, Layers } from "lucide-react";

export function AdminCoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCourses() {
      const { data } = await supabase.from("courses").select("*").order("created_at", { ascending: false });
      if (data) setCourses(data);
      setLoading(false);
    }
    fetchCourses();
  }, []);

  const sidebarItems = [
    { path: "/admin", label: "Dashboard", icon: TrendingUp },
    { path: "/admin/courses", label: "Courses", icon: BookOpen },
    { path: "/admin/students", label: "Students", icon: Users },
    { path: "/admin/payments", label: "Payments", icon: DollarSign },
    { path: "/admin/live", label: "Live Classes", icon: Video },
  ];

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="flex">
        <Sidebar items={sidebarItems} />

        <main className="flex-1 p-8">
          <div className="max-w-7xl">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="mb-2">Manage Courses</h1>
                <p className="text-muted-foreground">View and manage all courses on the platform</p>
              </div>
              <Link to="/admin/courses/new">
                <Button>
                  <Plus className="w-5 h-5 mr-2" />
                  Create Course
                </Button>
              </Link>
            </div>

            <div className="bg-white rounded-xl p-6 border border-border">
              <div className="flex items-center justify-between mb-6">
                <h2>All Courses ({courses.length})</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Course</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Category</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Students</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Price</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.map((course) => (
                      <tr key={course.id} className="border-b border-border hover:bg-accent/30 transition-colors">
                        <td className="py-4 px-4">
                          <div className="font-medium">{course.title}</div>
                          <div className="text-sm text-muted-foreground">{new Date(course.created_at).toLocaleDateString()}</div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm px-2 py-1 bg-[#5B47ED]/10 text-[#5B47ED] rounded">
                            {course.category || "Uncategorized"}
                          </span>
                        </td>
                        <td className="py-4 px-4">{course.students || 0}</td>
                        <td className="py-4 px-4">
                          {course.is_published ? (
                             <span className="text-sm px-2 py-1 bg-green-100 text-green-700 rounded">Published</span>
                          ) : (
                             <span className="text-sm px-2 py-1 bg-gray-100 text-gray-700 rounded">Draft</span>
                          )}
                        </td>
                        <td className="py-4 px-4 font-semibold">₹{course.price}</td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <Link to={`/admin/courses/content/${course.id}`} title="Manage Content">
                              <button className="p-2 hover:bg-accent rounded-lg transition-colors text-[#5B47ED]">
                                <Layers className="w-5 h-5" />
                              </button>
                            </Link>
                            <Link to={`/admin/courses/edit/${course.id}`} title="Edit Course">
                              <button className="p-2 hover:bg-accent rounded-lg transition-colors text-muted-foreground hover:text-foreground">
                                <Edit2 className="w-5 h-5" />
                              </button>
                            </Link>
                            <button className="p-2 hover:bg-accent rounded-lg transition-colors">
                              <MoreVertical className="w-5 h-5 text-muted-foreground" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
