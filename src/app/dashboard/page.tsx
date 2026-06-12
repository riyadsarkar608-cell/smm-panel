"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type Service = {
  service_name: string;
  service_id: number;
};

type Order = {
  id: number;
  service_id: number;
  link: string;
  quantity: number;
  charge: number;
  status: string;
  created_at: string;
  services: Service | null;
};

export default function DashboardPage() {
  const [balance, setBalance] = useState<number>(0);
  const [amountSpent, setAmountSpent] = useState<number>(0);
  const [totalOrders, setTotalOrders] = useState<number>(0);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  const supabase = createClient();

  useEffect(() => {
    let isMounted = true;

    async function fetchDashboardData() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        if (isMounted) setLoading(false);
        return;
      }

      const [profileRes, ordersRes] = await Promise.all([
        supabase.from("profiles").select("balance").eq("id", user.id).single(),
        supabase.from("orders")
          .select("*, services(service_name, service_id)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
      ]);

      if (isMounted) {
        if (!profileRes.error && profileRes.data) {
          setBalance(Number(profileRes.data.balance) || 0);
        }

        if (!ordersRes.error && ordersRes.data) {
          const orders = ordersRes.data as unknown as Order[];
          setTotalOrders(orders.length);
          
          const spent = orders.reduce((sum, order) => sum + Number(order.charge || 0), 0);
          setAmountSpent(spent);
          
          setRecentOrders(orders.slice(0, 5));
        }
        
        setLoading(false);
      }
    }

    fetchDashboardData();

    return () => { isMounted = false; };
  }, [supabase]);

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "in progress": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "completed": return "bg-green-500/10 text-green-400 border-green-500/20";
      case "partial": return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case "canceled": return "bg-red-500/10 text-red-400 border-red-500/20";
      default: return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric"
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Overview</h1>
          <p className="text-zinc-400 mt-1">Welcome back. Here is your panel summary.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {[
          { label: "Account Balance", value: `$${balance.toFixed(4)}`, color: "from-orange-500/20 to-transparent", border: "border-orange-500/50" },
          { label: "Amount Spent", value: `$${amountSpent.toFixed(4)}`, color: "from-blue-500/20 to-transparent", border: "border-zinc-800" },
          { label: "Total Orders", value: totalOrders.toLocaleString(), color: "from-purple-500/20 to-transparent", border: "border-zinc-800" },
        ].map((stat, i) => (
          <div key={i} className={`bg-zinc-900 border ${stat.border} rounded-2xl p-6 relative overflow-hidden group`}>
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
            <div className="relative z-10">
              <p className="text-sm font-medium text-zinc-400 mb-2">{stat.label}</p>
              <h3 className="text-3xl font-black text-white">{loading ? "..." : stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden mt-8">
        <div className="px-6 py-5 border-b border-zinc-800 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white">Recent Orders</h2>
          <a href="/dashboard/my-orders" className="text-sm text-orange-500 hover:text-orange-400 font-medium">View All</a>
        </div>
        
        {loading ? (
          <div className="p-12 text-center text-zinc-500">Loading recent orders...</div>
        ) : recentOrders.length === 0 ? (
          <div className="p-12 text-center text-zinc-500">
            <p>No recent activity found. Head over to New Order to start.</p>
            <a href="/dashboard/new-order" className="inline-block mt-4 px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors text-sm font-medium">
              Place Order
            </a>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-300">
              <thead className="bg-zinc-950/80 text-zinc-500 uppercase font-semibold text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-4 border-b border-zinc-800/50">ID</th>
                  <th className="px-6 py-4 border-b border-zinc-800/50">Date</th>
                  <th className="px-6 py-4 border-b border-zinc-800/50">Service</th>
                  <th className="px-6 py-4 border-b border-zinc-800/50">Charge</th>
                  <th className="px-6 py-4 border-b border-zinc-800/50">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-zinc-400">#{order.id}</td>
                    <td className="px-6 py-4 text-zinc-400">{formatDate(order.created_at)}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-white truncate max-w-[200px]">
                        {order.services?.service_name || "Unknown Service"}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-orange-400">${Number(order.charge).toFixed(4)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-full border ${getStatusStyle(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}