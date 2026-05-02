import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Navbar } from "../components/Navbar";
import { Sidebar } from "../components/Sidebar";
import { Button } from "../components/Button";
import { supabase } from "../lib/supabase";
import {
  BookOpen,
  Users,
  DollarSign,
  Plus,
  MoreVertical,
  TrendingUp,
  Video,
  Layers,
  Calendar,
} from "lucide-react";

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState("overview");
  const [courses, setCourses] = useState<any[]>([]);
  const [activeStudents, setActiveStudents] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      // 1. Fetch Courses
      const { data: coursesData } = await supabase.from("courses").select("*").order("created_at", { ascending: false });
      if (coursesData) setCourses(coursesData);

      // 2. Fetch Active Students Count
      const { count: studentCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "student");
      setActiveStudents(studentCount || 0);

      // 3. Fetch Total Revenue (Sum of course prices * students)
      // Ideal approach: Sum from a 'payments' table. 
      // Current approach: Calculate from courses data as a proxy
      const revenue = coursesData?.reduce((acc, course) => acc + (course.price * (course.students || 0)), 0);
      setTotalRevenue(revenue || 0);
      
      setLoading(false);
    }
    fetchStats();
  }, []);

  const sidebarItems = [
    { path: "/admin", label: "Dashboard", icon: TrendingUp },
    { path: "/admin/courses", label: "Courses", icon: BookOpen },
    { path: "/admin/students", label: "Students", icon: Users },
    { path: "/admin/payments", label: "Payments", icon: DollarSign },
    { path: "/admin/live", label: "Live Classes", icon: Video },
  ];

  const stats = [
    { label: "Total Revenue", value: `₹${totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-green-600" },
    { label: "Active Students", value: activeStudents.toLocaleString(), icon: Users, color: "text-blue-600" },
    { label: "Total Courses", value: courses.length.toString(), icon: BookOpen, color: "text-purple-600" },
    { label: "Avg. Rating", value: "4.7", icon: TrendingUp, color: "text-orange-600" },
  ];

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading Stats...</div>;
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
                <h1 className="mb-2">Admin Dashboard</h1>
                <p className="text-muted-foreground">Manage your courses and students</p>
              </div>
              <Link to="/admin/courses/new">
                <Button>
                  <Plus className="w-5 h-5 mr-2" />
                  Create Course
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="bg-white rounded-xl p-6 border border-border">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 rounded-lg bg-${stat.color}/10 flex items-center justify-center`}>
                        <Icon className={`w-6 h-6 ${stat.color}`} />
                      </div>
                    </div>
                    <div className="text-3xl font-semibold mb-1">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                );
              })}
            </div>

            <div className="grid lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-border">
                <h2 className="mb-6">Recent Courses</h2>
                <div className="space-y-4">
                  {courses.slice(0, 5).map((course) => (
                    <div
                      key={course.id}
                      className="flex items-center justify-between p-4 rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-accent rounded-lg flex items-center justify-center">
                          <Video className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <div>
                          <h4 className="mb-1">{course.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {course.students || 0} students
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-semibold">₹{course.price}</div>
                          <div className="text-sm text-muted-foreground">
                            Rating: {course.rating || 0}
                          </div>
                        </div>
                        <button className="p-2 hover:bg-accent rounded-lg transition-colors">
                          <MoreVertical className="w-5 h-5 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-border">
                <h2 className="mb-6">Quick Actions</h2>
                <div className="space-y-3">
                  <Link to="/admin/courses/new" className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <Plus className="w-5 h-5 mr-2" />
                      Create New Course
                    </Button>
                  </Link>
                  <Link to="/admin/upload-video" className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <Video className="w-5 h-5 mr-2" />
                      Upload Video
                    </Button>
                  </Link>
                  <Link to="/admin/modules/new" className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <Layers className="w-5 h-5 mr-2" />
                      Create Module
                    </Button>
                  </Link>
                  <Link to="/admin/live" className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <Calendar className="w-5 h-5 mr-2" />
                      Schedule Live Class
                    </Button>
                  </Link>
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="w-5 h-5 mr-2" />
                    Manage Students
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <DollarSign className="w-5 h-5 mr-2" />
                    View Payments
                  </Button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-border">
              <div className="flex items-center justify-between mb-6">
                <h2>All Courses</h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Filter
                  </Button>
                  <Button variant="outline" size="sm">
                    Export
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Course
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Category
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Students
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Revenue
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Rating
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.map((course) => (
                      <tr key={course.id} className="border-b border-border hover:bg-accent/30">
                        <td className="py-4 px-4">
                          <div className="font-medium">{course.title}</div>
                          <div className="text-sm text-muted-foreground">{course.instructor_name || "Admin"}</div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm px-2 py-1 bg-[#5B47ED]/10 text-[#5B47ED] rounded">
                            {course.category || "Uncategorized"}
                          </span>
                        </td>
                        <td className="py-4 px-4">{course.students || 0}</td>
                        <td className="py-4 px-4 font-semibold">
                          ₹{((course.students || 0) * course.price).toLocaleString()}
                        </td>
                        <td className="py-4 px-4">{course.rating || 0}</td>
                        <td className="py-4 px-4">
                          <button className="p-2 hover:bg-accent rounded-lg transition-colors">
                            <MoreVertical className="w-5 h-5 text-muted-foreground" />
                          </button>
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
