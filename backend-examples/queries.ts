import { createClient } from "@supabase/supabase-js";

// Assuming you have an authenticated user context on the client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Fetch a published course with its modules and lessons
 */
export async function getPublishedCourseDetails(courseId: string) {
  const { data, error } = await supabase
    .from("courses")
    .select(`
      *,
      modules (
        id,
        title,
        position,
        lessons (
          id,
          title,
          description,
          position,
          is_preview,
          mux_playback_id
        )
      )
    `)
    .eq("id", courseId)
    .eq("is_published", true)
    .order("position", { referencedTable: "modules" })
    .order("position", { referencedTable: "modules.lessons" })
    .single();

  if (error) throw error;
  return data;
}

/**
 * Fetch user's enrolled courses
 */
export async function getUserEnrollments(userId: string) {
  const { data, error } = await supabase
    .from("enrollments")
    .select(`
      id,
      created_at,
      courses (
        id,
        title,
        thumbnail,
        description
      )
    `)
    .eq("user_id", userId);

  if (error) throw error;
  return data;
}

/**
 * Mark a lesson as complete (upsert progress)
 */
export async function markLessonComplete(userId: string, lessonId: string) {
  const { data, error } = await supabase
    .from("progress")
    .upsert(
      { 
        user_id: userId, 
        lesson_id: lessonId, 
        completed: true,
        updated_at: new Date().toISOString()
      },
      { onConflict: "user_id, lesson_id" }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Fetch course progress percentage for a user
 */
export async function getCourseProgress(userId: string, courseId: string) {
  // 1. Get total number of lessons for the course
  const { count: totalLessons, error: lessonError } = await supabase
    .from("lessons")
    .select("id", { count: "exact" })
    .eq("modules.course_id", courseId);

  // 2. Get number of completed lessons for the user in this course
  const { count: completedLessons, error: progressError } = await supabase
    .from("progress")
    .select("id", { count: "exact" })
    .eq("user_id", userId)
    .eq("completed", true)
    // We need to join with lessons to filter by course
    // Note: Supabase JS syntax for filtering through relations
    .not("lessons.modules.course_id", "is", null)
    .eq("lessons.modules.course_id", courseId);

  if (lessonError || progressError) {
    throw new Error("Failed to fetch progress");
  }

  const percentage = totalLessons === 0 ? 0 : Math.round((completedLessons! / totalLessons!) * 100);
  
  return {
    totalLessons,
    completedLessons,
    percentage
  };
}
