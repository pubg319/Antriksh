import { useState, useEffect } from "react";
import { Navbar } from "../components/Navbar";
import { Sidebar } from "../components/Sidebar";
import { supabase } from "../lib/supabase";
import { BookOpen, Users, DollarSign, TrendingUp, MoreVertical } from "lucide-react";

export function AdminStudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStudents() {
      // Fetch students and their enrollments to count them
      const { data } = await supabase
        .from("profiles")
        .select(`
          id,
          name,
          created_at,
          role,
          enrollments (id)
        `)
        .eq("role", "student")
        .order("created_at", { ascending: false });

      if (data) {
        setStudents(data);
      }
      setLoading(false);
    }
    fetchStudents();
  }, []);

  const sidebarItems = [
    { path: "/admin", label: "Dashboard", icon: TrendingUp },
    { path: "/admin/courses", label: "Courses", icon: BookOpen },
    { path: "/admin/students", label: "Students", icon: Users },
    { path: "/admin/payments", label: "Payments", icon: DollarSign },
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
            <div className="mb-8">
              <h1 className="mb-2">Manage Students</h1>
              <p className="text-muted-foreground">View all registered students and their enrollments</p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-border">
              <div className="flex items-center justify-between mb-6">
                <h2>All Students ({students.length})</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Name</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Joined Date</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Enrolled Courses</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student.id} className="border-b border-border hover:bg-accent/30 transition-colors">
                        <td className="py-4 px-4 font-medium">{student.name || "Unknown Student"}</td>
                        <td className="py-4 px-4">{new Date(student.created_at).toLocaleDateString()}</td>
                        <td className="py-4 px-4">
                          <span className="text-sm px-2 py-1 bg-[#5B47ED]/10 text-[#5B47ED] rounded">
                            {student.enrollments?.length || 0} courses
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <button className="p-2 hover:bg-accent rounded-lg transition-colors">
                            <MoreVertical className="w-5 h-5 text-muted-foreground" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {students.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-muted-foreground">
                          No students found.
                        </td>
                      </tr>
                    )}
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
