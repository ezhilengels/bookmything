"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, haversineKm, formatDistance } from "@/lib/utils";
import { Clock, MapPin, Phone, Mail, Navigation } from "lucide-react";

export default function BusinessBookingPage() {
  const { slug } = useParams<{ slug: string }>();
  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [distance, setDistance] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: biz } = await supabase
        .from("businesses")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

      if (!biz) { setLoading(false); return; }
      setBusiness(biz);

      const { data: svcs } = await supabase
        .from("services")
        .select("*")
        .eq("business_id", biz.id)
        .eq("is_active", true)
        .order("name");

      setServices(svcs ?? []);

      // Get user's location and calculate distance if business has coordinates
      if (biz.latitude && biz.longitude && typeof navigator !== "undefined" && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const km = haversineKm(pos.coords.latitude, pos.coords.longitude, biz.latitude, biz.longitude);
            setDistance(formatDistance(km));
          },
          () => { /* silently ignore if denied */ }
        );
      }

      setLoading(false);
    }
    load();
  }, [slug]);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!business) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-4xl mb-4">🔍</p>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Business not found</h2>
        <p className="text-gray-500 text-sm">This booking page does not exist or is no longer active.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="flex items-start gap-5">
            {business.logo_url ? (
              <img src={business.logo_url} alt={business.name} className="w-16 h-16 rounded-2xl object-cover flex-shrink-0" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl font-bold text-blue-600">{business.name.charAt(0)}</span>
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{business.name}</h1>
              {business.description && <p className="text-gray-600 text-sm mt-1 leading-relaxed">{business.description}</p>}
              <div className="flex flex-wrap gap-3 mt-3">
                {business.address && (
                  <span className="flex items-center gap-1 text-xs text-gray-500"><MapPin className="w-3.5 h-3.5" /> {business.address}</span>
                )}
                {business.contact_phone && (
                  <span className="flex items-center gap-1 text-xs text-gray-500"><Phone className="w-3.5 h-3.5" /> {business.contact_phone}</span>
                )}
                {business.contact_email && (
                  <span className="flex items-center gap-1 text-xs text-gray-500"><Mail className="w-3.5 h-3.5" /> {business.contact_email}</span>
                )}
                {distance && (
                  <span className="flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    <Navigation className="w-3 h-3" /> {distance} away
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Choose a Service</h2>
        {services.length === 0 ? (
          <div className="bg-white rounded-xl p-10 text-center shadow-sm">
            <p className="text-gray-500">No services available at the moment.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {services.map((service) => (
              <Link
                key={service.id}
                href={`/book/${slug}/${service.id}`}
                className="block bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all border-2 border-transparent hover:border-blue-500 group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{service.name}</h3>
                    {service.description && <p className="text-gray-500 text-sm mt-1 leading-relaxed">{service.description}</p>}
                    <div className="flex items-center gap-1 mt-3 text-sm text-gray-500">
                      <Clock className="w-4 h-4" /><span>{service.duration_minutes} min</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-xl font-bold text-blue-700">{formatCurrency(service.price)}</p>
                    <span className="text-xs text-blue-500 mt-1 block group-hover:text-blue-700">Book now →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        <p className="text-center text-xs text-gray-400 mt-8">
          Powered by <span className="font-medium text-blue-500">BookMyThing</span>
        </p>
      </div>
    </div>
  );
}
