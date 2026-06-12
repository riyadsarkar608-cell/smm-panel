"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  id: string;
  email: string;
  role: string;
  balance: number;
  created_at: string;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Balance Modal States
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [balanceInput, setBalanceInput] = useState("");
  const [balanceAction, setBalanceAction] = useState<"add" | "deduct">("add");
  const [isUpdating, setIsUpdating] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchUsers();
  }, [supabase]);

  async function fetchUsers() {
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
      
    if (fetchError) {
      console.error("Error fetching users:", fetchError);
      setError("Failed to load users.");
    } else if (data) {
      setUsers(data as Profile[]);
    }
    setLoading(false);
  }

  async function updateRole(userId: string, newRole: string) {
    setError(null);
    setSuccess(null);
    const { error: updateError } = await supabase.from("profiles").update({ role: newRole }).eq("id", userId);
    
    if (updateError) {
      console.error("Error updating role:", updateError);
      setError("Failed to update user role.");
    } else {
      setSuccess("User role updated successfully.");
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    }
  }

  function openBalanceModal(user: Profile) {
    setSelectedUser(user);
    setBalanceInput("");
    setBalanceAction("add");
    setIsBalanceModalOpen(true);
    setError(null);
    setSuccess(null);
  }

  async function handleBalanceUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUser || !balanceInput || isNaN(Number(balanceInput))) return;
    
    setIsUpdating(true);
    setError(null);
    
    const amount = Number(balanceInput);
    const newBalance = balanceAction === "add" 
      ? Number(selectedUser.balance) + amount 
      : Number(selectedUser.balance) - amount;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ balance: newBalance })
      .eq("id", selectedUser.id);

    if (updateError) {
      console.error("Error updating balance:", updateError);
      setError("Failed to update user balance.");
    } else {
      setSuccess(`Balance successfully ${balanceAction === "add" ? "added to" : "deducted from"} ${selectedUser.email}.`);
      setUsers(users.map(u => u.id === selectedUser.id ? { ...u, balance: newBalance } : u));
      setIsBalanceModalOpen(false);
    }
    
    setIsUpdating(false);
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Manage Users</h1>
          <p className="text-zinc-400 mt-1">View user accounts, adjust balances, and configure roles.</p>
        </div>
      </div>

      {error && <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">{error}</div>}
      {success && <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium">{success}</div>}

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-zinc-950/80 text-zinc-500 uppercase font-semibold text-xs tracking-wider">
              <tr>
                <th className="px-6 py-5 border-b border-zinc-800/50">Email</th>
                <th className="px-6 py-5 border-b border-zinc-800/50">Role</th>
                <th className="px-6 py-5 border-b border-zinc-800/50">Balance</th>
                <th className="px-6 py-5 border-b border-zinc-800/50">Joined</th>
                <th className="px-6 py-5 border-b border-zinc-800/50 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50 bg-zinc-900/50">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-zinc-500">Loading platform users...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-zinc-500">No users found.</td></tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">{user.email}</td>
                    <td className="px-6 py-4">
                      <select 
                        value={user.role} 
                        onChange={(e) => updateRole(user.id, e.target.value)}
                        className={`bg-zinc-950 border rounded-lg px-2 py-1 text-xs font-bold uppercase tracking-wider outline-none focus:ring-1 transition-colors ${
                          user.role === 'admin' ? 'border-purple-500/30 text-purple-500 focus:ring-purple-500' : 'border-zinc-700 text-zinc-300 focus:ring-orange-500'
                        }`}
                      >
                        <option value="user" className="text-zinc-300">USER</option>
                        <option value="admin" className="text-purple-400">ADMIN</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 font-bold text-orange-500">${Number(user.balance).toFixed(4)}</td>
                    <td className="px-6 py-4 text-zinc-400 text-xs">{new Date(user.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => openBalanceModal(user)} 
                        className="text-xs font-bold text-orange-500 hover:text-white bg-orange-500/10 hover:bg-orange-500 border border-orange-500/20 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Manage Balance
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* BALANCE MODAL */}
      {isBalanceModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-5 border-b border-zinc-800 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">Adjust Balance</h3>
              <button onClick={() => setIsBalanceModalOpen(false)} className="text-zinc-500 hover:text-white transition-colors">&times;</button>
            </div>
            
            <form onSubmit={handleBalanceUpdate} className="p-6 space-y-6">
              <div className="bg-black/50 border border-zinc-800 rounded-xl p-4 flex justify-between items-center">
                <div>
                  <div className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">User</div>
                  <div className="text-sm font-medium text-white">{selectedUser.email}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">Current Balance</div>
                  <div className="text-sm font-bold text-orange-500">${Number(selectedUser.balance).toFixed(4)}</div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-3">Action</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setBalanceAction("add")}
                    className={`py-3 rounded-xl text-sm font-bold border transition-colors ${
                      balanceAction === "add" ? 'bg-green-500/10 border-green-500/50 text-green-500' : 'bg-black border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    + Add Funds
                  </button>
                  <button
                    type="button"
                    onClick={() => setBalanceAction("deduct")}
                    className={`py-3 rounded-xl text-sm font-bold border transition-colors ${
                      balanceAction === "deduct" ? 'bg-red-500/10 border-red-500/50 text-red-500' : 'bg-black border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    - Deduct Funds
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-2">Amount ($)</label>
                <input 
                  type="number" 
                  step="0.0001"
                  min="0.0001"
                  value={balanceInput} 
                  onChange={(e) => setBalanceInput(e.target.value)}
                  required
                  placeholder="0.0000"
                  className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3.5 text-white font-bold focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={isUpdating} 
                  className={`w-full py-4 text-white font-bold rounded-xl transition-all disabled:opacity-50 ${
                    balanceAction === "add" ? "bg-green-500 hover:bg-green-600 shadow-[0_0_15px_-3px_rgba(34,197,94,0.4)]" : "bg-red-500 hover:bg-red-600 shadow-[0_0_15px_-3px_rgba(239,68,68,0.4)]"
                  }`}
                >
                  {isUpdating ? "Processing..." : `Confirm ${balanceAction === "add" ? "Addition" : "Deduction"}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}