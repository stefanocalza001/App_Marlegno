"use client";

/**
 * @file src/app/(cantiere)/cantiere/[id]/verbale-qualita/page.tsx
 * @description Pagina dedicata alla compilazione del Verbale di Qualità (`/cantiere/[id]/verbale-qualita`).
 * Risolve i dati del cantiere tramite parametro dinamico `id` e renderizza `<VerbaleForm type="Qualità" />`.
 */

import { useParams, useRouter } from "next/navigation";
import { mockCantieri } from "@/mocks/cantieri";
import { VerbaleForm } from "@/components/forms/VerbaleForm";
import { ChevronLeft } from "lucide-react";

/**
 * Pagina `/cantiere/[id]/verbale-qualita` per la redazione di un nuovo Verbale di Qualità.
 *
 * @returns Elemento JSX contenente il pulsante di ritorno e il modulo `VerbaleForm`.
 */
export default function VerbaleQualitaPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const cantiere = mockCantieri.find((c) => c.id === params.id);

  if (!cantiere) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand shadow-sm active:scale-95"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Indietro</span>
        </button>

        <div className="rounded-super bg-white p-6 text-center shadow-sm">
          <p className="text-base font-semibold text-slate-800">
            Cantiere non trovato
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5">
      <div>
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand shadow-sm transition-transform active:scale-95"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Torna al cantiere</span>
        </button>
      </div>

      <VerbaleForm cantiere={cantiere} type="Qualità" />
    </div>
  );
}
