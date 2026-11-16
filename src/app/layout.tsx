/**
 * @file src/app/layout.tsx
 * @description Root Layout globale dell'applicazione Next.js (App Router) per "App Marlegno".
 * Configura i metadati PWA (manifest, icone Apple/Android, viewport bloccata per mobile) e avvolge
 * l'albero dei componenti nel provider di autenticazione `AuthProvider`.
 */

import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/lib/AuthContext";
import "./globals.css";

/**
 * Metadati statici globali della Progressive Web App "App Marlegno".
 */
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

/**
 * Configurazione viewport mobile-first con tema colore `#063D37` e zoom disabilitato
 * per replicare il comportamento nativo su iOS e Android.
 */
export const viewport: Viewport = {
  themeColor: "#063D37",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

/**
 * Componente RootLayout che definisce la struttura HTML di base e inietta `AuthProvider`.
 *
 * @param props - Proprietà contenenti i nodi pagina figli (`children`).
 * @returns Struttura `<html>` e `<body>` radice dell'applicazione.
 */
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
