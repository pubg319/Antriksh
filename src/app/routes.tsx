import { createBrowserRouter } from "react-router";
import { LandingPage } from "./pages/LandingPage";
import { CourseListingPage } from "./pages/CourseListingPage";
import { CourseDetailPage } from "./pages/CourseDetailPage";
import { StudentDashboard } from "./pages/StudentDashboard";
import { CoursePlayerPage } from "./pages/CoursePlayerPage";
import { AdminPanel } from "./pages/AdminPanel";
import { AdminCreateCoursePage } from "./pages/AdminCreateCoursePage";
import { AdminCoursesPage } from "./pages/AdminCoursesPage";
import { AdminStudentsPage } from "./pages/AdminStudentsPage";
import { AdminPaymentsPage } from "./pages/AdminPaymentsPage";
import { AdminUploadVideoPage } from "./pages/AdminUploadVideoPage";
import { AdminCreateModulePage } from "./pages/AdminCreateModulePage";
import { AdminEditCoursePage } from "./pages/AdminEditCoursePage";
import { AdminCourseContentPage } from "./pages/AdminCourseContentPage";
import { AdminLiveClassesPage } from "./pages/AdminLiveClassesPage";
import { HelpCenterPage } from "./pages/HelpCenterPage";
import { AuthPage } from "./pages/AuthPage";
import { ProfilePage } from "./pages/ProfilePage";
import { NotFound } from "./pages/NotFound";
import { ProtectedRoute } from "./components/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LandingPage,
  },
  {
    path: "/auth",
    Component: AuthPage,
  },
  {
    path: "/admin/courses/new",
    element: (
      <ProtectedRoute requireAdmin>
        <AdminCreateCoursePage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/courses/edit/:id",
    element: (
      <ProtectedRoute requireAdmin>
        <AdminEditCoursePage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/courses/content/:id",
    element: (
      <ProtectedRoute requireAdmin>
        <AdminCourseContentPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/upload-video",
    element: (
      <ProtectedRoute requireAdmin>
        <AdminUploadVideoPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/modules/new",
    element: (
      <ProtectedRoute requireAdmin>
        <AdminCreateModulePage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/live",
    element: (
      <ProtectedRoute requireAdmin>
        <AdminLiveClassesPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/courses",
    Component: CourseListingPage,
  },
  {
    path: "/help",
    element: <HelpCenterPage />,
  },
  {
    path: "/course/:id",
    Component: CourseDetailPage,
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <StudentDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/profile",
    element: (
      <ProtectedRoute>
        <ProfilePage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/learn/:courseId/:lessonId?",
    element: (
      <ProtectedRoute>
        <CoursePlayerPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin",
    element: (
      <ProtectedRoute requireAdmin>
        <AdminPanel />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/courses",
    element: (
      <ProtectedRoute requireAdmin>
        <AdminCoursesPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/students",
    element: (
      <ProtectedRoute requireAdmin>
        <AdminStudentsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/payments",
    element: (
      <ProtectedRoute requireAdmin>
        <AdminPaymentsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "*",
    Component: NotFound,
  },
]);
