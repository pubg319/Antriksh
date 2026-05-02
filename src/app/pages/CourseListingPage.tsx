import { useState, useEffect } from "react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { CourseCard } from "../components/CourseCard";
import { Search } from "lucide-react";
import { supabase } from "../lib/supabase";
import { Course } from "../data/courses"; // keep types

export function CourseListingPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedLevel, setSelectedLevel] = useState("All");

  useEffect(() => {
    async function fetchCourses() {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("is_published", true);
      
      if (!error && data) {
        setCourses(data as unknown as Course[]);
      }
      setLoading(false);
    }
    fetchCourses();
  }, []);

  const categories = ["All", ...Array.from(new Set(courses.map((c) => c.category)))];
  const levels = ["All", "Beginner", "Intermediate", "Advanced"];

  const filteredCourses = courses.filter((course) => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || course.category === selectedCategory;
    const matchesLevel = selectedLevel === "All" || course.level === selectedLevel;
    return matchesSearch && matchesCategory && matchesLevel;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="bg-gradient-to-br from-[#5B47ED]/10 to-background py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="mb-4">Explore Courses</h1>
          <p className="text-muted-foreground mb-8">
            Discover your next learning adventure from our extensive course library
          </p>

          <div className="bg-white rounded-xl p-6 border border-border">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="md:col-span-2 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B47ED]/20"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B47ED]/20"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category === "All" ? "All Categories" : category}
                  </option>
                ))}
              </select>

              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B47ED]/20"
              >
                {levels.map((level) => (
                  <option key={level} value={level}>
                    {level === "All" ? "All Levels" : level}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6">
          <p className="text-muted-foreground">
            Showing {filteredCourses.length} {filteredCourses.length === 1 ? "course" : "courses"}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {filteredCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>

        {filteredCourses.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground">No courses found matching your criteria</p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
