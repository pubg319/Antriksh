import { useState, useEffect } from "react";
import { Navbar } from "../components/Navbar";
import { Sidebar } from "../components/Sidebar";
import { Button } from "../components/Button";
import { CourseCard } from "../components/CourseCard";
import { BookOpen, User, Settings, Video, Calendar, Clock } from "lucide-react";
import { supabase } from "../lib/supabase";

export function StudentDashboard() {
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [liveSessions, setLiveSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEnrollments() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch enrollments with course details
      const { data, error } = await supabase
        .from("enrollments")
        .select(`
          course_id,
          courses (*)
        `)
        .eq("user_id", user.id);
      
      if (!error && data) {
        // Fetch completed progress for this user
        const { data: progressData } = await supabase
          .from("progress")
          .select("lesson_id")
          .eq("user_id", user.id)
          .eq("completed", true);
          
        const completedSet = new Set(progressData?.map((p: any) => p.lesson_id) || []);

        // Fetch modules and lessons for enrolled courses to calculate totals
        const enrolledCourseIds = data.map((e: any) => e.course_id);
        const { data: modulesData } = await supabase
          .from("modules")
          .select("course_id, lessons(id)")
          .in("course_id", enrolledCourseIds);

        const coursesWithProgress = data.map((enrollment: any) => {
          const courseId = enrollment.course_id;
          const courseModules = modulesData?.filter((m: any) => m.course_id === courseId) || [];
          
          let totalLessons = 0;
          let completedLessons = 0;

          courseModules.forEach((m: any) => {
            if (m.lessons) {
              totalLessons += m.lessons.length;
              m.lessons.forEach((l: any) => {
                if (completedSet.has(l.id)) {
                  completedLessons++;
                }
              });
            }
          });

          const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

          return {
            ...enrollment.courses,
            progress: progressPercent
          };
        });
        
        setEnrolledCourses(coursesWithProgress);

        // Fetch Live Sessions for enrolled courses
        const { data: sessionsData } = await supabase
          .from("live_sessions")
          .select("*, courses(title)")
          .in("course_id", enrolledCourseIds)
          .gte("scheduled_at", new Date().toISOString())
          .order("scheduled_at", { ascending: true });
        
        if (sessionsData) setLiveSessions(sessionsData);
      }
      setLoading(false);
    }

    fetchEnrollments();
  }, []);

  const sidebarItems = [
    { path: "/dashboard", label: "My Courses", icon: BookOpen },
    { path: "/dashboard/profile", label: "Profile", icon: User },
    { path: "/dashboard/settings", label: "Settings", icon: Settings },
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
          <div className="max-w-6xl">
            <h1 className="mb-2">My Learning</h1>
            <p className="text-muted-foreground mb-8">
              Continue your learning journey
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              <div className="bg-white rounded-xl p-6 border border-border">
                <div className="text-3xl font-semibold text-[#5B47ED] mb-2">
                  {enrolledCourses.length}
                </div>
                <div className="text-muted-foreground">Enrolled Courses</div>
              </div>
              <div className="bg-white rounded-xl p-6 border border-border">
                <div className="text-3xl font-semibold text-[#5B47ED] mb-2">0</div>
                <div className="text-muted-foreground">Completed</div>
              </div>
              <div className="bg-white rounded-xl p-6 border border-border">
                <div className="text-3xl font-semibold text-[#5B47ED] mb-2">{liveSessions.length}</div>
                <div className="text-muted-foreground">Upcoming Lives</div>
              </div>
            </div>

            {/* Live Sessions Section */}
            {liveSessions.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    Upcoming Live Sessions
                  </h2>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {liveSessions.map((session) => (
                    <div key={session.id} className="bg-white border border-border rounded-2xl p-5 hover:border-[#5B47ED] hover:shadow-lg transition-all group">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-[#5B47ED]/10 rounded-xl flex items-center justify-center">
                          <Video className="w-6 h-6 text-[#5B47ED]" />
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-[#5B47ED] uppercase tracking-wider">
                            {session.courses?.title}
                          </div>
                          <h4 className="font-bold line-clamp-1">{session.title}</h4>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-5">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(session.scheduled_at).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(session.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <a href={session.meeting_url} target="_blank" rel="noopener noreferrer">
                        <Button className="w-full rounded-xl">Join Now</Button>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-6">
              <h2 className="mb-4">Continue Learning</h2>
            </div>

            {enrolledCourses.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {enrolledCourses.map((course) => (
                  <CourseCard key={course.id} course={course} showProgress />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl p-12 border border-border text-center">
                <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="mb-2">No enrolled courses yet</h3>
                <p className="text-muted-foreground mb-6">
                  Start your learning journey by exploring our courses
                </p>
                <a href="/courses" className="inline-block px-6 py-3 bg-[#5B47ED] text-white rounded-lg hover:bg-[#4938D6] transition-colors">
                  Browse Courses
                </a>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
