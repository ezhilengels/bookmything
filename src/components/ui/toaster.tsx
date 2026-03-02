"use client";

import { useToast } from "@/lib/hooks/use-toast";
import { X } from "lucide-react";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`rounded-xl p-4 shadow-lg flex items-start gap-3 text-sm animate-in slide-in-from-bottom-2 ${
            toast.variant === "destructive"
              ? "bg-red-600 text-white"
              : "bg-gray-900 text-white"
          }`}
        >
          <div className="flex-1">
            {toast.title && <p className="font-semibold">{toast.title}</p>}
            {toast.description && <p className="opacity-90 mt-0.5">{toast.description}</p>}
          </div>
          <button onClick={() => dismiss(toast.id)} className="opacity-70 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
