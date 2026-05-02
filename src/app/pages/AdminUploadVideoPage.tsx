import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { Navbar } from "../components/Navbar";
import { Sidebar } from "../components/Sidebar";
import { Button } from "../components/Button";
import { supabase } from "../lib/supabase";
import { TrendingUp, BookOpen, Users, DollarSign, UploadCloud, Video, Plus, Trash } from "lucide-react";

export function AdminUploadVideoPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedModule, setSelectedModule] = useState("");
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonDescription, setLessonDescription] = useState("");
  const [lessonNotes, setLessonNotes] = useState("");
  const [resourceLinks, setResourceLinks] = useState<{ title: string; url: string }[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addResourceField = () => {
    setResourceLinks([...resourceLinks, { title: "", url: "" }]);
  };

  const updateResource = (index: number, field: "title" | "url", value: string) => {
    const newResources = [...resourceLinks];
    newResources[index][field] = value;
    setResourceLinks(newResources);
  };

  const removeResource = (index: number) => {
    setResourceLinks(resourceLinks.filter((_, i) => i !== index));
  };

  const sidebarItems = [
    { path: "/admin", label: "Dashboard", icon: TrendingUp },
    { path: "/admin/courses", label: "Courses", icon: BookOpen },
    { path: "/admin/students", label: "Students", icon: Users },
    { path: "/admin/payments", label: "Payments", icon: DollarSign },
  ];

  useEffect(() => {
    async function fetchCourses() {
      const { data } = await supabase.from("courses").select("id, title");
      if (data) setCourses(data);
    }
    fetchCourses();
  }, []);

  useEffect(() => {
    async function fetchModules() {
      if (!selectedCourse) {
        setModules([]);
        return;
      }
      const { data } = await supabase.from("modules").select("id, title").eq("course_id", selectedCourse);
      if (data) setModules(data);
    }
    fetchModules();
  }, [selectedCourse]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModule || !lessonTitle || !videoFile) {
      alert("Please fill in all required fields and select a video.");
      return;
    }

    try {
      setUploading(true);
      setProgress(10);

      // 1. Request Direct Upload URL from Edge Function
      const { data: uploadData, error: functionError } = await supabase.functions.invoke('cloudflare-upload', {
        body: { uploadLength: videoFile.size }
      });

      if (functionError) {
        console.error("Function Error Details:", functionError);
        let errorMsg = "Unknown Error";
        
        try {
          const body = await functionError.context.json();
          errorMsg = body.error || JSON.stringify(body);
        } catch (e) {
          errorMsg = functionError.message || JSON.stringify(functionError);
        }
        
        throw new Error(`Edge Function Error: ${errorMsg}`);
      }
      
      if (!uploadData?.uploadURL) {
        console.error("Upload Data missing URL:", uploadData);
        throw new Error(uploadData?.error || "Failed to get upload URL from Cloudflare");
      }

      setProgress(30);

      // 2. Upload the file to Cloudflare Stream using FormData
      const formData = new FormData();
      formData.append("file", videoFile);

      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", uploadData.uploadURL);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setProgress(30 + (percentComplete * 0.6));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(xhr.response);
          } else {
            reject(new Error("Video upload failed"));
          }
        };

        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.send(formData);
      });

      setProgress(95);

      // 3. Save the Lesson to Supabase
      const videoId = uploadData.uid;
      
      const { data: lessonData, error: dbError } = await supabase.from("lessons").insert({
        module_id: selectedModule,
        title: lessonTitle,
        description: lessonDescription,
        video_id: videoId,
        notes: lessonNotes,
        position: 1,
        is_preview: false
      }).select().single();

      if (dbError) throw dbError;

      // 4. Save Resource Links
      if (resourceLinks.length > 0 && lessonData) {
        const resourcesToInsert = resourceLinks
          .filter(r => r.title && r.url)
          .map(r => ({
            lesson_id: lessonData.id,
            title: r.title,
            url: r.url,
            type: r.url.endsWith(".pdf") ? "pdf" : "link"
          }));

        if (resourcesToInsert.length > 0) {
          const { error: resError } = await supabase.from("resources").insert(resourcesToInsert);
          if (resError) throw resError;
        }
      }

      setProgress(100);
      alert("Lesson created and resources saved successfully!");
      navigate("/admin/courses");

    } catch (error: any) {
      console.error(error);
      alert(error.message || "Failed to upload video");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="flex">
        <Sidebar items={sidebarItems} />

        <main className="flex-1 p-8">
          <div className="max-w-3xl mx-auto">
            <h1 className="mb-2">Upload Lesson Video</h1>
            <p className="text-muted-foreground mb-8">Add a new video lesson to an existing course module.</p>

            <form onSubmit={handleUpload} className="bg-white rounded-xl p-8 border border-border space-y-6">
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Course *</label>
                  <select 
                    value={selectedCourse} 
                    onChange={e => setSelectedCourse(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                    required
                  >
                    <option value="">-- Choose a Course --</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Module *</label>
                  <select 
                    value={selectedModule} 
                    onChange={e => setSelectedModule(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                    required
                    disabled={!selectedCourse || modules.length === 0}
                  >
                    <option value="">-- Choose a Module --</option>
                    {modules.map(m => (
                      <option key={m.id} value={m.id}>{m.title}</option>
                    ))}
                  </select>
                  {selectedCourse && modules.length === 0 && (
                    <p className="text-xs text-red-500">This course has no modules. Create one first.</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Lesson Title *</label>
                <input 
                  type="text" 
                  value={lessonTitle}
                  onChange={e => setLessonTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background" 
                  placeholder="e.g. Introduction to React"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Lesson Description</label>
                <textarea 
                  value={lessonDescription}
                  onChange={e => setLessonDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background min-h-[100px]" 
                  placeholder="Briefly describe what students will learn..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Study Notes (Markdown supported)</label>
                <textarea 
                  value={lessonNotes}
                  onChange={e => setLessonNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background min-h-[150px]" 
                  placeholder="Detailed notes for the lesson..."
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Resources & Links</label>
                  <Button type="button" variant="outline" size="sm" onClick={addResourceField}>
                    <Plus className="w-4 h-4 mr-1" /> Add Resource
                  </Button>
                </div>
                {resourceLinks.map((res, index) => (
                  <div key={index} className="flex gap-4 items-end animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="flex-1 space-y-1">
                      <input 
                        type="text" 
                        value={res.title}
                        onChange={e => updateResource(index, "title", e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-lg text-sm" 
                        placeholder="e.g. PDF Guide"
                      />
                    </div>
                    <div className="flex-[2] space-y-1">
                      <input 
                        type="text" 
                        value={res.url}
                        onChange={e => updateResource(index, "url", e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-lg text-sm" 
                        placeholder="https://..."
                      />
                    </div>
                    <Button type="button" variant="outline" size="sm" className="text-red-500 hover:bg-red-50" onClick={() => removeResource(index)}>
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Video File (.mp4) *</label>
                <div 
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${videoFile ? 'border-[#5B47ED] bg-[#5B47ED]/5' : 'border-border hover:bg-accent/50 cursor-pointer'}`}
                  onClick={() => !videoFile && fileInputRef.current?.click()}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    accept="video/mp4,video/x-m4v,video/*"
                    className="hidden"
                    onChange={e => e.target.files?.[0] && setVideoFile(e.target.files[0])}
                  />
                  
                  {videoFile ? (
                    <div className="flex flex-col items-center">
                      <Video className="w-12 h-12 text-[#5B47ED] mb-3" />
                      <p className="font-medium text-foreground">{videoFile.name}</p>
                      <p className="text-sm text-muted-foreground mb-4">{(videoFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                      <Button type="button" variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setVideoFile(null); }}>
                        Remove File
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <UploadCloud className="w-12 h-12 text-muted-foreground mb-3" />
                      <p className="font-medium text-foreground mb-1">Click to select a video file</p>
                      <p className="text-sm text-muted-foreground">MP4, MOV, or WebM up to 5GB</p>
                    </div>
                  )}
                </div>
              </div>

              {uploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm font-medium">
                    <span>Uploading to Cloudflare...</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-[#5B47ED] h-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="pt-4 flex items-center justify-end gap-4 border-t border-border">
                <Button type="button" variant="outline" onClick={() => navigate("/admin/courses")} disabled={uploading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={uploading || !videoFile}>
                  {uploading ? "Uploading..." : "Upload & Save Lesson"}
                </Button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
