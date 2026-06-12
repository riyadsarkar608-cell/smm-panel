"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    users: 0,
    orders: 0,
    pending: 0,
    completed: 0,
    revenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClient();

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      setError(null);
      try {
        // Fetch Users Count
        const { count: usersCount, error: usersError } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true });
        
        if (usersError) throw usersError;
        
        // Fetch Orders Data for stats
        const { data: ordersData, error: ordersError } = await supabase
          .from("orders")
          .select("charge, status");

        if (ordersError) throw ordersError;
        
        let pending = 0;
        let completed = 0;
        let revenue = 0;

        if (ordersData) {
          ordersData.forEach(order => {
            revenue += Number(order.charge || 0);
            if (order.status === "Pending") pending++;
            if (order.status === "Completed") completed++;
          });
        }

        setStats({
          users: usersCount || 0,
          orders: ordersData?.length || 0,
          pending,
          completed,
          revenue,
        });

        // Fetch Recent Orders with relations
        const { data: recent, error: recentError } = await supabase
          .from("orders")
          .select(`
            id, 
            charge, 
            status, 
            created_at, 
            profiles (email),
            services (service_name)
          `)
          .order("created_at", { ascending: false })
          .limit(5);

        if (recentError) throw recentError;
        if (recent) setRecentOrders(recent);
        
      } catch (err: any) {
        console.error("Dashboard Fetch Error:", err);
        setError("Failed to load platform statistics.");
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [supabase]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="border-b border-zinc-800 pb-4">
        <h1 className="text-3xl font-black text-white tracking-tight">Admin Dashboard</h1>
        <p className="text-zinc-400 mt-1">Platform-wide overview and real-time statistics.</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Total Users", value: stats.users.toLocaleString(), color: "text-blue-500", glow: "group-hover:bg-blue-500/10" },
          { label: "Total Orders", value: stats.orders.toLocaleString(), color: "text-purple-500", glow: "group-hover:bg-purple-500/10" },
          { label: "Pending Orders", value: stats.pending.toLocaleString(), color: "text-yellow-500", glow: "group-hover:bg-yellow-500/10" },
          { label: "Completed", value: stats.completed.toLocaleString(), color: "text-green-500", glow: "group-hover:bg-green-500/10" },
          { label: "Total Revenue", value: `$${stats.revenue.toFixed(4)}`, color: "text-orange-500", glow: "group-hover:bg-orange-500/10" },
        ].map((stat, i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 relative overflow-hidden group transition-all hover:border-zinc-700">
            <div className={`absolute -top-10 -right-10 w-32 h-32 blur-[40px] rounded-full transition-colors duration-500 ${stat.glow} opacity-0 group-hover:opacity-100`}></div>
            <div className="relative z-10">
              <p className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-2">{stat.label}</p>
              <h3 className={`text-3xl font-black ${stat.color}`}>{loading ? "..." : stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden mt-8 shadow-xl">
        <div className="px-6 py-5 border-b border-zinc-800 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white">Recent Global Orders</h2>
          <a href="/admin/orders" className="text-sm font-bold text-orange-500 hover:text-orange-400 bg-orange-500/10 px-3 py-1.5 rounded-lg transition-colors">
            View All
          </a>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-zinc-950/80 text-zinc-500 uppercase font-semibold text-xs tracking-wider">
              <tr>
                <th className="px-6 py-5 border-b border-zinc-800/50">ID</th>
                <th className="px-6 py-5 border-b border-zinc-800/50">User Email</th>
                <th className="px-6 py-5 border-b border-zinc-800/50 min-w-[200px]">Service</th>
                <th className="px-6 py-5 border-b border-zinc-800/50">Charge</th>
                <th className="px-6 py-5 border-b border-zinc-800/50">Status</th>
                <th className="px-6 py-5 border-b border-zinc-800/50">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50 bg-zinc-900/50">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-zinc-500">Loading recent orders...</td></tr>
              ) : recentOrders.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-zinc-500">No orders found in the database.</td></tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-zinc-400">#{order.id}</td>
                    <td className="px-6 py-4 text-white font-medium text-xs">{order.profiles?.email || "Unknown"}</td>
                    <td className="px-6 py-4 text-zinc-300 text-xs truncate max-w-[200px]">{order.services?.service_name || "Unknown"}</td>
                    <td className="px-6 py-4 font-bold text-orange-400">${Number(order.charge).toFixed(4)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border ${
                        order.status === 'Completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                        order.status === 'Pending' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                        order.status === 'In Progress' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        order.status === 'Canceled' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                        'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-400 text-xs">{new Date(order.created_at).toLocaleDateString()}</td>
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