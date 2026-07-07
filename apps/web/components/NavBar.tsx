"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Activity, LayoutDashboard, MessageCircle, Salad, Trophy } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabaseClient";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/coach", label: "Coach", icon: MessageCircle },
  { href: "/nutrition", label: "Nutrition", icon: Salad },
  { href: "/resume", label: "Resume", icon: Trophy },
];

export function NavBar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <nav className="flex items-center justify-between px-6 py-4 border-b border-surface2">
      <Link href="/dashboard" className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-vital/10 flex items-center justify-center">
          <Activity className="w-4 h-4 text-vital" />
        </div>
        <span className="font-display text-lg font-semibold text-bone">Health OS</span>
      </Link>
      <div className="flex items-center gap-6">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-1.5 text-sm transition ${
                active ? "text-vital font-medium" : "text-muted hover:text-bone"
              }`}
            >
              <link.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{link.label}</span>
            </Link>
          );
        })}
        <button
          onClick={() => window.dispatchEvent(new Event("open-onboarding-tour"))}
          className="w-7 h-7 rounded-full border border-surface2 text-muted hover:text-vital hover:border-vital transition text-sm flex items-center justify-center"
          title="Replay tour"
        >
          ?
        </button>
        <button
          onClick={handleLogout}
          className="text-muted hover:text-coral transition text-sm"
        >
          Log out
        </button>
      </div>
    </nav>
  );
}
