import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: { default: "BookMyThing", template: "%s | BookMyThing" },
  description: "Smart appointment booking for clinics, salons, coaches and more.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "Inter, system-ui, -apple-system, sans-serif" }}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
