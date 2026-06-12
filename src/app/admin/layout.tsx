"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Sidebar } from "@/components/layout/sidebar"; // Assuming you have the unified sidebar

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    let isMounted = true;

    async function checkAdmin() {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        if (isMounted) router.push("/login");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profileError || profile?.role !== "admin") {
        if (isMounted) router.push("/dashboard");
        return;
      }

      if (isMounted) {
        setIsAuthorized(true);
        setIsLoading(false);
      }
    }

    checkAdmin();

    return () => { isMounted = false; };
  }, [router, supabase]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950">
        <div className="text-orange-500 animate-pulse font-bold text-xl">Verifying Admin Access...</div>
      </div>
    );
  }

  if (!isAuthorized) return null;

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-200 font-sans selection:bg-orange-500/30">
      <Sidebar isSidebarOpen={true} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}