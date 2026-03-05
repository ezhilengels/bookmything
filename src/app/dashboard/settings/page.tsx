"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Copy, Check, ExternalLink, Loader2, MapPin, Settings } from "lucide-react";
import { copyText } from "@/lib/clipboard";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [geoStatus, setGeoStatus] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number | null; lng: number | null }>({ lat: null, lng: null });
  const [business, setBusiness] = useState<any>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    address: "",
    contact_phone: "",
    contact_email: "",
    timezone: "Asia/Kolkata",
  });
  const supabase = createClient();

  const TIMEZONES = [
    "Asia/Kolkata", "Asia/Dubai", "Asia/Singapore", "Asia/Tokyo",
    "Europe/London", "Europe/Paris", "America/New_York",
    "America/Los_Angeles", "Australia/Sydney",
  ];

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { window.location.href = "/login"; return; }
      const { data: profile } = await supabase
        .from("profiles").select("business_id").eq("id", session.user.id).single();
      if (!profile?.business_id) { window.location.href = "/onboarding"; return; }
      setBusinessId(profile.business_id);
      const { data: biz } = await supabase.from("businesses").select("*").eq("id", profile.business_id).single();
      if (biz) {
        const bizWithCoords = biz as typeof biz & { latitude?: number | null; longitude?: number | null };
        setBusiness(biz);
        setForm({
          name: biz.name ?? "",
          description: biz.description ?? "",
          address: biz.address ?? "",
          contact_phone: biz.contact_phone ?? "",
          contact_email: biz.contact_email ?? "",
          timezone: biz.timezone ?? "Asia/Kolkata",
        });
        setCoords({ lat: bizWithCoords.latitude ?? null, lng: bizWithCoords.longitude ?? null });
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!businessId) return;
    setSaving(true);
    const { error } = await supabase.from("businesses").update({
      name: form.name.trim(),
      description: form.description.trim() || null,
      address: form.address.trim() || null,
      contact_phone: form.contact_phone.trim() || null,
      contact_email: form.contact_email.trim(),
      timezone: form.timezone,
    }).eq("id", businessId);
    setSaving(false);
    if (error) { alert("Failed to save: " + error.message); return; }
    alert("Settings saved!");
  }

  async function geocodeAddress() {
    if (!form.address.trim()) { setGeoStatus("Please enter an address first."); return; }
    if (!businessId) return;
    setGeocoding(true);
    setGeoStatus(null);
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(form.address)}&format=json&limit=1`;
      const res = await fetch(url, { headers: { "User-Agent": "BookMyThing/1.0" } });
      const data = await res.json();
      if (!data || data.length === 0) { setGeoStatus("Address not found. Try a more specific address."); setGeocoding(false); return; }
      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);
      const { error } = await supabase
        .from("businesses")
        .update({ latitude: lat, longitude: lng } as unknown as never)
        .eq("id", businessId);
      if (error) { setGeoStatus("Failed to save location."); }
      else {
        setCoords({ lat, lng });
        setGeoStatus(`✓ Location saved! (${lat.toFixed(5)}, ${lng.toFixed(5)})`);
      }
    } catch {
      setGeoStatus("Geocoding failed. Check your internet connection.");
    }
    setGeocoding(false);
  }

  async function copyBookingLink() {
    if (!business?.slug) return;
    const url = `${window.location.origin}/book/${business.slug}`;
    const ok = await copyText(url);
    if (!ok) { alert("Copy failed. Please select and copy the link manually."); return; }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-400 dark:text-slate-500">Loading settings…</p>
    </div>
  );

  const bookingUrl = business?.slug
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/book/${business.slug}`
    : "";

  // Shared input class
  const inputCls = "w-full px-3.5 py-2.5 border border-gray-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors";
  const labelCls = "block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5";

  return (
    <div className="max-w-xl">
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 dark:bg-slate-700 shrink-0">
          <Settings className="w-5 h-5 text-gray-600 dark:text-slate-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Settings</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
            Manage your business profile and booking link
          </p>
        </div>
      </div>

      {/* Booking Link Card */}
      {business?.slug && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 rounded-2xl p-5 mb-5">
          <p className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-0.5">Your Booking Link</p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mb-3">
            Share this link with customers so they can book appointments.
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-white dark:bg-slate-700 border border-blue-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-slate-200 truncate font-mono">
              {bookingUrl}
            </div>
            <button
              onClick={copyBookingLink}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied!" : "Copy"}
            </button>
            <a
              href={`/book/${business.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 border border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300 px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-800/40 transition-colors flex-shrink-0"
            >
              <ExternalLink className="w-4 h-4" /> Preview
            </a>
          </div>
        </div>
      )}

      {/* Business Settings Form */}
      <form
        onSubmit={handleSave}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 space-y-5"
      >
        <div>
          <label className={labelCls}>
            Business Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>Description</label>
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            rows={3}
            placeholder="Briefly describe your business…"
            className={`${inputCls} resize-none`}
          />
        </div>

        <div>
          <label className={labelCls}>Address</label>
          <input
            type="text"
            value={form.address}
            onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
            placeholder="123 Main St, City"
            className={inputCls}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Contact Phone</label>
            <input
              type="tel"
              value={form.contact_phone}
              onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))}
              placeholder="+91 9876543210"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>
              Contact Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={form.contact_email}
              onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))}
              className={inputCls}
            />
          </div>
        </div>

        <div>
          <label className={labelCls}>Timezone</label>
          <select
            value={form.timezone}
            onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))}
            className={inputCls}
          >
            {TIMEZONES.map(tz => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-60 transition-colors shadow-sm shadow-blue-500/30"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {saving ? "Saving…" : "Save Settings"}
        </button>
      </form>

      {/* Business Location Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 mt-5">
        <div className="flex items-center gap-2 mb-1">
          <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Business Location</h2>
        </div>
        <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">
          Used to show distance to customers on the booking page. Enter your address above and click Geocode to set coordinates automatically.
        </p>

        {coords.lat && coords.lng ? (
          <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700/50 rounded-lg px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300 mb-4 font-mono">
            📍 {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
          </div>
        ) : (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-lg px-3 py-2 text-xs text-amber-700 dark:text-amber-300 mb-4">
            No location set yet. Click Geocode to auto-detect from your address.
          </div>
        )}

        <button
          type="button"
          onClick={geocodeAddress}
          disabled={geocoding}
          className="flex items-center gap-2 bg-slate-800 dark:bg-slate-600 hover:bg-slate-700 dark:hover:bg-slate-500 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60 transition-colors"
        >
          {geocoding ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
          {geocoding ? "Geocoding…" : "Geocode from Address"}
        </button>

        {geoStatus && (
          <p className={`text-xs mt-2 font-medium ${geoStatus.startsWith("✓") ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
            {geoStatus}
          </p>
        )}
      </div>
    </div>
  );
}
