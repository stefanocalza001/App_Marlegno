"use client";

/**
 * @file src/app/(cantiere)/dashboard/page.tsx
 * @description Dashboard operativa principale per il ruolo Geometra (`/dashboard`).
 * Filtra e visualizza esclusivamente i cantieri con stato `"Aperto"`, permettendo l'accesso
 * rapido alla pagina documentale di ciascun cantiere.
 */

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { mockCantieri } from "@/mocks/cantieri";
import { HardHat, MapPin, ChevronRight, CheckCircle2 } from "lucide-react";

/**
 * Contenuto interno della Dashboard Geometra.
 * Filtra i cantieri aperti da `mockCantieri` e mostra un eventuale toast di conferma
 * quando la query string contiene `?pdfSaved=1`.
 *
 * @returns Elemento JSX con l'elenco delle card dei cantieri attivi.
 */
function DashboardContent() {
  const searchParams = useSearchParams();
  const [showPdfToast, setShowPdfToast] = useState(false);

  // Mostra una notifica temporanea se si proviene da un salvataggio PDF
  useEffect(() => {
    if (searchParams.get("pdfSaved") === "1") {
      setShowPdfToast(true);
      const timer = setTimeout(() => setShowPdfToast(false), 3500);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  // Filtra i soli cantieri attualmente aperti in lavorazione
  const cantieriAttivi = mockCantieri.filter(
    (cantiere) => cantiere.stato === "Aperto"
  );

  return (
    <div className="mx-auto w-full max-w-2xl">
      {showPdfToast && (
        <div
          role="status"
          className="fixed top-20 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>PDF salvato in locale</span>
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          I tuoi cantieri attivi
        </h1>
        <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
          {cantieriAttivi.length} attivi
        </span>
      </div>

      <div>
        {cantieriAttivi.map((cantiere) => (
          <Link
            key={cantiere.id}
            href={`/cantiere/${cantiere.id}`}
            className="block rounded-super bg-white p-5 mb-4 shadow-sm transition-transform duration-150 active:scale-[0.98]"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                  <HardHat className="h-6 w-6" />
                </div>

                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-slate-900">
                    {cantiere.nome}
                  </h2>
                  <div className="flex items-center gap-1.5 text-sm text-slate-500">
                    <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                    <span>{cantiere.indirizzo}</span>
                  </div>
                </div>
              </div>

              <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

/**
 * Pagina `/dashboard` avvolta in un boundary `<Suspense>` per l'uso sicuro di `useSearchParams` in Next.js.
 *
 * @returns Elemento JSX della pagina Dashboard Geometra.
 */
export default function GeometraDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl p-4 text-sm text-slate-500">
          Caricamento cantieri...
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
