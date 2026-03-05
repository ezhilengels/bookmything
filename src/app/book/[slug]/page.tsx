"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, haversineKm, formatDistance } from "@/lib/utils";
import { Clock, MapPin, Phone, Mail, Navigation, ArrowLeft } from "lucide-react";

export default function BusinessBookingPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
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
      const bizWithCoords = biz as typeof biz & { latitude?: number | null; longitude?: number | null };
      if (bizWithCoords.latitude && bizWithCoords.longitude && typeof navigator !== "undefined" && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const km = haversineKm(
              pos.coords.latitude,
              pos.coords.longitude,
              bizWithCoords.latitude as number,
              bizWithCoords.longitude as number
            );
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
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400 dark:text-slate-500">Loading…</p>
      </div>
    </div>
  );

  if (!business) return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <p className="text-4xl mb-4">🔍</p>
        <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-2">Business not found</h2>
        <p className="text-gray-500 dark:text-slate-400 text-sm">This booking page does not exist or is no longer active.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Business Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-start gap-5">
            {business.logo_url ? (
              <img src={business.logo_url} alt={business.name} className="w-16 h-16 rounded-2xl object-cover flex-shrink-0" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{business.name.charAt(0)}</span>
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{business.name}</h1>
              {business.description && (
                <p className="text-gray-600 dark:text-slate-400 text-sm mt-1 leading-relaxed">{business.description}</p>
              )}
              <div className="flex flex-wrap gap-3 mt-3">
                {business.address && (
                  <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400">
                    <MapPin className="w-3.5 h-3.5" /> {business.address}
                  </span>
                )}
                {business.contact_phone && (
                  <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400">
                    <Phone className="w-3.5 h-3.5" /> {business.contact_phone}
                  </span>
                )}
                {business.contact_email && (
                  <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400">
                    <Mail className="w-3.5 h-3.5" /> {business.contact_email}
                  </span>
                )}
                {distance && (
                  <span className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 px-2 py-0.5 rounded-full">
                    <Navigation className="w-3 h-3" /> {distance} away
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Services */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-slate-100 mb-4">Choose a Service</h2>
        {services.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl p-10 text-center shadow-sm">
            <p className="text-gray-500 dark:text-slate-400">No services available at the moment.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {services.map((service) => (
              <Link
                key={service.id}
                href={`/book/${slug}/${service.id}`}
                className="block bg-white dark:bg-slate-800 border-2 border-transparent dark:border-slate-700 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-blue-500 dark:hover:border-blue-500 transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-slate-100 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                      {service.name}
                    </h3>
                    {service.description && (
                      <p className="text-gray-500 dark:text-slate-400 text-sm mt-1 leading-relaxed">{service.description}</p>
                    )}
                    <div className="flex items-center gap-1 mt-3 text-sm text-gray-500 dark:text-slate-400">
                      <Clock className="w-4 h-4" /><span>{service.duration_minutes} min</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-xl font-bold text-blue-700 dark:text-blue-400">{formatCurrency(service.price)}</p>
                    <span className="text-xs text-blue-500 dark:text-blue-500 mt-1 block group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                      Book now →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        <p className="text-center text-xs text-gray-400 dark:text-slate-600 mt-8">
          Powered by <span className="font-medium text-blue-500 dark:text-blue-400">BookMyThing</span>
        </p>
      </div>
    </div>
  );
}
