"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth, ROLE_ROUTES } from "@/lib/AuthContext";
import { mockUsers } from "@/mocks/users";

export default function HomePage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const normalizedEmail = email.trim().toLowerCase();
    const matchedUser = mockUsers.find(
      (u) =>
        u.email.toLowerCase() === normalizedEmail && u.password === password
    );

    if (!matchedUser) {
      setError("Credenziali non valide. Controlla email e password.");
      return;
    }

    // Aggiorna AuthContext + localStorage e reindirizza con useRouter
    login(matchedUser.email, matchedUser.password ?? "");
    router.push(ROLE_ROUTES[matchedUser.role]);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-sm space-y-10">
        {/* Logo Esteso Marlegno */}
        <div className="flex flex-col items-center space-y-3 text-center">
          <Image
            src="/assets/Marlegno.webp"
            alt="Logo Marlegno"
            width={260}
            height={65}
            priority
            className="h-auto w-[260px] object-contain"
          />
          <p className="text-sm font-medium text-slate-500">
            Portale Operativo Cantieri
          </p>
        </div>

        {/* Form di Login Simulato */}
        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-super bg-surface p-6 shadow-sm"
          noValidate
        >
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-sm font-semibold text-slate-700"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="text"
              inputMode="email"
              autoComplete="username"
              placeholder="es. geometra.test"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
              }}
              required
              className="h-14 w-full rounded-super border border-slate-200 bg-background px-4 text-base text-slate-900 placeholder:text-slate-400 focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-slate-700"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Inserisci la password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(null);
              }}
              required
              className="h-14 w-full rounded-super border border-slate-200 bg-background px-4 text-base text-slate-900 placeholder:text-slate-400 focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-2xl bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-600"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            className="flex h-14 w-full items-center justify-center rounded-super bg-brand px-6 text-lg font-semibold text-white shadow-sm transition-transform duration-150 hover:bg-brand-hover active:scale-95"
          >
            Accedi
          </button>
        </form>
      </div>
    </main>
  );
}
