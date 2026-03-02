import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Calendar, Briefcase, Users, Settings, LogOut } from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/bookings", label: "Bookings", icon: Calendar },
  { href: "/dashboard/services", label: "Services", icon: Briefcase },
  { href: "/dashboard/staff", label: "Staff", icon: Users },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { session: _sess } } = await supabase.auth.getSession();
  const user = _sess?.user ?? null;
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, name, business_id")
    .eq("id", user.id)
    .single();

  if (!profile || !["business_admin", "super_admin"].includes(profile.role)) {
    redirect("/customer/bookings");
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r flex flex-col">
        <div className="p-6 border-b">
          <span className="text-xl font-bold text-blue-700">BookMyThing</span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t">
          <div className="text-sm text-gray-600 mb-2 px-3">{profile.name}</div>
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
