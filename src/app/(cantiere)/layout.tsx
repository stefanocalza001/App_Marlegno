"use client";

/**
 * @file src/app/(cantiere)/layout.tsx
 * @description Layout condiviso per tutte le rotte dell'Area Operativa Geometra (`(cantiere)`).
 * Fornisce la Topbar sticky con logo aziendale e controllo di logout, e centra il contenuto
 * in un contenitore responsive `max-w-2xl`.
 */

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { LogOut, User as UserIcon } from "lucide-react";

/**
 * Layout dell'area operativa cantiere.
 *
 * @param props - Proprietà contenenti la vista corrente (`children`).
 * @returns Struttura con Topbar bianca e area `main` centrata.
 */
export default function CantiereLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Topbar Sticky Area Operativa */}
      <header className="sticky top-0 z-20 w-full bg-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-5">
          <Link href="/dashboard" className="flex items-center">
            <Image
              src="/assets/Marlegno.webp"
              alt="Logo Marlegno"
              width={130}
              height={32}
              priority
              className="h-auto w-[130px] object-contain"
            />
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 sm:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 text-brand">
                <UserIcon className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium text-slate-700">
                {user?.name ?? "Mario Rossi"}
              </span>
            </div>

            <button
              type="button"
              onClick={logout}
              aria-label="Logout"
              className="inline-flex h-10 items-center gap-1.5 rounded-full bg-slate-100 px-3.5 text-sm font-medium text-slate-700 transition-all hover:bg-slate-200 active:scale-95"
            >
              <LogOut className="h-4 w-4 text-brand" />
              <span>Esci</span>
            </button>
          </div>
        </div>
      </header>

      {/* Contenitore Principale Responsive (100% su mobile, max-w-2xl centrato su tablet/PC) */}
      <main className="mx-auto w-full max-w-2xl flex-1 bg-background px-5 py-6">
        {children}
      </main>
    </div>
  );
}
