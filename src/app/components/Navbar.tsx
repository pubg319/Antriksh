import { Link, useLocation, useNavigate } from "react-router";
import { Button } from "./Button";
import { Menu, X, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const navItems = [
    { path: "/", label: "Home" },
    { path: "/courses", label: "Courses" },
    { path: "/dashboard", label: "Dashboard" },
    { path: "/profile", label: "Profile" },
  ];

  return (
    <nav className="bg-white border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 flex items-center justify-center overflow-hidden">
              <img src="/ddd-removebg-preview.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-xl font-semibold">Antriksh</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-sm transition-colors ${location.pathname === item.path
                    ? "text-[#5B47ED]"
                    : "text-foreground/70 hover:text-foreground"
                  }`}
              >
                {item.label}
              </Link>
            ))}
            {user ? (
              <div className="flex items-center gap-4">
                <Link to="/profile" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {user.email}
                </Link>
                <Button size="sm" variant="outline" onClick={handleSignOut} className="gap-2">
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <Link to="/auth">
                <Button size="sm">Sign In</Button>
              </Link>
            )}
          </div>

          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border">
          <div className="px-4 py-4 space-y-3">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="block py-2 text-sm"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            {user ? (
              <Button size="sm" variant="outline" className="w-full gap-2" onClick={handleSignOut}>
                <LogOut className="w-4 h-4" />
                Sign Out ({user.email})
              </Button>
            ) : (
              <Link to="/auth" className="block w-full">
                <Button size="sm" className="w-full">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
