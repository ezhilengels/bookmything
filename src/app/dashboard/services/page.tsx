"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { PlusCircle, Clock, Pencil, Trash2, Briefcase } from "lucide-react";

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { window.location.href = "/login"; return; }

      const { data: profile } = await supabase
        .from("profiles").select("business_id").eq("id", session.user.id).single();

      if (!profile?.business_id) { window.location.href = "/onboarding"; return; }
      setBusinessId(profile.business_id);

      const { data } = await supabase
        .from("services").select("*").eq("business_id", profile.business_id).order("name");
      setServices(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  async function toggleStatus(id: string, current: boolean) {
    await supabase.from("services").update({ is_active: !current }).eq("id", id);
    setServices(prev => prev.map(s => s.id === id ? { ...s, is_active: !current } : s));
  }

  async function deleteService(id: string) {
    if (!confirm("Delete this service?")) return;
    await supabase.from("services").delete().eq("id", id);
    setServices(prev => prev.filter(s => s.id !== id));
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-400 dark:text-slate-500">Loading services…</p>
    </div>
  );

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-600/10 dark:bg-purple-500/20 shrink-0">
            <Briefcase className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Services</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
              Manage the services your business offers
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/services/new"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm shadow-blue-500/30 shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span className="hidden sm:inline">Add Service</span>
          <span className="sm:hidden">Add</span>
        </Link>
      </div>

      {!services.length ? (
        /* ── Empty state ── */
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-50 dark:bg-purple-900/30 mx-auto mb-4">
            <Briefcase className="w-8 h-8 text-purple-400 dark:text-purple-500" />
          </div>
          <p className="text-gray-700 dark:text-slate-200 font-semibold mb-1">No services yet</p>
          <p className="text-gray-400 dark:text-slate-500 text-sm mb-6">
            Add your first service to start accepting bookings.
          </p>
          <Link
            href="/dashboard/services/new"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            <PlusCircle className="w-4 h-4" /> Add Your First Service
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">

          {/* ── Mobile cards ── */}
          <div className="md:hidden p-3 space-y-3">
            {services.map((svc) => (
              <div
                key={svc.id}
                className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 shadow-sm overflow-hidden"
              >
                {/* Accent strip: purple for active, gray for inactive */}
                <div className={`h-0.5 w-full ${svc.is_active ? "bg-purple-500" : "bg-gray-400 dark:bg-slate-600"}`} />

                <div className="p-3">
                  {/* Name + status toggle row */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-slate-100 truncate">{svc.name}</p>
                      {svc.description && (
                        <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5 truncate">{svc.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => toggleStatus(svc.id, svc.is_active)}
                      className={`shrink-0 inline-flex items-center justify-center min-w-[76px] px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                        svc.is_active
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300 dark:border dark:border-emerald-500/50 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/50 dark:hover:text-red-400"
                          : "bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-slate-400 hover:bg-emerald-100 hover:text-emerald-700 dark:hover:bg-emerald-900/50 dark:hover:text-emerald-400"
                      }`}
                    >
                      {svc.is_active ? "Active" : "Inactive"}
                    </button>
                  </div>

                  {/* Info grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div className="rounded-lg bg-gray-50 dark:bg-slate-700/60 px-2.5 py-2">
                      <p className="text-[10px] font-bold tracking-wider text-gray-400 dark:text-slate-500 uppercase">Duration</p>
                      <p className="mt-0.5 text-gray-800 dark:text-slate-200 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3 shrink-0" />{svc.duration_minutes} min
                      </p>
                    </div>
                    <div className="rounded-lg bg-gray-50 dark:bg-slate-700/60 px-2.5 py-2">
                      <p className="text-[10px] font-bold tracking-wider text-gray-400 dark:text-slate-500 uppercase">Price</p>
                      <p className="mt-0.5 font-bold text-blue-600 dark:text-blue-400">₹{svc.price}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-2 border-t border-gray-100 dark:border-slate-700">
                    <Link
                      href={`/dashboard/services/${svc.id}/edit`}
                      className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </Link>
                    <button
                      onClick={() => deleteService(svc.id)}
                      className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Desktop table ── */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-700/50 border-b border-gray-100 dark:border-slate-700">
                  <th className="px-5 py-3">Service</th>
                  <th className="px-5 py-3">Duration</th>
                  <th className="px-5 py-3">Price</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {services.map((svc) => (
                  <tr key={svc.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-gray-900 dark:text-slate-100">{svc.name}</div>
                      {svc.description && (
                        <div className="text-gray-400 dark:text-slate-500 text-xs mt-0.5 truncate max-w-xs">
                          {svc.description}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 dark:text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500" />
                        {svc.duration_minutes} min
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-blue-600 dark:text-blue-400">
                      ₹{svc.price}
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => toggleStatus(svc.id, svc.is_active)}
                        className={`inline-flex items-center justify-center min-w-[76px] px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                          svc.is_active
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300 dark:border dark:border-emerald-500/50 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/50 dark:hover:text-red-400"
                            : "bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-slate-400 hover:bg-emerald-100 hover:text-emerald-700 dark:hover:bg-emerald-900/50 dark:hover:text-emerald-400"
                        }`}
                      >
                        {svc.is_active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/dashboard/services/${svc.id}/edit`}
                          className="text-gray-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          title="Edit service"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => deleteService(svc.id)}
                          className="text-gray-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                          title="Delete service"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}
    </div>
  );
}
