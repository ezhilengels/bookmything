"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { LayoutDashboard, Building2, Users, LogOut, Menu, X } from "lucide-react";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/businesses", label: "Businesses", icon: Building2 },
  { href: "/admin/users", label: "Users", icon: Users },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [displayName, setDisplayName] = useState("Admin");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { window.location.href = "/login"; return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, name")
        .eq("id", session.user.id)
        .single();

      // Only redirect away if we are sure the role is wrong (not a network failure)
      if (profile && profile.role !== "super_admin") {
        window.location.href = "/login";
        return;
      }

      setDisplayName(profile?.name ?? session.user.email ?? "Admin");
    }
    load();
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  function SidebarContent({ mobile = false }: { mobile?: boolean }) {
    return (
      <>
        <div className="p-6 border-b flex items-center justify-between">
          <div>
            <span className="text-xl font-bold text-blue-700">BookMyThing</span>
            <div className="mt-1 text-xs text-orange-600 font-semibold uppercase tracking-wide">
              Super Admin
            </div>
          </div>
          {mobile && (
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100"
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
                    ? "bg-orange-50 text-orange-700 font-medium"
                    : "text-gray-700 hover:bg-orange-50 hover:text-orange-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t">
          <div className="text-sm text-gray-600 mb-2 px-3 truncate">{displayName}</div>
          <button
            onClick={signOut}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50 relative">
      <aside className="hidden md:flex w-64 bg-white border-r flex-col">
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
          <aside className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white border-r z-50 flex flex-col md:hidden">
            <SidebarContent mobile />
          </aside>
        </>
      )}

      <main className="flex-1 min-w-0 overflow-auto">
        <div className="md:hidden sticky top-0 z-30 bg-white/95 backdrop-blur border-b px-4 py-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm font-semibold text-blue-700">BookMyThing Admin</span>
          <div className="w-9" />
        </div>
        <div className="p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
