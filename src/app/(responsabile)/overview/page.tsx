"use client";

/**
 * @file src/app/(responsabile)/overview/page.tsx
 * @description Vista direzionale di supervisione dedicata al ruolo `RESPONSABILE` (`/overview`).
 */

import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/Button";
import { Briefcase, LogOut } from "lucide-react";

/**
 * Pagina principale di overview per il Responsabile di commessa/sicurezza.
 *
 * @returns Elemento JSX della vista Responsabile.
 */
export default function ResponsabileOverviewPage() {
  const { user, logout } = useAuth();

  return (
    <main className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="flex items-center justify-between rounded-super bg-surface p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
              <Briefcase className="h-6 w-6" />
            </div>
            <div>
              <span className="inline-block rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand">
                Area Responsabile
              </span>
              <h1 className="text-xl font-bold text-slate-900">
                Overview Cantieri
              </h1>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={logout} aria-label="Esci">
            <LogOut className="h-4 w-4" />
            <span>Esci</span>
          </Button>
        </header>

        <section className="rounded-super bg-surface p-6 shadow-sm">
          <p className="text-sm text-slate-500">Utente attivo</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">
            {user?.name ?? "Luigi Verdi"} ({user?.role ?? "RESPONSABILE"})
          </p>
          {user?.email && (
            <p className="text-xs text-slate-400">{user.email}</p>
          )}
          <p className="mt-3 text-sm text-slate-600">
            Benvenuto nella vista di supervisione e monitoraggio stato avanzamento cantieri.
          </p>
        </section>
      </div>
    </main>
  );
}
