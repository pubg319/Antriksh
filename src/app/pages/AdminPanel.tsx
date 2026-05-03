import { useState, useEffect } from "react";
import { Link } from "react-router";
import { DashboardLayout } from "../components/DashboardLayout";
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
  Edit2,
} from "lucide-react";

export function AdminPanel() {
  const [courses, setCourses] = useState<any[]>([]);
  const [activeStudents, setActiveStudents] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      const { data: coursesData } = await supabase.from("courses").select("*").order("created_at", { ascending: false });
      if (coursesData) setCourses(coursesData);

      const { count: studentCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "student");
      setActiveStudents(studentCount || 0);

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
    { label: "Total Revenue", value: `₹${totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-green-600", bg: "bg-green-50" },
    { label: "Active Students", value: activeStudents.toLocaleString(), icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Total Courses", value: courses.length.toString(), icon: BookOpen, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Avg. Rating", value: "4.7", icon: TrendingUp, color: "text-orange-600", bg: "bg-orange-50" },
  ];

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center font-medium">Loading Stats...</div>;
  }

  return (
    <DashboardLayout sidebarItems={sidebarItems}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl mb-1">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your courses and students</p>
        </div>
        <Link to="/admin/courses/new">
          <Button className="w-full md:w-auto shadow-lg shadow-[#5B47ED]/20">
            <Plus className="w-5 h-5 mr-2" />
            Create Course
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-2xl p-6 border border-border shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
              <div className="text-2xl md:text-3xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-border shadow-sm">
          <h2 className="text-lg font-bold mb-6">Recent Courses</h2>
          <div className="space-y-4">
            {courses.slice(0, 5).map((course) => (
              <div
                key={course.id}
                className="flex items-center justify-between p-4 rounded-xl hover:bg-accent/50 transition-colors border border-transparent hover:border-border"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-accent rounded-xl flex items-center justify-center flex-shrink-0">
                    <Video className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h4 className="font-bold mb-1 line-clamp-1">{course.title}</h4>
                    <p className="text-sm text-muted-foreground font-medium">
                      {course.students || 0} students
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <div className="font-bold">₹{course.price}</div>
                    <div className="text-xs text-muted-foreground font-medium">
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

        <div className="bg-white rounded-2xl p-6 border border-border shadow-sm">
          <h2 className="text-lg font-bold mb-6">Quick Actions</h2>
          <div className="space-y-3">
            <Link to="/admin/courses/new" className="block">
              <Button variant="outline" className="w-full justify-start rounded-xl font-bold">
                <Plus className="w-5 h-5 mr-2" />
                Create New Course
              </Button>
            </Link>
            <Link to="/admin/upload-video" className="block">
              <Button variant="outline" className="w-full justify-start rounded-xl font-bold">
                <Video className="w-5 h-5 mr-2" />
                Upload Video
              </Button>
            </Link>
            <Link to="/admin/modules/new" className="block">
              <Button variant="outline" className="w-full justify-start rounded-xl font-bold">
                <Layers className="w-5 h-5 mr-2" />
                Create Module
              </Button>
            </Link>
            <Link to="/admin/live" className="block">
              <Button variant="outline" className="w-full justify-start rounded-xl font-bold">
                <Calendar className="w-5 h-5 mr-2" />
                Schedule Live Class
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-border shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-lg font-bold">Course Performance</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="rounded-lg font-bold">
              Filter
            </Button>
            <Button variant="outline" size="sm" className="rounded-lg font-bold">
              Export
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-bold text-muted-foreground uppercase tracking-wider">
                  Course
                </th>
                <th className="text-left py-3 px-4 text-sm font-bold text-muted-foreground uppercase tracking-wider">
                  Category
                </th>
                <th className="text-left py-3 px-4 text-sm font-bold text-muted-foreground uppercase tracking-wider">
                  Students
                </th>
                <th className="text-left py-3 px-4 text-sm font-bold text-muted-foreground uppercase tracking-wider">
                  Revenue
                </th>
                <th className="text-left py-3 px-4 text-sm font-bold text-muted-foreground uppercase tracking-wider">
                  Rating
                </th>
                <th className="text-left py-3 px-4 text-sm font-bold text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course.id} className="border-b border-border hover:bg-accent/30 transition-colors">
                  <td className="py-4 px-4">
                    <div className="font-bold text-foreground">{course.title}</div>
                    <div className="text-xs text-muted-foreground font-medium">{course.instructor_name || "Admin"}</div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-[10px] font-bold px-2.5 py-1 bg-[#5B47ED]/10 text-[#5B47ED] rounded-full uppercase tracking-wider">
                      {course.category || "Uncategorized"}
                    </span>
                  </td>
                  <td className="py-4 px-4 font-medium">{course.students || 0}</td>
                  <td className="py-4 px-4 font-bold text-foreground">
                    ₹{((course.students || 0) * course.price).toLocaleString()}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1 font-bold">
                      <span className="text-orange-500 text-lg">★</span>
                      {course.rating || 0}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <Link to={`/admin/courses/content/${course.id}`} title="Manage Content">
                        <button className="p-2 hover:bg-[#5B47ED]/10 rounded-lg transition-colors text-[#5B47ED]">
                          <Layers className="w-5 h-5" />
                        </button>
                      </Link>
                      <Link to={`/admin/courses/edit/${course.id}`} title="Edit Settings">
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
    </DashboardLayout>
  );
}
