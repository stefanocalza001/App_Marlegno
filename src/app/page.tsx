"use client";

import Image from "next/image";
import { useAuth } from "@/lib/AuthContext";
import { HardHat, Briefcase, ShieldCheck } from "lucide-react";

export default function HomePage() {
  const { loginAs } = useAuth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-between bg-background px-6 py-12">
      <div className="w-full" />

      {/* Card Centrale Login Simulato */}
      <div className="flex w-full max-w-sm flex-col items-center space-y-10">
        {/* Area Logo Ufficiale Marlegno */}
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-super bg-brand shadow-md">
            <Image
              src="/assets/O_white.webp"
              alt="Pittogramma Marlegno"
              width={48}
              height={48}
              priority
              className="object-contain"
            />
          </div>
          <Image
            src="/assets/Marlegno.webp"
            alt="Logo Marlegno"
            width={200}
            height={50}
            priority
            className="h-auto w-[200px] object-contain"
          />
          <p className="text-sm font-medium text-slate-500">
            Portale Operativo Cantieri • Seleziona il tuo profilo
          </p>
        </div>

        {/* Pulsanti RBAC Principali (Stile Supercerchio Apple-like) */}
        <div className="flex w-full flex-col space-y-4">
          <button
            type="button"
            onClick={() => loginAs("GEOMETRA")}
            className="flex h-14 w-full items-center justify-center gap-3 rounded-super bg-brand px-6 text-lg font-semibold text-white shadow-sm transition-transform duration-150 active:scale-95 hover:bg-brand-hover"
          >
            <HardHat className="h-5 w-5" />
            <span>Accedi come Geometra</span>
          </button>

          <button
            type="button"
            onClick={() => loginAs("RESPONSABILE")}
            className="flex h-14 w-full items-center justify-center gap-3 rounded-super border-2 border-brand bg-white px-6 text-lg font-semibold text-brand shadow-sm transition-transform duration-150 active:scale-95 hover:bg-brand/5"
          >
            <Briefcase className="h-5 w-5" />
            <span>Accedi come Responsabile</span>
          </button>
        </div>
      </div>

      {/* Link Accesso Admin in basso */}
      <div className="pt-8">
        <button
          type="button"
          onClick={() => loginAs("ADMIN")}
          className="inline-flex items-center gap-1.5 py-2 px-4 text-sm font-medium text-gray-500 transition-colors hover:text-brand active:scale-95"
        >
          <ShieldCheck className="h-4 w-4" />
          <span className="underline underline-offset-4">Accesso Admin</span>
        </button>
      </div>
    </main>
  );
}
