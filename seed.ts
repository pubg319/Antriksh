import { createClient } from '@supabase/supabase-js';
import { courses } from './src/app/data/courses.js'; // Ensure to run with ts-node or compile first, or we can just copy the data

// Using the keys from your .env.local file
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// You MUST use the SERVICE_ROLE_KEY to bypass RLS for seeding. 
// Get this from your Supabase Dashboard -> Project Settings -> API
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; 

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seed() {
  console.log("🌱 Starting database seed...");

  for (const course of courses) {
    // 1. Insert Course
    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .insert({
        title: course.title,
        description: course.description,
        price: course.price,
        thumbnail: course.thumbnail,
        is_published: true, // Auto publish mock data
      })
      .select()
      .single();

    if (courseError) {
      console.error(`❌ Error inserting course ${course.title}:`, courseError.message);
      continue;
    }

    console.log(`✅ Inserted Course: ${course.title}`);

    // 2. Insert Modules for this course
    for (let m = 0; m < course.modules.length; m++) {
      const module = course.modules[m];
      const { data: moduleData, error: moduleError } = await supabase
        .from('modules')
        .insert({
          title: module.title,
          position: m,
          course_id: courseData.id,
        })
        .select()
        .single();

      if (moduleError) {
        console.error(`❌ Error inserting module ${module.title}:`, moduleError.message);
        continue;
      }

      // 3. Insert Lessons for this module
      for (let l = 0; l < module.lessons.length; l++) {
        const lesson = module.lessons[l];
        const { error: lessonError } = await supabase
          .from('lessons')
          .insert({
            title: lesson.title,
            description: "Lesson description goes here",
            position: l,
            is_preview: l === 0, // Make the first lesson of every module a preview
            module_id: moduleData.id,
            mux_playback_id: "example_playback_id" // Placeholder
          });

        if (lessonError) {
          console.error(`❌ Error inserting lesson ${lesson.title}:`, lessonError.message);
        }
      }
    }
  }

  console.log("🎉 Seeding complete!");
}

seed();
