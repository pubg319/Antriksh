import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router";
import { supabase } from "../lib/supabase";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [redirectPath, setRedirectPath] = useState("/auth");
  const location = useLocation();

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Not logged in -> send to auth
        setRedirectPath(`/auth?redirectTo=${encodeURIComponent(location.pathname)}`);
        setAllowed(false);
        setLoading(false);
        return;
      }

      if (requireAdmin) {
        // Check if user is an admin
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        console.log("Auth User ID:", session.user.id);
        console.log("Profile Data:", profile);
        console.log("Profile Error:", error);

        if (profile?.role === "admin") {
          setAllowed(true);
        } else {
          console.warn("Access Denied: User is not an admin. Role found:", profile?.role);
          setRedirectPath("/dashboard");
          setAllowed(false);
        }
      } else {
        // Standard user route
        setAllowed(true);
      }
      
      setLoading(false);
    }
    checkAuth();
  }, [requireAdmin, location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#5B47ED] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!allowed) {
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
}
