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

const TABS = ["All", "Pending", "In Progress", "Completed", "Partial", "Canceled"];

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("All");

  const supabase = createClient();

  useEffect(() => {
    let isMounted = true;

    async function fetchOrders() {
      setLoading(true);
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        if (isMounted) {
          setError("You must be logged in to view your orders.");
          setLoading(false);
        }
        return;
      }
      
      const { data, error: fetchError } = await supabase
        .from("orders")
        .select(`
          *,
          services (
            service_name,
            service_id
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (fetchError) {
        console.error("Error fetching orders:", fetchError.message);
        if (isMounted) setError("Failed to load orders. Please try again.");
      } else if (isMounted) {
        setOrders(data as unknown as Order[]);
      }
      
      if (isMounted) setLoading(false);
    }

    fetchOrders();

    return () => { isMounted = false; };
  }, [supabase]);

  const filteredOrders = activeTab === "All" 
    ? orders 
    : orders.filter(order => order.status.toLowerCase() === activeTab.toLowerCase());

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "in progress":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "completed":
        return "bg-green-500/10 text-green-400 border-green-500/20";
      case "partial":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case "canceled":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      default:
        return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white">Order History</h1>
        <p className="text-zinc-400 mt-1">Track and manage your campaigns.</p>
      </div>

      <div className="flex overflow-x-auto gap-2 pb-2 custom-scrollbar">
        {TABS.map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab 
                ? 'bg-orange-500 text-white shadow-[0_0_15px_-3px_rgba(249,115,22,0.4)]' 
                : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white border border-zinc-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
          {error}
        </div>
      )}

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-zinc-950/80 text-zinc-500 uppercase font-semibold text-xs tracking-wider">
              <tr>
                <th className="px-6 py-5 border-b border-zinc-800/50">ID</th>
                <th className="px-6 py-5 border-b border-zinc-800/50">Date</th>
                <th className="px-6 py-5 border-b border-zinc-800/50 min-w-[250px]">Link & Service</th>
                <th className="px-6 py-5 border-b border-zinc-800/50">Charge</th>
                <th className="px-6 py-5 border-b border-zinc-800/50">Quantity</th>
                <th className="px-6 py-5 border-b border-zinc-800/50">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50 bg-zinc-900/50 backdrop-blur-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <svg className="animate-spin h-8 w-8 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-zinc-500 font-medium">Loading orders...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-16 h-16 bg-zinc-800/50 rounded-full flex items-center justify-center mb-2 border border-zinc-700/50">
                        <svg className="w-8 h-8 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                      </div>
                      <p className="text-lg font-bold text-white">No orders found</p>
                      <p className="text-zinc-500 text-sm max-w-sm">
                        {activeTab === "All" 
                          ? "You haven't placed any campaigns yet." 
                          : `There are no orders with the status "${activeTab}".`}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-zinc-800/30 transition-colors group">
                    <td className="px-6 py-4 font-mono text-zinc-400">#{order.id}</td>
                    <td className="px-6 py-4 text-zinc-300 whitespace-nowrap">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-orange-500 truncate max-w-[200px] lg:max-w-[300px] hover:text-orange-400 transition-colors">
                        <a href={order.link.startsWith('http') ? order.link : `https://${order.link}`} target="_blank" rel="noopener noreferrer">
                          {order.link}
                        </a>
                      </div>
                      <div className="text-xs text-zinc-400 mt-1.5 truncate max-w-[200px] lg:max-w-[300px] font-medium bg-zinc-800/50 inline-block px-2 py-0.5 rounded-md border border-zinc-700/50">
                        {order.services?.service_id} - {order.services?.service_name || "Unknown Service"}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-white">${Number(order.charge).toFixed(4)}</td>
                    <td className="px-6 py-4 text-zinc-300 font-medium">{Number(order.quantity).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full border ${getStatusStyle(order.status)}`}>
                        {order.status}
                      </span>
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