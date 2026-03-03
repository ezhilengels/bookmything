"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { PlusCircle, Clock, Pencil, Trash2 } from "lucide-react";

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
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Services</h1>
          <p className="text-sm text-gray-500 mt-1">Manage the services your business offers</p>
        </div>
        <Link
          href="/dashboard/services/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <PlusCircle className="w-4 h-4" /> Add Service
        </Link>
      </div>

      {!services.length ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <Briefcase className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 mb-2 font-medium">No services yet</p>
          <p className="text-gray-400 text-sm mb-6">Add your first service to start accepting bookings.</p>
          <Link href="/dashboard/services/new"
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700">
            + Add Your First Service
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 text-xs uppercase bg-gray-50">
                <th className="px-5 py-3">Service</th>
                <th className="px-5 py-3">Duration</th>
                <th className="px-5 py-3">Price</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {services.map((svc) => (
                <tr key={svc.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <div className="font-medium text-gray-900">{svc.name}</div>
                    {svc.description && <div className="text-gray-400 text-xs mt-0.5 truncate max-w-xs">{svc.description}</div>}
                  </td>
                  <td className="px-5 py-3 text-gray-600">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{svc.duration_minutes} min</span>
                  </td>
                  <td className="px-5 py-3 font-medium text-blue-700">₹{svc.price}</td>
                  <td className="px-5 py-3">
                    <button onClick={() => toggleStatus(svc.id, svc.is_active)}
                      className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                        svc.is_active ? "bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-600" : "bg-gray-100 text-gray-500 hover:bg-green-100 hover:text-green-700"
                      }`}>
                      {svc.is_active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Link href={`/dashboard/services/${svc.id}/edit`} className="text-gray-400 hover:text-blue-600">
                        <Pencil className="w-4 h-4" />
                      </Link>
                      <button onClick={() => deleteService(svc.id)} className="text-gray-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Briefcase({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
    </svg>
  );
}
