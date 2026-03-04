"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Search, Shield, User, Briefcase, Users as UsersIcon, ChevronDown } from "lucide-react";

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
  const [mobileRoleMenuId, setMobileRoleMenuId] = useState<string | null>(null);
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
    // Use server-side endpoint — enforces super_admin check server-side, not just client-side
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole, has_chosen_role: true }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert("Failed to update role: " + (data.error ?? res.statusText));
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500 mt-1">All registered users across BookMyThing</p>
        </div>
        <div className="text-sm text-gray-500 bg-white border rounded-lg px-3 py-1.5 self-start sm:self-auto">{users.length} total users</div>
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
      <div className="bg-white rounded-xl shadow-sm overflow-visible md:overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No users found.</div>
        ) : (
          <>
            <div className="md:hidden p-3 space-y-2">
              {filtered.map((user) => {
                const RoleIcon = ROLE_ICONS[user.role as Role] ?? User;
                const isUpdating = updatingId === user.id;
                return (
                  <div
                    key={user.id}
                    className={`rounded-xl border border-gray-200 shadow-sm p-3 bg-white relative ${
                      mobileRoleMenuId === user.id ? "z-20" : "z-0"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-semibold text-sm flex-shrink-0">
                          {user.name?.charAt(0)?.toUpperCase() ?? "?"}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 leading-tight break-words">{user.name ?? "—"}</p>
                          <p className="text-xs text-gray-400 truncate">{user.phone ?? "No phone"}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium whitespace-nowrap shrink-0 ${ROLE_COLORS[user.role as Role] ?? "bg-gray-100 text-gray-700"}`}>
                        <RoleIcon className="w-3 h-3" />
                        {ROLE_LABELS[user.role as Role] ?? user.role}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg bg-gray-50 px-2.5 py-2 min-w-0">
                        <p className="text-[10px] font-semibold tracking-wide text-gray-500 uppercase">Business</p>
                        <p className="mt-0.5 text-gray-700 truncate">{(user.business as any)?.name ?? "—"}</p>
                      </div>
                      <div className="rounded-lg bg-gray-50 px-2.5 py-2">
                        <p className="text-[10px] font-semibold tracking-wide text-gray-500 uppercase">Joined</p>
                        <p className="mt-0.5 text-gray-700">{new Date(user.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2">
                      {!user.has_chosen_role && (
                        <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">Pending</span>
                      )}
                      <div className="ml-auto flex items-center gap-2">
                        {user.role !== "super_admin" ? (
                          <div className="relative min-w-[140px]">
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={(e) => {
                                e.stopPropagation();
                                setMobileRoleMenuId((prev) => (prev === user.id ? null : user.id));
                              }}
                              className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center justify-between"
                            >
                              <span>{ROLE_LABELS[user.role as Role] ?? user.role}</span>
                              <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                            </button>
                            {mobileRoleMenuId === user.id && (
                              <div className="absolute left-0 right-0 top-full mt-1 z-30 rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden">
                                {(["customer", "business_admin", "staff"] as Role[]).map((roleOption) => (
                                  <button
                                    key={roleOption}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setMobileRoleMenuId(null);
                                      if (roleOption !== user.role) {
                                        updateRole(user.id, roleOption);
                                      }
                                    }}
                                    className={`w-full text-left px-3 py-2 text-xs ${
                                      roleOption === user.role
                                        ? "bg-blue-50 text-blue-700 font-medium"
                                        : "text-gray-700 hover:bg-gray-50"
                                    }`}
                                  >
                                    {ROLE_LABELS[roleOption]}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Super admin</span>
                        )}
                        {isUpdating && <span className="text-xs text-blue-500">Saving…</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="hidden md:block overflow-x-auto">
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
          </>
        )}
      </div>
    </div>
  );
}
