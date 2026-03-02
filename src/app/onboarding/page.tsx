"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { businessSchema, type BusinessInput } from "@/lib/validations/schemas";

const TIMEZONES = [
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Europe/London",
  "Europe/Paris",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Australia/Sydney",
];

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BusinessInput>({
    resolver: zodResolver(businessSchema),
    defaultValues: { timezone: "Asia/Kolkata" },
  });

  // Auto-generate slug from name
  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const name = e.target.value;
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setValue("slug", slug);
  }

  async function onSubmit(data: BusinessInput) {
    setLoading(true);
    setError(null);

    const { data: { session: _sess } } = await supabase.auth.getSession();
  const user = _sess?.user ?? null;
    if (!user) { router.push("/login"); return; }

    // Check slug is unique
    const { data: existing } = await supabase
      .from("businesses")
      .select("id")
      .eq("slug", data.slug)
      .single();

    if (existing) {
      setError("This URL slug is already taken. Please choose a different one.");
      setLoading(false);
      return;
    }

    // Create the business
    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .insert({
        name: data.name,
        slug: data.slug,
        description: data.description ?? null,
        timezone: data.timezone,
        contact_email: data.contact_email,
        contact_phone: data.contact_phone ?? null,
        address: data.address ?? null,
      })
      .select()
      .single();

    if (bizError || !business) {
      setError("Failed to create business. Please try again.");
      setLoading(false);
      return;
    }

    // Update profile: set role to business_admin and link business_id
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ role: "business_admin", business_id: business.id })
      .eq("id", user.id);

    if (profileError) {
      setError("Business created but failed to update your profile. Please contact support.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-blue-700 mb-1">BookMyThing</h1>
          <h2 className="text-xl font-semibold text-gray-900">Set up your business</h2>
          <p className="text-gray-500 text-sm mt-1">This takes less than 2 minutes</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl shadow-sm p-8 space-y-5">

          {/* Business Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label>
            <input
              {...register("name")}
              onChange={(e) => { register("name").onChange(e); handleNameChange(e); }}
              type="text"
              placeholder="e.g. Dr. Smith Clinic"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Booking URL *</label>
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
              <span className="bg-gray-50 px-3 py-2 text-sm text-gray-500 border-r border-gray-300">
                bookmything.com/book/
              </span>
              <input
                {...register("slug")}
                type="text"
                placeholder="dr-smith-clinic"
                className="flex-1 px-3 py-2 text-sm focus:outline-none"
              />
            </div>
            {errors.slug && <p className="text-red-500 text-xs mt-1">{errors.slug.message}</p>}
          </div>

          {/* Contact Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email *</label>
            <input
              {...register("contact_email")}
              type="email"
              placeholder="clinic@example.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.contact_email && <p className="text-red-500 text-xs mt-1">{errors.contact_email.message}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input
              {...register("contact_phone")}
              type="tel"
              placeholder="+91 98765 43210"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Timezone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Timezone *</label>
            <select
              {...register("timezone")}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
            {errors.timezone && <p className="text-red-500 text-xs mt-1">{errors.timezone.message}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              {...register("description")}
              rows={3}
              placeholder="Brief description of your business..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input
              {...register("address")}
              type="text"
              placeholder="123 Main St, Chennai"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Creating your business…" : "Create Business & Go to Dashboard →"}
          </button>
        </form>
      </div>
    </div>
  );
}
