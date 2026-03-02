import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { PlusCircle, Clock, Pencil } from "lucide-react";

export const metadata = { title: "Services" };

export default async function ServicesPage() {
  const supabase = await createClient();
  const { data: { session: _sess } } = await supabase.auth.getSession();
  const user = _sess?.user ?? null;
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("business_id").eq("id", user.id).single();
  if (!profile?.business_id) redirect("/onboarding");

  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("business_id", profile.business_id)
    .order("name");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Services</h1>
        <Link
          href="/dashboard/services/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <PlusCircle className="w-4 h-4" /> Add Service
        </Link>
      </div>

      {!services?.length ? (
        <div className="bg-white rounded-xl p-10 text-center shadow-sm">
          <p className="text-gray-500 mb-4">No services yet. Add your first service to start accepting bookings.</p>
          <Link href="/dashboard/services/new" className="text-blue-600 font-medium hover:underline">
            + Add a Service
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
                <th className="px-5 py-3" />
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
                  <td className="px-5 py-3 font-medium text-blue-700">{formatCurrency(svc.price)}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${svc.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {svc.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <Link href={`/dashboard/services/${svc.id}/edit`} className="text-gray-400 hover:text-blue-600">
                      <Pencil className="w-4 h-4" />
                    </Link>
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
