"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Search, Shield, User, Briefcase, Users as UsersIcon } from "lucide-react";

type Role = "super_admin" | "business_admin" | "staff" | "customer";

const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super Admin",
  business_admin: "Business Owner",
  staff: "Staff",
  customer: "Customer",
};

const ROLE_COLORS: Record<Role, string> = {
  super_admin: "bg-orange-100 text-orange-700",
  business_admin: "bg-blue-100 text-blue-700",
  staff: "bg-purple-100 text-purple-700",
  customer: "bg-green-100 text-green-700",
};

const ROLE_ICONS: Record<Role, React.ElementType> = {
  super_admin: Shield,
  business_admin: Briefcase,
  staff: UsersIcon,
  customer: User,
};

export default function AdminUsersPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { window.location.href = "/login"; return; }

      const { data } = await supabase
        .from("profiles")
        .select("*, business:businesses(name)")
        .order("created_at", { ascending: false });

      setUsers(data ?? []);
      setFiltered(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    let result = users;
    if (roleFilter !== "all") result = result.filter(u => u.role === roleFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(u =>
        u.name?.toLowerCase().includes(q) ||
        u.phone?.includes(q)
      );
    }
    setFiltered(result);
  }, [search, roleFilter, users]);

  async function updateRole(userId: string, newRole: Role) {
    setUpdatingId(userId);
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole, has_chosen_role: true })
      .eq("id", userId);

    if (error) {
      alert("Failed to update role: " + error.message);
    } else {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole, has_chosen_role: true } : u));
    }
    setUpdatingId(null);
  }

  const roleCounts = {
    all: users.length,
    customer: users.filter(u => u.role === "customer").length,
    business_admin: users.filter(u => u.role === "business_admin").length,
    staff: users.filter(u => u.role === "staff").length,
    super_admin: users.filter(u => u.role === "super_admin").length,
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500 mt-1">All registered users across BookMyThing</p>
        </div>
        <div className="text-sm text-gray-500 bg-white border rounded-lg px-3 py-1.5">{users.length} total users</div>
      </div>

      {/* Role filter tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {[
          { value: "all", label: `All (${roleCounts.all})` },
          { value: "customer", label: `Customers (${roleCounts.customer})` },
          { value: "business_admin", label: `Business Owners (${roleCounts.business_admin})` },
          { value: "staff", label: `Staff (${roleCounts.staff})` },
          { value: "super_admin", label: `Super Admins (${roleCounts.super_admin})` },
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setRoleFilter(value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              roleFilter === value
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-600 border hover:border-blue-400"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name or phone…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
      </div>

      {/* Users table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 text-xs uppercase bg-gray-50">
                  <th className="px-5 py-3">User</th>
                  <th className="px-5 py-3">Business</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Joined</th>
                  <th className="px-5 py-3">Change Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((user) => {
                  const RoleIcon = ROLE_ICONS[user.role as Role] ?? User;
                  const isUpdating = updatingId === user.id;
                  return (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-semibold text-sm flex-shrink-0">
                            {user.name?.charAt(0)?.toUpperCase() ?? "?"}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{user.name ?? "—"}</p>
                            <p className="text-xs text-gray-400">{user.phone ?? "No phone"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-gray-500 text-xs">
                        {(user.business as any)?.name ?? "—"}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${ROLE_COLORS[user.role as Role] ?? "bg-gray-100 text-gray-700"}`}>
                          <RoleIcon className="w-3 h-3" />
                          {ROLE_LABELS[user.role as Role] ?? user.role}
                        </span>
                        {!user.has_chosen_role && (
                          <span className="ml-2 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Pending</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-gray-400 text-xs">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3">
                        {user.role !== "super_admin" ? (
                          <select
                            value={user.role}
                            disabled={isUpdating}
                            onChange={e => updateRole(user.id, e.target.value as Role)}
                            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                          >
                            <option value="customer">Customer</option>
                            <option value="business_admin">Business Owner</option>
                            <option value="staff">Staff</option>
                          </select>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                        {isUpdating && <span className="ml-2 text-xs text-blue-500">Saving…</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
