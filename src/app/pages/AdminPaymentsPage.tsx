import { useState, useEffect } from "react";
import { Navbar } from "../components/Navbar";
import { Sidebar } from "../components/Sidebar";
import { supabase } from "../lib/supabase";
import { BookOpen, Users, DollarSign, TrendingUp, MoreVertical } from "lucide-react";

export function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPayments() {
      // Fetch payments with joined profile (student name) and course (title)
      const { data } = await supabase
        .from("payments")
        .select(`
          *,
          profiles (name),
          courses (title)
        `)
        .order("created_at", { ascending: false });

      if (data) {
        setPayments(data);
      }
      setLoading(false);
    }
    fetchPayments();
  }, []);

  const sidebarItems = [
    { path: "/admin", label: "Dashboard", icon: TrendingUp },
    { path: "/admin/courses", label: "Courses", icon: BookOpen },
    { path: "/admin/students", label: "Students", icon: Users },
    { path: "/admin/payments", label: "Payments", icon: DollarSign },
  ];

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="flex">
        <Sidebar items={sidebarItems} />

        <main className="flex-1 p-8">
          <div className="max-w-7xl">
            <div className="mb-8">
              <h1 className="mb-2">Manage Payments</h1>
              <p className="text-muted-foreground">View all transactions and revenue history</p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-border">
              <div className="flex items-center justify-between mb-6">
                <h2>All Transactions ({payments.length})</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Student</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Course</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Amount</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Payment ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id} className="border-b border-border hover:bg-accent/30 transition-colors">
                        <td className="py-4 px-4">{new Date(payment.created_at).toLocaleString()}</td>
                        <td className="py-4 px-4 font-medium">{payment.profiles?.name || "Unknown"}</td>
                        <td className="py-4 px-4 text-sm">{payment.courses?.title || "Unknown Course"}</td>
                        <td className="py-4 px-4 font-semibold">₹{payment.amount}</td>
                        <td className="py-4 px-4">
                          <span className={`text-sm px-2 py-1 rounded ${
                            payment.status === 'success' ? 'bg-green-100 text-green-700' : 
                            payment.status === 'failed' ? 'bg-red-100 text-red-700' : 
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {payment.status || 'pending'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-xs font-mono text-muted-foreground">
                          {payment.razorpay_payment_id || "N/A"}
                        </td>
                      </tr>
                    ))}
                    {payments.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-muted-foreground">
                          No transactions found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
