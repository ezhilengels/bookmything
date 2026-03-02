import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PlusCircle, User } from "lucide-react";

export const metadata = { title: "Staff" };

export default async function StaffPage() {
  const supabase = await createClient();
  const { data: { session: _sess } } = await supabase.auth.getSession();
  const user = _sess?.user ?? null;
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("business_id").eq("id", user.id).single();
  if (!profile?.business_id) redirect("/onboarding");

  const { data: staff } = await supabase
    .from("profiles")
    .select("*, staff_services(service_id, service:services(name))")
    .eq("business_id", profile.business_id)
    .eq("role", "staff");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Staff</h1>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          <PlusCircle className="w-4 h-4" /> Invite Staff
        </button>
      </div>

      {!staff?.length ? (
        <div className="bg-white rounded-xl p-10 text-center shadow-sm">
          <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No staff members yet. Invite your first team member.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {staff.map((member) => {
            const services = (member.staff_services as { service: { name: string } | null }[])
              ?.map((ss) => ss.service?.name)
              .filter(Boolean) ?? [];
            return (
              <div key={member.id} className="bg-white rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{member.name}</p>
                    <p className="text-gray-400 text-xs">{member.phone ?? "No phone"}</p>
                  </div>
                </div>
                {services.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {services.map((s) => (
                      <span key={s} className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">{s}</span>
                    ))}
                  </div>
                )}
                <a href={`/dashboard/staff/${member.id}`} className="mt-3 block text-xs text-blue-600 hover:underline">
                  Manage availability →
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
