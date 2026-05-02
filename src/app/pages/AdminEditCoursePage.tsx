import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { Navbar } from "../components/Navbar";
import { Sidebar } from "../components/Sidebar";
import { Button } from "../components/Button";
import { TrendingUp, BookOpen, Users, DollarSign, Image as ImageIcon, ArrowLeft } from "lucide-react";
import { supabase } from "../lib/supabase";

export function AdminEditCoursePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [category, setCategory] = useState("Web Development");
  const [level, setLevel] = useState("Beginner");
  const [instructorName, setInstructorName] = useState("");
  const [instructorBio, setInstructorBio] = useState("");
  const [instructorAvatarUrl, setInstructorAvatarUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");

  const [instructorAvatarFile, setInstructorAvatarFile] = useState<File | null>(null);
  const [instructorAvatarPreview, setInstructorAvatarPreview] = useState<string | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sidebarItems = [
    { path: "/admin", label: "Dashboard", icon: TrendingUp },
    { path: "/admin/courses", label: "Courses", icon: BookOpen },
    { path: "/admin/students", label: "Students", icon: Users },
    { path: "/admin/payments", label: "Payments", icon: DollarSign },
  ];

  useEffect(() => {
    async function fetchCourse() {
      if (!id) return;
      try {
        const { data, error } = await supabase
          .from("courses")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;
        if (data) {
          setTitle(data.title);
          setDescription(data.description);
          setPrice(data.price.toString());
          setIsPublished(data.is_published);
          setCategory(data.category);
          setLevel(data.level || "Beginner");
          setInstructorName(data.instructor_name || "");
          setInstructorBio(data.instructor_bio || "");
          setInstructorAvatarUrl(data.instructor_avatar || "");
          setThumbnailUrl(data.thumbnail || "");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchCourse();
  }, [id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setInstructorAvatarFile(file);
      setInstructorAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be logged in as an admin");

      let finalThumbnailUrl = thumbnailUrl;
      let finalInstructorAvatarUrl = instructorAvatarUrl;

      // 1. Upload Thumbnail if changed
      if (thumbnailFile) {
        const fileExt = thumbnailFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('course_thumbnails')
          .upload(filePath, thumbnailFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('course_thumbnails')
          .getPublicUrl(filePath);

        finalThumbnailUrl = publicUrl;
      }

      // 2. Upload Instructor Avatar if changed
      if (instructorAvatarFile) {
        const fileExt = instructorAvatarFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/instructor_${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, instructorAvatarFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        finalInstructorAvatarUrl = publicUrl;
      }

      // 3. Update Course
      const { error: updateError } = await supabase
        .from("courses")
        .update({
          title,
          description,
          price: parseInt(price, 10),
          category,
          level,
          thumbnail: finalThumbnailUrl,
          instructor_name: instructorName,
          instructor_avatar: finalInstructorAvatarUrl,
          instructor_bio: instructorBio,
          is_published: isPublished,
        })
        .eq("id", id);

      if (updateError) throw updateError;

      alert("Course updated successfully!");
      navigate("/admin/courses");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to update course");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center">Loading Course Data...</div>;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="flex">
        <Sidebar items={sidebarItems} />

        <main className="flex-1 p-8">
          <div className="max-w-3xl mx-auto">
            <button 
              onClick={() => navigate("/admin/courses")}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Courses
            </button>
            
            <h1 className="mb-2">Edit Course</h1>
            <p className="text-muted-foreground mb-8">Update course information and settings</p>

            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg border border-red-100">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-border p-8 shadow-sm">
              <div className="space-y-6">

                <div>
                  <label className="block text-sm font-medium mb-2">Course Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B47ED]/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    required
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B47ED]/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Price (₹)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B47ED]/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B47ED]/50"
                    >
                      <option value="Web Development">Gov exams</option>
                      <option value="Data Science">Data Science</option>
                      <option value="Design">Design</option>
                      <option value="Marketing">Marketing</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Instructor Name</label>
                    <input
                      type="text"
                      required
                      value={instructorName}
                      onChange={(e) => setInstructorName(e.target.value)}
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B47ED]/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Instructor Avatar</label>
                    <div className="flex items-center gap-4">
                      <img 
                        src={instructorAvatarPreview || instructorAvatarUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop"} 
                        alt="Avatar" 
                        className="w-12 h-12 rounded-full object-cover border border-border" 
                      />
                      <label className="cursor-pointer bg-white px-3 py-1 border border-border rounded-lg text-sm font-medium hover:bg-accent transition-colors">
                        Change Photo
                        <input type="file" className="sr-only" accept="image/*" onChange={handleAvatarChange} />
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Instructor Bio</label>
                  <textarea
                    rows={3}
                    value={instructorBio}
                    onChange={(e) => setInstructorBio(e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B47ED]/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Course Thumbnail</label>
                  <div className="mt-1 relative h-48 rounded-lg overflow-hidden border-2 border-border border-dashed hover:bg-accent/30 transition-colors">
                    <img 
                      src={thumbnailPreview || thumbnailUrl} 
                      alt="Thumbnail" 
                      className="w-full h-full object-cover opacity-60" 
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <label className="cursor-pointer bg-white px-4 py-2 border border-border rounded-lg shadow-sm font-medium hover:bg-accent transition-colors flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" />
                        Replace Thumbnail
                        <input type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 py-4 border-t border-border">
                  <input
                    type="checkbox"
                    id="isPublished"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="w-5 h-5 text-[#5B47ED] rounded border-border focus:ring-[#5B47ED]"
                  />
                  <label htmlFor="isPublished" className="font-medium cursor-pointer">
                    Course is Published
                  </label>
                </div>

                <div className="pt-4 flex justify-end gap-4 border-t border-border">
                  <Button type="button" variant="outline" onClick={() => navigate("/admin/courses")}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving Changes..." : "Save Changes"}
                  </Button>
                </div>

              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
