import { useState } from "react";
import { useNavigate } from "react-router";
import { BookOpen } from "lucide-react";
import { supabase } from "../lib/supabase";
import { Button } from "../components/Button";

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate("/dashboard");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });
        if (error) throw error;
        // On success, redirect to dashboard or show success message (depending on email confirmation settings)
        alert("Success! If email confirmation is enabled, please check your email. Otherwise, you are logged in.");
        navigate("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <div className="w-12 h-12 bg-[#5B47ED] rounded-xl flex items-center justify-center mb-6">
          <BookOpen className="w-8 h-8 text-white" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-foreground">
          {isLogin ? "Sign in to your account" : "Create a new account"}
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Or{" "}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="font-medium text-[#5B47ED] hover:text-[#4938D6]"
          >
            {isLogin ? "create a new account" : "sign in to your existing account"}
          </button>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-xl sm:px-10 border border-border">
          <form className="space-y-6" onSubmit={handleAuth}>
            {!isLogin && (
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-sm font-medium text-foreground"
                >
                  Full Name
                </label>
                <div className="mt-1">
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="block w-full appearance-none rounded-md border border-border px-3 py-2 placeholder-muted-foreground shadow-sm focus:border-[#5B47ED] focus:outline-none focus:ring-[#5B47ED] sm:text-sm"
                  />
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground"
              >
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full appearance-none rounded-md border border-border px-3 py-2 placeholder-muted-foreground shadow-sm focus:border-[#5B47ED] focus:outline-none focus:ring-[#5B47ED] sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-foreground"
              >
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full appearance-none rounded-md border border-border px-3 py-2 placeholder-muted-foreground shadow-sm focus:border-[#5B47ED] focus:outline-none focus:ring-[#5B47ED] sm:text-sm"
                />
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-100">
                {error}
              </div>
            )}

            <div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Processing..." : isLogin ? "Sign in" : "Sign up"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
