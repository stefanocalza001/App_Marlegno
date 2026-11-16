import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/lib/AuthContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "App Marlegno - Mockup",
  description: "Mockup frontend PWA per la gestione cantieri Marlegno",
  manifest: "/manifest.json",
  icons: {
    icon: "/assets/O_green.png",
    apple: "/assets/O_green.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "App Marlegno",
  },
};

export const viewport: Viewport = {
  themeColor: "#063D37",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body className="antialiased min-h-screen bg-background text-slate-900">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
