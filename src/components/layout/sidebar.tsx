"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MessageSquare } from "lucide-react";

type Profile = {
  email: string;
  balance: number;
  role: "user" | "admin";
};

type NavLink = {
  name: string;
  href: string;
  iconPath?: string;
  iconNode?: React.ReactNode;
};

export function Sidebar({ isSidebarOpen = true }: { isSidebarOpen?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const customerLinks: NavLink[] = [
    { 
      name: "Dashboard", 
      href: "/dashboard", 
      iconPath: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
    },
    { 
      name: "New Order", 
      href: "/dashboard/new-order", 
      iconPath: "M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" 
    },
    { 
      name: "My Orders", 
      href: "/dashboard/my-orders", 
      iconPath: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" 
    },
    { 
      name: "Support", 
      href: "/dashboard/support", 
      iconNode: <MessageSquare className="w-5 h-5 shrink-0" /> 
    },
    { 
      name: "Services", 
      href: "/dashboard/services", 
      iconPath: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" 
    },
    { 
      name: "Add Funds", 
      href: "/dashboard/add-funds", 
      iconPath: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" 
    },
  ];

  const adminLinks: NavLink[] = [
    { name: "Admin Dashboard", href: "/admin", iconPath: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" },
    { name: "Manage Orders", href: "/admin/orders", iconPath: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" },
    { name: "Manage Services", href: "/admin/services", iconPath: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" },
    { name: "Manage Categories", href: "/admin/categories", iconPath: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" },
    { name: "Manage Users", href: "/admin/users", iconPath: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
    { name: "Payments", href: "/admin/payments", iconPath: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" },
    { name: "Support Tickets", href: "/admin/tickets", iconNode: <MessageSquare className="w-5 h-5 shrink-0" /> },
  ];

  useEffect(() => {
    let isMounted = true;

    async function fetchUserData() {
      setLoading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        if (isMounted) router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("email, balance, role")
        .eq("id", user.id)
        .single();

      if (!error && data && isMounted) {
        setProfile(data as Profile);
      }
      
      if (isMounted) setLoading(false);
    }

    fetchUserData();

    return () => { isMounted = false; };
  }, [supabase, router]);

  const userName = profile?.email?.split("@")[0] || "User";
  const userInitials = userName.substring(0, 2).toUpperCase();
  const isAdmin = profile?.role === "admin";
  const balance = profile?.balance ? Number(profile.balance) : 0;

  return (
    <aside
      className={`${
        isSidebarOpen ? "w-64" : "w-0 lg:w-20"
      } flex flex-col bg-zinc-900 border-r border-zinc-800 transition-all duration-300 overflow-hidden z-30 shrink-0 h-full`}
    >
      <div className="h-16 flex items-center justify-center border-b border-zinc-800 shrink-0">
        <span className="text-xl font-bold text-orange-500 truncate px-4">
          {isSidebarOpen ? "SMMFOLLOW" : "SMM"}
        </span>
      </div>

      <div className={`p-4 border-b border-zinc-800 ${!isSidebarOpen && "lg:hidden"}`}>
        <div className="flex items-center gap-3 bg-zinc-950 p-3 rounded-xl border border-zinc-800/50">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${isAdmin ? 'bg-purple-500/20 text-purple-500' : 'bg-orange-500/20 text-orange-500'}`}>
            {loading ? ".." : userInitials}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-white truncate">{loading ? "Loading..." : userName}</p>
            <p className="text-xs text-zinc-500 capitalize">Tier: {profile?.role || "Standard"}</p>
          </div>
        </div>
        
        {!isAdmin && (
          <div className="mt-3 bg-gradient-to-r from-orange-600 to-orange-400 p-4 rounded-xl text-white shadow-lg shadow-orange-500/20">
            <p className="text-xs uppercase tracking-wider opacity-80 mb-1">Balance</p>
            <p className="text-2xl font-black">
              ${loading ? "0.00" : balance.toFixed(2)}
            </p>
          </div>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar">
        {(isAdmin ? adminLinks : customerLinks).map((link) => {
          const isActive = pathname.startsWith(link.href);
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
                isActive
                  ? (isAdmin ? "bg-purple-500/10 text-purple-500" : "bg-orange-500/10 text-orange-500")
                  : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
              }`}
            >
              {link.iconNode ? (
                link.iconNode
              ) : (
                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={link.iconPath} />
                </svg>
              )}
              <span className={`font-medium whitespace-nowrap ${!isSidebarOpen && "lg:hidden"}`}>
                {link.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}