"use client";

import { useParams, useRouter } from "next/navigation";
import { mockCantieri } from "@/mocks/cantieri";
import { ChecklistForm } from "@/components/forms/ChecklistForm";
import { ChevronLeft } from "lucide-react";

export default function CantiereChecklistPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const cantiere = mockCantieri.find((c) => c.id === params.id);

  if (!cantiere) {
    return (
      <div className="mx-auto max-w-md space-y-4">
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
    <div className="mx-auto max-w-md space-y-5">
      {/* Header Pagina Checklist */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand shadow-sm transition-transform active:scale-95"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Torna al cantiere</span>
        </button>

        <div className="px-1">
          <span className="inline-block rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand">
            Modulo Sicurezza Cantiere
          </span>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Checklist Sicurezza
          </h1>
        </div>
      </div>

      {/* Form Principale a Singolo Blocco di Scorrimento */}
      <ChecklistForm cantiere={cantiere} />
    </div>
  );
}
