"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function Navbar() {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <header className="h-16 bg-zinc-900/50 backdrop-blur-md border-b border-zinc-800 flex items-center justify-between px-4 lg:px-8 z-10">
      <div className="flex-1"></div>
      <div className="flex items-center gap-4">
        <button
          onClick={handleLogout}
          className="text-sm font-medium text-zinc-400 hover:text-orange-500 transition-colors"
        >
          Logout
        </button>
      </div>
    </header>
  );
}