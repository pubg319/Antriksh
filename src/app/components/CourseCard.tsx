import { Link } from "react-router";
import { Star, Users, Clock } from "lucide-react";
import { Button } from "./Button";
import { Course } from "../data/courses";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface CourseCardProps {
  course: Course;
  showProgress?: boolean;
}

export function CourseCard({ course, showProgress }: CourseCardProps) {
  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <Link to={`/course/${course.id}`}>
        <ImageWithFallback
          src={course.thumbnail}
          alt={course.title}
          className="w-full h-48 object-cover"
        />
      </Link>

      <div className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs px-2 py-1 bg-[#5B47ED]/10 text-[#5B47ED] rounded">
            {course.category}
          </span>
          <span className="text-xs text-muted-foreground">{course.level}</span>
        </div>

        <Link to={`/course/${course.id}`}>
          <h3 className="mb-2 hover:text-[#5B47ED] transition-colors line-clamp-2">
            {course.title}
          </h3>
        </Link>

        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {course.description}
        </p>

        <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span>{course.rating || "0.0"}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{(course.students || 0).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{course.duration || "Self-paced"}</span>
          </div>
        </div>

        {showProgress && course.progress !== undefined ? (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1 text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{course.progress}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-[#5B47ED] h-2 rounded-full transition-all"
                style={{ width: `${course.progress}%` }}
              />
            </div>
          </div>
        ) : null}

        <div className="flex items-center justify-between">
          <span className="text-2xl font-semibold">${course.price}</span>
          {showProgress ? (
            <Link to={`/learn/${course.id}`}>
              <Button size="sm">Continue</Button>
            </Link>
          ) : (
            <Link to={`/course/${course.id}`}>
              <Button size="sm" variant="outline">
                View Course
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
