"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { mockCantieri } from "@/mocks/cantieri";
import {
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  ShieldAlert,
  AlertTriangle,
  MapPin,
  CheckCircle2,
} from "lucide-react";

function CantiereDetailContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showSavedToast, setShowSavedToast] = useState(false);

  useEffect(() => {
    if (searchParams.get("saved") === "1") {
      setShowSavedToast(true);
      const timer = setTimeout(() => setShowSavedToast(false), 3500);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

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

  const checklistSubtitle = cantiere.checklistCompilata
    ? "Aggiornamento Checklist"
    : "Prima compilazione";

  const checklistHref = cantiere.checklistCompilata
    ? `/cantiere/${cantiere.id}/checklist?update=true`
    : `/cantiere/${cantiere.id}/checklist`;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      {showSavedToast && (
        <div
          role="status"
          className="fixed top-20 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Documento salvato con successo</span>
        </div>
      )}

      {/* Header con bottone Indietro e Nome Cantiere */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand shadow-sm transition-transform active:scale-95"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Indietro</span>
        </button>

        <div className="px-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {cantiere.nome}
          </h1>
          <div className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
            <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
            <span>{cantiere.indirizzo}</span>
          </div>
        </div>
      </div>

      {/* Sezione Modelli Documentali (3 Bottoni Grandi Touch-Friendly) */}
      <div className="space-y-4">
        <h2 className="px-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Modelli Documentali
        </h2>

        {/* 1. Checklist Cantiere (Evidenziata con sfondo verde chiaro) */}
        <Link
          href={checklistHref}
          className="flex h-28 w-full items-center justify-between rounded-super border border-brand/20 bg-brand/[0.08] p-5 text-left shadow-sm transition-transform duration-150 active:scale-[0.98]"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand text-white shadow-sm">
              <ClipboardCheck className="h-7 w-7" />
            </div>
            <div>
              <span className="block text-lg font-bold text-brand">
                Checklist Cantiere
              </span>
              <span className="mt-0.5 block text-sm font-medium text-brand/80">
                {checklistSubtitle}
              </span>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-brand" />
        </Link>

        {/* 2. Verbale Sicurezza */}
        <Link
          href={`/cantiere/${cantiere.id}/checklist`}
          className="flex h-28 w-full items-center justify-between rounded-super bg-white p-5 text-left shadow-sm transition-transform duration-150 active:scale-[0.98]"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
              <ShieldAlert className="h-7 w-7" />
            </div>
            <div>
              <span className="block text-lg font-bold text-slate-900">
                Verbale Sicurezza
              </span>
              <span className="mt-0.5 block text-sm font-medium text-slate-500">
                Crea nuovo verbale
              </span>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
        </Link>

        {/* 3. Verbale Qualità */}
        <button
          type="button"
          className="flex h-28 w-full items-center justify-between rounded-super bg-white p-5 text-left shadow-sm transition-transform duration-150 active:scale-[0.98]"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <div>
              <span className="block text-lg font-bold text-slate-900">
                Verbale Qualità
              </span>
              <span className="mt-0.5 block text-sm font-medium text-slate-500">
                Crea nuovo verbale
              </span>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
        </button>
      </div>
    </div>
  );
}

export default function CantiereDetailPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-2xl p-6 text-sm text-slate-500">Caricamento cantiere...</div>}>
      <CantiereDetailContent />
    </Suspense>
  );
}
