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
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Businesses</h1>
        <p className="text-sm text-gray-500 mt-1">All registered businesses on the platform</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {businesses.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500">No businesses registered yet.</p>
          </div>
        ) : (
          <>
            <div className="md:hidden p-3 space-y-2">
              {businesses.map((biz) => (
                <div key={biz.id} className="rounded-xl border border-gray-200 shadow-sm p-3 bg-white">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 leading-tight">{biz.name}</p>
                      {biz.description && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{biz.description}</p>}
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${biz.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                      {biz.is_active ? "Active" : "Suspended"}
                    </span>
                  </div>
                  <div className="mt-3 space-y-2 text-xs">
                    <div className="rounded-lg bg-gray-50 px-2.5 py-2">
                      <p className="text-[10px] font-semibold tracking-wide text-gray-500 uppercase">Link</p>
                      <p className="mt-0.5 font-mono text-gray-700 break-all">/book/{biz.slug}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-lg bg-gray-50 px-2.5 py-2 min-w-0">
                        <p className="text-[10px] font-semibold tracking-wide text-gray-500 uppercase">Contact</p>
                        <p className="mt-0.5 text-gray-700 truncate">{biz.contact_email}</p>
                      </div>
                      <div className="rounded-lg bg-gray-50 px-2.5 py-2">
                        <p className="text-[10px] font-semibold tracking-wide text-gray-500 uppercase">Joined</p>
                        <p className="mt-0.5 text-gray-700">{new Date(biz.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    {biz.contact_phone && (
                      <div className="rounded-lg bg-gray-50 px-2.5 py-2">
                        <p className="text-[10px] font-semibold tracking-wide text-gray-500 uppercase">Phone</p>
                        <p className="mt-0.5 text-gray-700">{biz.contact_phone}</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <a
                      href={`/book/${biz.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors text-xs font-medium"
                      title="View booking page"
                    >
                      Open
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => toggleActive(biz.id, biz.is_active)}
                      disabled={togglingId === biz.id}
                      title={biz.is_active ? "Suspend business" : "Activate business"}
                      className="text-gray-400 hover:text-gray-700 disabled:opacity-50 transition-colors"
                    >
                      {biz.is_active
                        ? <ToggleRight className="w-5 h-5 text-green-500" />
                        : <ToggleLeft className="w-5 h-5 text-gray-400" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 text-xs uppercase bg-gray-50">
                  <th className="px-5 py-3">Business</th>
                  <th className="px-5 py-3">Slug / Booking URL</th>
                  <th className="px-5 py-3">Contact</th>
                  <th className="px-5 py-3">Joined</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {businesses.map((biz) => (
                  <tr key={biz.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 font-bold flex-shrink-0">
                          {biz.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{biz.name}</p>
                          {biz.description && <p className="text-xs text-gray-400 truncate max-w-[160px]">{biz.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-mono text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">/book/{biz.slug}</span>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-500">
                      <div>{biz.contact_email}</div>
                      {biz.contact_phone && <div className="text-gray-400">{biz.contact_phone}</div>}
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-400">
                      {new Date(biz.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${biz.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                        {biz.is_active ? "Active" : "Suspended"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <a
                          href={`/book/${biz.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                          title="View booking page"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => toggleActive(biz.id, biz.is_active)}
                          disabled={togglingId === biz.id}
                          title={biz.is_active ? "Suspend business" : "Activate business"}
                          className="text-gray-400 hover:text-gray-700 disabled:opacity-50 transition-colors"
                        >
                          {biz.is_active
                            ? <ToggleRight className="w-5 h-5 text-green-500" />
                            : <ToggleLeft className="w-5 h-5 text-gray-400" />}
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
