"use client";

import { Suspense, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { registerSchema, type RegisterInput } from "@/lib/validations/schemas";

export const dynamic = "force-dynamic";

const inputCls =
  "w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors";
const labelCls = "block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1";

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isStaffInvite, setIsStaffInvite] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  useEffect(() => {
    const invite = searchParams.get("invite");
    if (invite) setIsStaffInvite(true);
  }, [searchParams]);

  async function onSubmit(data: RegisterInput) {
    setLoading(true);
    setError(null);
    const invite = searchParams.get("invite");
    const confirmUrl = new URL(`${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/auth/confirm`);
    if (invite) confirmUrl.searchParams.set("invite", invite);
    const { error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { name: data.name },
        emailRedirectTo: confirmUrl.toString(),
      },
    });
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }
    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 px-4">
        <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-8 text-center">
          <div className="text-5xl mb-4">✉️</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-2">Check your email</h2>
          <p className="text-gray-500 dark:text-slate-400 text-sm">
            {isStaffInvite
              ? "We sent a confirmation link to your email. Click it to activate your account and you'll be added as staff automatically."
              : "We sent a confirmation link to your email address. Click it to activate your account."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 px-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-blue-600 mb-1">BookMyThing</h1>
          {isStaffInvite ? (
            <div className="mt-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700/50 rounded-xl px-4 py-3">
              <p className="text-green-800 dark:text-green-300 text-sm font-medium">👋 You&apos;ve been invited as staff!</p>
              <p className="text-green-600 dark:text-green-400 text-xs mt-0.5">Create an account to join your team.</p>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-slate-400 text-sm">Create your account</p>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700/50 rounded-lg text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className={labelCls}>Full Name</label>
            <input
              {...register("name")}
              type="text"
              className={inputCls}
              placeholder="Jane Doe"
            />
            {errors.name && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className={labelCls}>Email</label>
            <input
              {...register("email")}
              type="email"
              className={inputCls}
              placeholder="you@example.com"
            />
            {errors.email && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className={labelCls}>Password</label>
            <input
              {...register("password")}
              type="password"
              className={inputCls}
              placeholder="Min. 8 characters"
            />
            {errors.password && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium disabled:opacity-50 transition-colors shadow-sm shadow-blue-500/30"
          >
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 dark:text-slate-400 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 px-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <RegisterPageContent />
    </Suspense>
  );
}
