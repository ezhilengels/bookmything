"use client";

import { useState, useCallback } from "react";

interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}

let toastState: Toast[] = [];
let listeners: ((toasts: Toast[]) => void)[] = [];

function notify() {
  listeners.forEach((l) => l([...toastState]));
}

export function toast(t: Omit<Toast, "id">) {
  const id = Math.random().toString(36).slice(2);
  toastState = [...toastState, { ...t, id }];
  notify();
  setTimeout(() => {
    toastState = toastState.filter((x) => x.id !== id);
    notify();
  }, 5000);
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useState(() => {
    listeners.push(setToasts);
    return () => { listeners = listeners.filter((l) => l !== setToasts); };
  });

  const dismiss = useCallback((id: string) => {
    toastState = toastState.filter((t) => t.id !== id);
    notify();
  }, []);

  return { toasts, dismiss };
}
