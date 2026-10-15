import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { InstallHint } from "@/components/install-hint";
import { SyncProvider } from "@/components/sync-provider";
import { Toaster } from "sonner";
import { BadgeCheck, CircleX } from "lucide-react";
import "./globals.css";

const cairo = localFont({
  src: [
    { path: "../../public/fonts/cairo-400.ttf", weight: "400", style: "normal" },
    { path: "../../public/fonts/cairo-700.ttf", weight: "700", style: "normal" },
    { path: "../../public/fonts/cairo-800.ttf", weight: "800", style: "normal" },
  ],
  variable: "--font-cairo",
  display: "swap",
  fallback: ["Arial", "sans-serif"],
});

export const metadata: Metadata = {
  title: "Crest Supply",
  description: "متابعة رحلات التوريد من المورد إلى المصنع",
  manifest: "/manifest.webmanifest",
  applicationName: "Crest Supply",
  appleWebApp: { capable: true, title: "Crest Supply", statusBarStyle: "default" },
  icons: { apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = { themeColor: "#2E762D", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ar" dir="rtl"><body className={cairo.variable}><SyncProvider />{children}<InstallHint /><Toaster position="top-center" dir="rtl" icons={{ success: <BadgeCheck className="text-green-700" />, error: <CircleX className="text-orange-700" /> }} toastOptions={{ className: "border border-green-100 bg-white text-green-900", style: { background: "#FFFFFF", color: "#0F2A10", borderColor: "#E3F4E2" } }} /></body></html>;
}
