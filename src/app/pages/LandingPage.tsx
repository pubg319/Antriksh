import { Link } from "react-router";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { Button } from "../components/Button";
import { CourseCard } from "../components/CourseCard";
import { courses } from "../data/courses";
import { GraduationCap, Users, Award, TrendingUp, Star } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

export function LandingPage() {
  const featuredCourses = courses.slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="bg-gradient-to-br from-[#5B47ED]/10 via-background to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl md:text-6xl mb-6 leading-tight">
                Learn Without Limits
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Welcome to Antriksh Technical Academy—a center of excellence in technical education. Our goal is not merely to impart bookish knowledge to students, but to prepare them for the real-world challenges of the industry.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/courses">
                  <Button size="lg">Explore Courses</Button>
                </Link>
              </div>
              <div className="mt-12 grid grid-cols-3 gap-8">
                <div>
                  <div className="text-3xl font-semibold text-[#5B47ED] mb-1">50+</div>
                  <div className="text-sm text-muted-foreground">Students</div>
                </div>
                <div>
                  <div className="text-3xl font-semibold text-[#5B47ED] mb-1">9</div>
                  <div className="text-sm text-muted-foreground">Courses</div>
                </div>
                <div>
                  <div className="text-3xl font-semibold text-[#5B47ED] mb-1">3</div>
                  <div className="text-sm text-muted-foreground">Instructors</div>
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              <ImageWithFallback
                src="/logo.png"
                alt="Students learning"
                className="rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="mb-4">Featured Courses</h2>
          <p className="text-muted-foreground">Start learning with our most popular courses</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {featuredCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
        <div className="text-center">
          <Link to="/courses">
            <Button variant="outline" size="lg">
              View All Courses
            </Button>
          </Link>
        </div>
      </section>

      <section className="bg-accent/30 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="mb-4">Why Choose LearnHub</h2>
            <p className="text-muted-foreground">Everything you need to succeed in your learning journey</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#5B47ED]/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="w-8 h-8 text-[#5B47ED]" />
              </div>
              <h3 className="mb-2">Expert Instructors</h3>
              <p className="text-sm text-muted-foreground">Learn from industry professionals with real-world experience</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#5B47ED]/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-[#5B47ED]" />
              </div>
              <h3 className="mb-2">Active Community</h3>
              <p className="text-sm text-muted-foreground">Connect with learners</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#5B47ED]/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-[#5B47ED]" />
              </div>
              <h3 className="mb-2">Certifications</h3>
              <p className="text-sm text-muted-foreground">Earn recognized certificates upon completion</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#5B47ED]/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-[#5B47ED]" />
              </div>
              <h3 className="mb-2">Lifetime Access</h3>
              <p className="text-sm text-muted-foreground">Learn at your own pace with unlimited access</p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="mb-4">What Our Students Say</h2>
          <p className="text-muted-foreground">Join thousands of satisfied learners</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              name: "Alex Morgan",
              role: "Software Developer",
              image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
              text: "LearnHub transformed my career. The courses are practical, well-structured, and taught by experts who truly care about student success.",
            },
            {
              name: "Priya Sharma",
              role: "Data Analyst",
              image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
              text: "The quality of instruction is outstanding. I've taken multiple courses and each one has exceeded my expectations. Highly recommended!",
            },
            {
              name: "James Chen",
              role: "UX Designer",
              image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
              text: "Best investment in my education. The community support and instructor feedback made all the difference in my learning journey.",
            },
          ].map((testimonial, index) => (
            <div key={index} className="bg-white rounded-xl p-6 border border-border">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-muted-foreground mb-6">{testimonial.text}</p>
              <div className="flex items-center gap-3">
                <ImageWithFallback
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <div className="font-medium">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
