"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { LayoutDashboard, Calendar, Briefcase, Users, Settings, LogOut, Menu, X, Sun, Moon } from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/bookings", label: "Bookings", icon: Calendar },
  { href: "/dashboard/services", label: "Services", icon: Briefcase },
  { href: "/dashboard/staff", label: "Staff", icon: Users },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [profile, setProfile] = useState<{ name: string; business_id: string | null } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { window.location.href = "/login"; return; }

      const { data } = await supabase
        .from("profiles")
        .select("name, business_id, role")
        .eq("id", session.user.id)
        .single();

      if (!data || !["business_admin", "super_admin"].includes(data.role)) {
        window.location.href = "/customer/bookings";
        return;
      }
      setProfile(data);
    }
    load();
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = saved === "dark" || (saved !== "light" && prefersDark);
    setIsDarkMode(isDark);
    // Sync the DOM class so dark styles apply immediately on load
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  function toggleTheme() {
    const next = !isDarkMode;
    setIsDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  function SidebarContent({ mobile = false }: { mobile?: boolean }) {
    return (
      <>
        <div className="p-6 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <span className="text-xl font-bold text-blue-700">BookMyThing</span>
            <div className="text-xs text-gray-400 dark:text-slate-400 mt-0.5">Business Dashboard</div>
          </div>
          {mobile && (
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-2 rounded-lg text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-blue-50 dark:bg-blue-900/35 text-blue-700 dark:text-blue-200 font-medium"
                    : "text-gray-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-700 hover:text-blue-700 dark:hover:text-blue-200"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-200 dark:border-slate-700">
          <div className="mb-2 px-3 flex items-center justify-between gap-2">
            <div className="text-sm text-gray-600 dark:text-slate-300 truncate">{profile?.name ?? "..."}</div>
            <button
              type="button"
              onClick={toggleTheme}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isDarkMode ? "bg-slate-700" : "bg-blue-200"
              }`}
              aria-label="Toggle dark mode"
              title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              <span
                className={`inline-flex h-5 w-5 transform items-center justify-center rounded-full bg-white shadow transition-transform ${
                  isDarkMode ? "translate-x-5" : "translate-x-1"
                }`}
              >
                {isDarkMode ? <Moon className="w-3 h-3 text-slate-600" /> : <Sun className="w-3 h-3 text-amber-500" />}
              </span>
            </button>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 dark:text-slate-200 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-slate-700 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-slate-900 relative">
      <aside className="hidden md:flex w-64 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 flex-col">
        <SidebarContent />
      </aside>

      {sidebarOpen && (
        <>
          <button
            type="button"
            aria-label="Close menu overlay"
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/30 z-40 md:hidden"
          />
          <aside className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 z-50 flex flex-col md:hidden">
            <SidebarContent mobile />
          </aside>
        </>
      )}

      <main className="flex-1 min-w-0 overflow-auto">
        <div className="md:hidden sticky top-0 z-30 bg-white/95 dark:bg-slate-800/95 backdrop-blur border-b border-gray-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-gray-600 dark:text-slate-200 hover:text-gray-900 dark:hover:text-slate-100 hover:bg-gray-100 dark:hover:bg-slate-700"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm font-semibold text-blue-700">BookMyThing Dashboard</span>
          <div className="w-9" />
        </div>
        <div className="p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
