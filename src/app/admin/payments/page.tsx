"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  email: string;
  balance: number;
};

type Payment = {
  id: number;
  user_id: string;
  amount: number;
  method: string;
  status: string;
  created_at: string;
  profiles: Profile;
};

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchPayments();
  }, [supabase]);

  async function fetchPayments() {
    setLoading(true);
    const { data, error } = await supabase
      .from("payments")
      .select("*, profiles(email, balance)")
      .order("created_at", { ascending: false });
      
    if (!error && data) {
      setPayments(data as unknown as Payment[]);
    }
    setLoading(false);
  }

  async function handleApprove(payment: Payment) {
    if (!confirm(`Approve $${payment.amount} for ${payment.profiles.email}?`)) return;
    setProcessingId(payment.id);

    try {
      // 1. Fetch current profile balance safely
      const { data: profile } = await supabase
        .from("profiles")
        .select("balance")
        .eq("id", payment.user_id)
        .single();

      if (!profile) throw new Error("Profile not found.");

      const newBalance = Number(profile.balance) + Number(payment.amount);

      // 2. Update Profile Balance
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ balance: newBalance })
        .eq("id", payment.user_id);

      if (profileError) throw profileError;

      // 3. Update Payment Status
      await supabase
        .from("payments")
        .update({ status: "Completed" })
        .eq("id", payment.id);

      fetchPayments();
    } catch (err) {
      console.error(err);
      alert("An error occurred while approving payment.");
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReject(paymentId: number) {
    if (!confirm("Reject this payment?")) return;
    setProcessingId(paymentId);
    
    await supabase.from("payments").update({ status: "Failed" }).eq("id", paymentId);
    
    setProcessingId(null);
    fetchPayments();
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Pending": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "Completed": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "Failed": return "bg-red-500/10 text-red-500 border-red-500/20";
      case "Refunded": return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      default: return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Payment Requests</h1>
          <p className="text-zinc-400 mt-1">Review and process manual user deposits.</p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-zinc-950/80 text-zinc-500 uppercase font-semibold text-xs tracking-wider">
              <tr>
                <th className="px-6 py-5 border-b border-zinc-800/50">ID</th>
                <th className="px-6 py-5 border-b border-zinc-800/50">User Email</th>
                <th className="px-6 py-5 border-b border-zinc-800/50">Amount</th>
                <th className="px-6 py-5 border-b border-zinc-800/50">Method</th>
                <th className="px-6 py-5 border-b border-zinc-800/50">Status</th>
                <th className="px-6 py-5 border-b border-zinc-800/50">Date</th>
                <th className="px-6 py-5 border-b border-zinc-800/50 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50 bg-zinc-900/50">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-zinc-500">Loading payments...</td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-zinc-500">No payment records found.</td></tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-zinc-400">#{payment.id}</td>
                    <td className="px-6 py-4 text-white font-medium">{payment.profiles?.email}</td>
                    <td className="px-6 py-4 font-bold text-orange-500">${Number(payment.amount).toFixed(2)}</td>
                    <td className="px-6 py-4 text-zinc-300">{payment.method}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-full border ${getStatusStyle(payment.status)}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-400 text-xs">{new Date(payment.created_at).toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      {payment.status === "Pending" ? (
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleApprove(payment)} 
                            disabled={processingId === payment.id}
                            className="text-xs px-3 py-1 bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500/20 font-bold rounded disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => handleReject(payment.id)} 
                            disabled={processingId === payment.id}
                            className="text-xs px-3 py-1 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 font-bold rounded disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-600 font-medium">Processed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}