"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { LayoutDashboard, Building2, Users, LogOut, Menu, X, Sun, Moon, ShieldCheck } from "lucide-react";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/businesses", label: "Businesses", icon: Building2 },
  { href: "/admin/users", label: "Users", icon: Users },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [displayName, setDisplayName] = useState("Admin");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { window.location.href = "/login"; return; }
      const { data: profile } = await supabase
        .from("profiles").select("role, name").eq("id", session.user.id).single();
      if (profile && profile.role !== "super_admin") { window.location.href = "/login"; return; }
      setDisplayName(profile?.name ?? session.user.email ?? "Admin");
    }
    load();
  }, []);

  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = saved === "dark" || (saved !== "light" && prefersDark);
    setIsDarkMode(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  function toggleTheme() {
    const next = !isDarkMode;
    setIsDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  function SidebarContent({ mobile = false }: { mobile?: boolean }) {
    return (
      <>
        <div className="p-6 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <span className="text-xl font-bold text-blue-700 dark:text-blue-400">BookMyThing</span>
            <div className="mt-1 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-orange-500" />
              <span className="text-xs text-orange-600 dark:text-orange-400 font-bold uppercase tracking-wider">Super Admin</span>
            </div>
          </div>
          {mobile && (
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-2 rounded-lg text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 font-medium"
                    : "text-gray-700 dark:text-slate-300 hover:bg-orange-50 dark:hover:bg-slate-700 hover:text-orange-700 dark:hover:text-orange-300"
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
            <div className="text-sm text-gray-600 dark:text-slate-300 truncate">{displayName}</div>
            <button
              type="button"
              onClick={toggleTheme}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isDarkMode ? "bg-slate-700" : "bg-orange-200"
              }`}
              aria-label="Toggle dark mode"
            >
              <span className={`inline-flex h-5 w-5 transform items-center justify-center rounded-full bg-white shadow transition-transform ${isDarkMode ? "translate-x-5" : "translate-x-1"}`}>
                {isDarkMode ? <Moon className="w-3 h-3 text-slate-600" /> : <Sun className="w-3 h-3 text-orange-500" />}
              </span>
            </button>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-slate-700 transition-colors"
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
          <button type="button" aria-label="Close menu overlay" onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/30 dark:bg-black/50 z-40 md:hidden" />
          <aside className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 z-50 flex flex-col md:hidden">
            <SidebarContent mobile />
          </aside>
        </>
      )}

      <main className="flex-1 min-w-0 overflow-auto">
        <div className="md:hidden sticky top-0 z-30 bg-white/95 dark:bg-slate-800/95 backdrop-blur border-b border-gray-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between">
          <button type="button" onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-slate-100 hover:bg-gray-100 dark:hover:bg-slate-700"
            aria-label="Open menu">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">BookMyThing Admin</span>
          </div>
          <div className="w-9" />
        </div>
        <div className="p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
