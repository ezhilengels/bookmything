"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Building2, ExternalLink, ToggleLeft, ToggleRight } from "lucide-react";

export default function AdminBusinessesPage() {
  const [loading, setLoading] = useState(true);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { window.location.href = "/login"; return; }
      const { data } = await supabase
        .from("businesses")
        .select("*, owner:profiles!profiles_business_id_fkey(name, phone)")
        .order("created_at", { ascending: false });
      setBusinesses(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  async function toggleActive(id: string, current: boolean) {
    setTogglingId(id);
    const { error } = await supabase.from("businesses").update({ is_active: !current }).eq("id", id);
    if (!error) setBusinesses(prev => prev.map(b => b.id === id ? { ...b, is_active: !current } : b));
    setTogglingId(null);
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-400 dark:text-slate-500">Loading businesses…</p>
    </div>
  );

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 shrink-0">
          <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Businesses</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">All registered businesses on the platform</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
        {businesses.length === 0 ? (
          <div className="p-12 text-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 mx-auto mb-4">
              <Building2 className="w-8 h-8 text-blue-300 dark:text-blue-600" />
            </div>
            <p className="text-gray-500 dark:text-slate-400 font-medium">No businesses registered yet.</p>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="md:hidden p-3 space-y-3">
              {businesses.map((biz) => (
                <div key={biz.id} className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 shadow-sm overflow-hidden">
                  <div className={`h-0.5 w-full ${biz.is_active ? "bg-emerald-500" : "bg-red-400"}`} />
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-slate-100 leading-tight">{biz.name}</p>
                        {biz.description && <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5 line-clamp-2">{biz.description}</p>}
                      </div>
                      <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                        biz.is_active
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300 dark:border dark:border-emerald-600/50"
                          : "bg-red-100 text-red-600 dark:bg-red-900/60 dark:text-red-300 dark:border dark:border-red-600/50"
                      }`}>
                        {biz.is_active ? "Active" : "Suspended"}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs mb-3">
                      <div className="rounded-lg bg-gray-50 dark:bg-slate-700/60 px-2.5 py-2">
                        <p className="text-[10px] font-bold tracking-wider text-gray-400 dark:text-slate-500 uppercase">Booking Link</p>
                        <p className="mt-0.5 font-mono text-gray-700 dark:text-slate-300 break-all">/book/{biz.slug}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-lg bg-gray-50 dark:bg-slate-700/60 px-2.5 py-2 min-w-0">
                          <p className="text-[10px] font-bold tracking-wider text-gray-400 dark:text-slate-500 uppercase">Contact</p>
                          <p className="mt-0.5 text-gray-700 dark:text-slate-300 truncate">{biz.contact_email ?? "—"}</p>
                        </div>
                        <div className="rounded-lg bg-gray-50 dark:bg-slate-700/60 px-2.5 py-2">
                          <p className="text-[10px] font-bold tracking-wider text-gray-400 dark:text-slate-500 uppercase">Joined</p>
                          <p className="mt-0.5 text-gray-700 dark:text-slate-300">{new Date(biz.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      {biz.contact_phone && (
                        <div className="rounded-lg bg-gray-50 dark:bg-slate-700/60 px-2.5 py-2">
                          <p className="text-[10px] font-bold tracking-wider text-gray-400 dark:text-slate-500 uppercase">Phone</p>
                          <p className="mt-0.5 text-gray-700 dark:text-slate-300">{biz.contact_phone}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-slate-700">
                      <a href={`/book/${biz.slug}`} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors text-xs font-semibold">
                        Open <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button onClick={() => toggleActive(biz.id, biz.is_active)} disabled={togglingId === biz.id}
                        title={biz.is_active ? "Suspend business" : "Activate business"}
                        className="disabled:opacity-50 transition-colors">
                        {biz.is_active
                          ? <ToggleRight className="w-6 h-6 text-emerald-500" />
                          : <ToggleLeft className="w-6 h-6 text-gray-400 dark:text-slate-500" />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-700/50 border-b border-gray-100 dark:border-slate-700">
                    <th className="px-5 py-3">Business</th>
                    <th className="px-5 py-3">Slug / Booking URL</th>
                    <th className="px-5 py-3">Contact</th>
                    <th className="px-5 py-3">Joined</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                  {businesses.map((biz) => (
                    <tr key={biz.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold flex-shrink-0">
                            {biz.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-slate-100">{biz.name}</p>
                            {biz.description && <p className="text-xs text-gray-400 dark:text-slate-500 truncate max-w-[160px]">{biz.description}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-700 px-2 py-1 rounded">/book/{biz.slug}</span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-500 dark:text-slate-400">
                        <div>{biz.contact_email ?? "—"}</div>
                        {biz.contact_phone && <div className="text-gray-400 dark:text-slate-500">{biz.contact_phone}</div>}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-400 dark:text-slate-500">
                        {new Date(biz.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          biz.is_active
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300 dark:border dark:border-emerald-600/50"
                            : "bg-red-100 text-red-600 dark:bg-red-900/60 dark:text-red-300 dark:border dark:border-red-600/50"
                        }`}>
                          {biz.is_active ? "Active" : "Suspended"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <a href={`/book/${biz.slug}`} target="_blank" rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors" title="View booking page">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <button onClick={() => toggleActive(biz.id, biz.is_active)} disabled={togglingId === biz.id}
                            title={biz.is_active ? "Suspend business" : "Activate business"}
                            className="disabled:opacity-50 transition-colors">
                            {biz.is_active
                              ? <ToggleRight className="w-5 h-5 text-emerald-500" />
                              : <ToggleLeft className="w-5 h-5 text-gray-400 dark:text-slate-500" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
