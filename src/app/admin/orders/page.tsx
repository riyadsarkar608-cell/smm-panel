"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type Profile = { id: string; email: string };
type Service = { id: number; service_name: string; service_id: number };

type Order = {
  id: number;
  user_id: string;
  service_id: number;
  link: string;
  quantity: number;
  charge: number;
  status: string;
  created_at: string;
  profiles: Profile | null;
  services: Service | null;
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchOrders();
  }, [supabase]);

  async function fetchOrders() {
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch Orders
      const { data: rawOrders, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;
      if (!rawOrders || rawOrders.length === 0) {
        setOrders([]);
        setLoading(false);
        return;
      }

      // Extract unique IDs for profiles and services to minimize queries
      const userIds = Array.from(new Set(rawOrders.map(o => o.user_id).filter(Boolean)));
      const serviceIds = Array.from(new Set(rawOrders.map(o => o.service_id).filter(Boolean)));

      // 2. Fetch Profiles (if any user_ids exist)
      let profilesMap: Record<string, Profile> = {};
      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, email")
          .in("id", userIds);

        if (profilesError) {
          console.error("Error fetching profiles (manual join):", profilesError);
        } else if (profiles) {
          profilesMap = profiles.reduce((acc, profile) => {
            acc[profile.id] = profile;
            return acc;
          }, {} as Record<string, Profile>);
        }
      }

      // 3. Fetch Services (if any service_ids exist)
      let servicesMap: Record<number, Service> = {};
      if (serviceIds.length > 0) {
        const { data: services, error: servicesError } = await supabase
          .from("services")
          .select("id, service_name, service_id")
          .in("id", serviceIds);

        if (servicesError) {
          console.error("Error fetching services (manual join):", servicesError);
        } else if (services) {
          servicesMap = services.reduce((acc, service) => {
            acc[service.id] = service;
            return acc;
          }, {} as Record<number, Service>);
        }
      }

      // 4. Merge Data Manually
      const mergedOrders: Order[] = rawOrders.map((order) => ({
        ...order,
        profiles: order.user_id ? profilesMap[order.user_id] || null : null,
        services: order.service_id ? servicesMap[order.service_id] || null : null,
      }));

      setOrders(mergedOrders);
    } catch (err: any) {
      console.error("Critical error fetching admin orders:", err);
      setError("Failed to load orders. Check console for details.");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(orderId: number, newStatus: string) {
    try {
      const { error: updateError } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (updateError) throw updateError;
      
      // Optimistically update UI
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (err: any) {
      console.error("Error updating order status:", err);
      alert("Failed to update status.");
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Manage Orders</h1>
          <p className="text-zinc-400 mt-1">View and update customer order statuses.</p>
        </div>
        <button 
          onClick={fetchOrders}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors text-sm"
        >
          Refresh Data
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
          {error}
        </div>
      )}

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-zinc-950/80 text-zinc-500 uppercase font-semibold text-xs tracking-wider">
              <tr>
                <th className="px-6 py-5 border-b border-zinc-800/50">ID</th>
                <th className="px-6 py-5 border-b border-zinc-800/50">User</th>
                <th className="px-6 py-5 border-b border-zinc-800/50 min-w-[200px]">Service</th>
                <th className="px-6 py-5 border-b border-zinc-800/50">Link</th>
                <th className="px-6 py-5 border-b border-zinc-800/50">Qty / Charge</th>
                <th className="px-6 py-5 border-b border-zinc-800/50">Status</th>
                <th className="px-6 py-5 border-b border-zinc-800/50">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50 bg-zinc-900/50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                    Loading all platform orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                    No orders found in the database.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-zinc-400">#{order.id}</td>
                    <td className="px-6 py-4 text-white text-xs truncate max-w-[150px]">
                      {order.profiles?.email || "Unknown User"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-white text-xs truncate max-w-[200px]">
                        {order.services?.service_name || "Unknown Service"}
                      </div>
                      <div className="text-[10px] text-zinc-500">ID: {order.services?.service_id || "N/A"}</div>
                    </td>
                    <td className="px-6 py-4 text-orange-400 text-xs truncate max-w-[150px]">
                      <a href={order.link.startsWith('http') ? order.link : `https://${order.link}`} target="_blank" rel="noreferrer" className="hover:underline">
                        {order.link}
                      </a>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-white">{order.quantity.toLocaleString()}</div>
                      <div className="text-xs text-orange-500 font-medium">${Number(order.charge).toFixed(4)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <select 
                        value={order.status} 
                        onChange={(e) => updateStatus(order.id, e.target.value)}
                        className={`bg-zinc-950 border rounded-lg px-2 py-1 text-xs font-bold uppercase tracking-wider outline-none focus:ring-1 focus:ring-orange-500 transition-colors ${
                          order.status === 'Completed' ? 'border-green-500/30 text-green-500' :
                          order.status === 'Pending' ? 'border-yellow-500/30 text-yellow-500' :
                          order.status === 'In Progress' ? 'border-blue-500/30 text-blue-400' :
                          order.status === 'Canceled' ? 'border-red-500/30 text-red-500' :
                          'border-zinc-700 text-zinc-300'
                        }`}
                      >
                        <option value="Pending" className="text-zinc-300">PENDING</option>
                        <option value="In Progress" className="text-zinc-300">IN PROGRESS</option>
                        <option value="Completed" className="text-zinc-300">COMPLETED</option>
                        <option value="Partial" className="text-zinc-300">PARTIAL</option>
                        <option value="Canceled" className="text-zinc-300">CANCELED</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-zinc-400 text-xs">
                      {new Date(order.created_at).toLocaleDateString()}
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