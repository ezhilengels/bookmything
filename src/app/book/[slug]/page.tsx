import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils";
import { Clock, DollarSign } from "lucide-react";
import type { Metadata } from "next";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = await createClient();
  const { data: business } = await supabase
    .from("businesses")
    .select("name, description")
    .eq("slug", params.slug)
    .single();
  return { title: business?.name ?? "Book Appointment", description: business?.description ?? "" };
}

export default async function BusinessBookingPage({ params }: Props) {
  const supabase = await createClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("slug", params.slug)
    .eq("is_active", true)
    .single();

  if (!business) return notFound();

  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("business_id", business.id)
    .eq("is_active", true)
    .order("name");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Business header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8 flex items-center gap-4">
          {business.logo_url && (
            <Image src={business.logo_url} alt={business.name} width={64} height={64} className="rounded-xl" />
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{business.name}</h1>
            {business.description && <p className="text-gray-600 text-sm mt-1">{business.description}</p>}
            {business.address && <p className="text-gray-500 text-xs mt-1">{business.address}</p>}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Choose a Service</h2>
        {!services?.length ? (
          <p className="text-gray-500 text-sm">No services available at the moment.</p>
        ) : (
          <div className="grid gap-4">
            {services.map((service) => (
              <Link
                key={service.id}
                href={`/book/${params.slug}/${service.id}`}
                className="block bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow border border-transparent hover:border-blue-200"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{service.name}</h3>
                    {service.description && (
                      <p className="text-gray-500 text-sm mt-1">{service.description}</p>
                    )}
                    <div className="flex gap-4 mt-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" /> {service.duration_minutes} min
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-700">{formatCurrency(service.price)}</p>
                    <span className="text-xs text-blue-600 mt-2 block">Book →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
