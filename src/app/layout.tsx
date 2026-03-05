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
      <head>
        {/* Anti-FOUC: apply dark class before first paint so there's no flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('theme');var p=window.matchMedia('(prefers-color-scheme: dark)').matches;if(s==='dark'||(s!=='light'&&p)){document.documentElement.classList.add('dark')}}catch(e){}})();`,
          }}
        />
      </head>
      <body style={{ fontFamily: "Inter, system-ui, -apple-system, sans-serif" }}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
