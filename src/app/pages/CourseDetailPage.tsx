import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { Button } from "../components/Button";
import { Star, Users, Clock, Award, PlayCircle, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { supabase } from "../lib/supabase";
import { useRazorpay } from "react-razorpay";

export function CourseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [openModules, setOpenModules] = useState<Set<string>>(new Set());
  const { Razorpay } = useRazorpay();
  const [reviews, setReviews] = useState<any[]>([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState("");
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  useEffect(() => {
    async function fetchCourse() {
      if (!id) return;

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
              video_id
            )
          )
        `)
        .eq("id", id)
        .single();

      if (!error && data) {
        // Sort modules and lessons
        data.modules.sort((a: any, b: any) => a.position - b.position);
        data.modules.forEach((m: any) => m.lessons.sort((a: any, b: any) => a.position - b.position));

        setCourse(data);
        if (data.modules?.[0]) {
          setOpenModules(new Set([data.modules[0].id]));
        }
      }
      setLoading(false);
    }

    async function checkEnrollmentAndFetchReviews() {
      if (!id) return;
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: enrollment } = await supabase
          .from("enrollments")
          .select("id")
          .eq("user_id", user.id)
          .eq("course_id", id)
          .single();
        setIsEnrolled(!!enrollment);
      }

      const { data: reviewsData } = await supabase
        .from("reviews")
        .select(`
          *,
          profiles (name, avatar_url)
        `)
        .eq("course_id", id)
        .order("created_at", { ascending: false });
      
      if (reviewsData) setReviews(reviewsData);
    }

    fetchCourse();
    checkEnrollmentAndFetchReviews();
  }, [id]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("Please login to review");
    
    setSubmittingReview(true);
    try {
      const { error } = await supabase.from("reviews").insert({
        course_id: id,
        user_id: user.id,
        rating: reviewRating,
        comment: reviewComment
      });

      if (error) throw error;
      
      alert("Review submitted!");
      setReviewComment("");
      // Refresh reviews
      const { data } = await supabase.from("reviews").select("*, profiles(name, avatar_url)").eq("course_id", id);
      if (data) setReviews(data);
    } catch (err: any) {
      alert(err.message || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleEnroll = async () => {
    try {
      setEnrolling(true);

      // 1. Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // Redirect to login or show modal
        alert("Please login to enroll");
        setEnrolling(false);
        return;
      }

      // 2. Call Edge Function to create order
      const { data: orderData, error: functionError } = await supabase.functions.invoke('create-order', {
        body: { 
          courseId: course.id, 
          userId: user.id,
          couponCode: appliedCoupon?.code
        }
      });

      if (functionError || !orderData) {
        throw new Error("Failed to create order");
      }

      // 3. Open Razorpay Modal
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "YOUR_KEY_ID",
        amount: orderData.amount,
        currency: orderData.currency,
        name: "LMS Platform",
        description: `Enrollment for ${course.title}`,
        order_id: orderData.orderId,
        handler: (response: any) => {
          // On success, Razorpay webhook handles fulfillment
          // We just redirect the user
          alert("Payment successful! Redirecting to dashboard...");
          navigate("/dashboard");
        },
        prefill: {
          name: user.user_metadata?.full_name || "",
          email: user.email || "",
        },
        theme: {
          color: "#5B47ED",
        },
      };

      const rzp = new Razorpay(options);
      rzp.open();

    } catch (error) {
      console.error("Enrollment failed", error);
      alert("Enrollment failed. Please try again.");
    } finally {
      setEnrolling(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setValidatingCoupon(true);
    setCouponError("");
    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", couponCode.toUpperCase())
        .single();
      
      if (error || !data) {
        setCouponError("Invalid or expired coupon");
        setAppliedCoupon(null);
        return;
      }
      
      setAppliedCoupon(data);
      alert("Coupon applied successfully!");
    } catch (err) {
      setCouponError("Failed to validate coupon");
    } finally {
      setValidatingCoupon(false);
    }
  };

  const calculateDiscountedPrice = () => {
    if (!appliedCoupon) return course.price;
    if (appliedCoupon.discount_type === 'percentage') {
      return Math.round(course.price * (1 - appliedCoupon.discount_value / 100));
    }
    return Math.max(0, course.price - appliedCoupon.discount_value);
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1>Course not found</h1>
          <Link to="/courses">
            <Button className="mt-4">Back to Courses</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const toggleModule = (moduleId: string) => {
    const newSet = new Set(openModules);
    if (newSet.has(moduleId)) {
      newSet.delete(moduleId);
    } else {
      newSet.add(moduleId);
    }
    setOpenModules(newSet);
  };

  const totalLessons = course.modules?.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0) || 0;
  const totalDuration = totalLessons * 5; // Estimating 5 min per lesson for now

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="bg-gradient-to-br from-[#5B47ED]/10 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm px-3 py-1 bg-[#5B47ED]/10 text-[#5B47ED] rounded">
                  {course.category}
                </span>
                <span className="text-sm text-muted-foreground">{course.level}</span>
              </div>

              <h1 className="mb-4">{course.title}</h1>

              <p className="text-lg text-muted-foreground mb-6">{course.description}</p>

              <div className="flex flex-wrap items-center gap-6 mb-6">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{course.rating}</span>
                  <span className="text-muted-foreground">(2,543 ratings)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-muted-foreground" />
                  <span>{course.students.toLocaleString()} students</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <span>{course.duration}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-8">
                <ImageWithFallback
                  src={course.instructor_avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop"}
                  alt={course.instructor_name || "Instructor"}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <div className="text-sm text-muted-foreground">Instructor</div>
                  <div className="font-semibold text-lg">{course.instructor_name || "Expert Instructor"}</div>
                </div>
              </div>
            </div>

            <div className="md:sticky md:top-20 h-fit">
              <div className="bg-white rounded-xl border border-border overflow-hidden">
                <div className="relative">
                  <ImageWithFallback
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <PlayCircle className="w-16 h-16 text-white" />
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="text-3xl font-semibold">
                      ₹{calculateDiscountedPrice()}
                    </div>
                    {appliedCoupon && (
                      <div className="text-lg text-muted-foreground line-through">
                        ₹{course.price}
                      </div>
                    )}
                  </div>

                  <div className="mb-6 space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Coupon Code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5B47ED]/50 uppercase"
                      />
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={handleApplyCoupon}
                        disabled={validatingCoupon}
                      >
                        {validatingCoupon ? "..." : "Apply"}
                      </Button>
                    </div>
                    {couponError && <p className="text-xs text-red-500">{couponError}</p>}
                    {appliedCoupon && <p className="text-xs text-green-500">Coupon applied: {appliedCoupon.discount_type === 'percentage' ? `${appliedCoupon.discount_value}% off` : `₹${appliedCoupon.discount_value} off`}</p>}
                  </div>

                  <Button
                    size="lg"
                    className="w-full mb-3"
                    onClick={handleEnroll}
                    disabled={enrolling}
                  >
                    {enrolling ? "Processing..." : "Enroll Now"}
                  </Button>

                  <Button size="lg" variant="outline" className="w-full">
                    Add to Wishlist
                  </Button>

                  <div className="mt-6 pt-6 border-t border-border space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Award className="w-5 h-5 text-[#5B47ED]" />
                      <span>Certificate of completion</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Clock className="w-5 h-5 text-[#5B47ED]" />
                      <span>Lifetime access</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Users className="w-5 h-5 text-[#5B47ED]" />
                      <span>Access on mobile and desktop</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <div className="bg-white rounded-xl p-8 border border-border mb-8">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-2">
                <h2>Course Curriculum</h2>
                <div className="text-sm text-muted-foreground">
                  {course.modules.length} sections • {totalLessons} lessons • {totalDuration}m total length
                </div>
              </div>
              <div className="space-y-4">
                {course.modules.length > 0 ? (
                  course.modules.map((module: any, index: number) => {
                    const isOpen = openModules.has(module.id);
                    return (
                      <div key={module.id} className="border border-border rounded-lg overflow-hidden">
                        <button
                          onClick={() => toggleModule(module.id)}
                          className="w-full bg-accent/30 hover:bg-accent/50 px-6 py-4 flex items-center justify-between transition-colors text-left"
                        >
                          <div>
                            <h3 className="text-base font-semibold">Section {index + 1}: {module.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {module.lessons.length} lessons • {module.lessons.length * 5}min
                            </p>
                          </div>
                          {isOpen ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                        </button>
                        {isOpen && (
                          <div className="divide-y divide-border bg-white">
                            {module.lessons.map((lesson: any) => (
                              <div key={lesson.id} className="px-6 py-4 flex items-center justify-between hover:bg-accent/20 transition-colors">
                                <div className="flex items-start gap-3">
                                  <PlayCircle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                                  <span className="text-sm">{lesson.title}</span>
                                </div>
                                <span className="text-xs text-muted-foreground ml-4 whitespace-nowrap flex-shrink-0">5:00</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-muted-foreground">Course curriculum will be available soon.</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl p-8 border border-border">
              <h2 className="mb-6">About the Instructor</h2>
              <div className="flex items-start gap-6">
                <ImageWithFallback
                  src={course.instructor_avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop"}
                  alt={course.instructor_name || "Instructor"}
                  className="w-24 h-24 rounded-full object-cover"
                />
                <div>
                  <h3 className="mb-2">{course.instructor_name || "Expert Instructor"}</h3>
                  <p className="text-muted-foreground">{course.instructor_bio || "Expert instructor with years of industry experience."}</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="bg-white rounded-xl p-6 border border-border">
              <h3 className="mb-4">What you'll learn</h3>
              <ul className="space-y-3">
                {[
                  "Master the fundamentals and advanced concepts",
                  "Problem-solving and critical thinking",
                  "Career guidance and support",
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-3 text-sm">
                    <CheckCircle className="w-5 h-5 text-[#5B47ED] flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Reviews Section */}
            <div className="bg-white rounded-xl p-8 border border-border mt-8">
              <h2 className="mb-6">Student Reviews</h2>
              
              {isEnrolled && !reviews.some(r => r.user_id === course.user_id) && (
                <div className="mb-8 p-6 bg-accent/20 rounded-xl border border-border">
                  <h3 className="text-lg mb-4">Write a Review</h3>
                  <form onSubmit={handleReviewSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Rating</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewRating(star)}
                            className={`p-1 transition-colors ${reviewRating >= star ? "text-yellow-400" : "text-gray-300"}`}
                          >
                            <Star className="w-6 h-6 fill-current" />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Comment</label>
                      <textarea
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B47ED]/50"
                        placeholder="What did you think of the course?"
                        rows={3}
                      />
                    </div>
                    <Button type="submit" disabled={submittingReview}>
                      {submittingReview ? "Submitting..." : "Submit Review"}
                    </Button>
                  </form>
                </div>
              )}

              <div className="space-y-6">
                {reviews.length > 0 ? (
                  reviews.map((review) => (
                    <div key={review.id} className="border-b border-border last:border-0 pb-6 last:pb-0">
                      <div className="flex items-center gap-3 mb-2">
                         <ImageWithFallback
                          src={review.profiles?.avatar_url || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop"}
                          alt={review.profiles?.name || "User"}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <div className="font-semibold">{review.profiles?.name || "Student"}</div>
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-3 h-3 fill-current ${i < review.rating ? "text-yellow-400" : "text-gray-300"}`} />
                            ))}
                          </div>
                        </div>
                        <div className="ml-auto text-xs text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <p className="text-muted-foreground">{review.comment}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground italic">No reviews yet. Be the first to review!</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
