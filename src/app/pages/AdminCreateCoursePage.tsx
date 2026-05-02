import { useState } from "react";
import { useNavigate } from "react-router";
import { Navbar } from "../components/Navbar";
import { Sidebar } from "../components/Sidebar";
import { Button } from "../components/Button";
import { TrendingUp, BookOpen, Users, DollarSign, Upload, Image as ImageIcon } from "lucide-react";
import { supabase } from "../lib/supabase";

export function AdminCreateCoursePage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [category, setCategory] = useState("Web Development");
  const [level, setLevel] = useState("Beginner");
  const [instructorName, setInstructorName] = useState("");
  const [instructorBio, setInstructorBio] = useState("");
  const [instructorAvatarFile, setInstructorAvatarFile] = useState<File | null>(null);
  const [instructorAvatarPreview, setInstructorAvatarPreview] = useState<string | null>(null);

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sidebarItems = [
    { path: "/admin", label: "Dashboard", icon: TrendingUp },
    { path: "/admin/courses", label: "Courses", icon: BookOpen },
    { path: "/admin/students", label: "Students", icon: Users },
    { path: "/admin/payments", label: "Payments", icon: DollarSign },
  ];

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
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be logged in as an admin");

      let thumbnailUrl = "";

      // 1. Upload Thumbnail
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

        thumbnailUrl = publicUrl;
      }

      // 2. Upload Instructor Avatar
      let instructorAvatarUrl = "";
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

        instructorAvatarUrl = publicUrl;
      }

      // 3. Insert Course
      const { error: insertError } = await supabase
        .from("courses")
        .insert({
          title,
          description,
          price: parseInt(price, 10),
          category,
          thumbnail: thumbnailUrl,
          instructor_name: instructorName,
          instructor_avatar: instructorAvatarUrl,
          instructor_bio: instructorBio,
          is_published: isPublished,
        });

      if (insertError) throw insertError;

      alert("Course created successfully!");
      navigate("/admin");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to create course");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="flex">
        <Sidebar items={sidebarItems} />

        <main className="flex-1 p-8">
          <div className="max-w-3xl mx-auto">
            <h1 className="mb-2">Create New Course</h1>
            <p className="text-muted-foreground mb-8">Add a new course to your platform</p>

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
                    placeholder="e.g. Advanced React Patterns"
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
                    placeholder="Describe what students will learn..."
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
                      placeholder="0"
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
                      placeholder="e.g. Dr. Jane Smith"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Instructor Avatar</label>
                    <div className="flex items-center gap-4">
                      {instructorAvatarPreview ? (
                        <img src={instructorAvatarPreview} alt="Avatar Preview" className="w-12 h-12 rounded-full object-cover border border-border" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center border border-border">
                          <Users className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                      <label className="cursor-pointer bg-white px-3 py-1 border border-border rounded-lg text-sm font-medium hover:bg-accent transition-colors">
                        Choose File
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
                    placeholder="Short bio about the instructor..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Course Thumbnail</label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-border border-dashed rounded-lg hover:bg-accent/30 transition-colors relative overflow-hidden">
                    {thumbnailPreview ? (
                      <div className="absolute inset-0 w-full h-full">
                        <img src={thumbnailPreview} alt="Preview" className="w-full h-full object-cover opacity-50" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Button type="button" variant="outline" onClick={() => { setThumbnailFile(null); setThumbnailPreview(null); }}>
                            Remove Image
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1 text-center">
                        <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                        <div className="flex text-sm text-muted-foreground justify-center">
                          <label
                            htmlFor="file-upload"
                            className="relative cursor-pointer bg-white rounded-md font-medium text-[#5B47ED] hover:text-[#4938D6] focus-within:outline-none"
                          >
                            <span>Upload a file</span>
                            <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleFileChange} required />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
                      </div>
                    )}
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
                    Publish Course Immediately
                  </label>
                </div>

                <div className="pt-4 flex justify-end gap-4 border-t border-border">
                  <Button type="button" variant="outline" onClick={() => navigate("/admin")}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Creating..." : "Create Course"}
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
