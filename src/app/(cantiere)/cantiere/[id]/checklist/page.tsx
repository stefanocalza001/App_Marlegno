"use client";

import { Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { mockCantieri } from "@/mocks/cantieri";
import { ChecklistForm } from "@/components/forms/ChecklistForm";
import { ChevronLeft } from "lucide-react";

function ChecklistPageContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const isUpdate = searchParams.get("update") === "true";
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

      {/* Form Principale a Singolo Blocco di Scorrimento */}
      <ChecklistForm
        key={isUpdate ? "update" : "new"}
        cantiere={cantiere}
        isUpdate={isUpdate}
      />
    </div>
  );
}

export default function CantiereChecklistPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-2xl p-6 text-sm text-slate-500">Caricamento checklist...</div>}>
      <ChecklistPageContent />
    </Suspense>
  );
}
