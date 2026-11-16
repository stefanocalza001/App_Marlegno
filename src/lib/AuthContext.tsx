"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, UserRole } from "@/types";
import { MOCK_USERS } from "@/mocks/users";

const STORAGE_KEY = "marlegno_auth_user";

export const ROLE_ROUTES: Record<UserRole, string> = {
  GEOMETRA: "/dashboard",
  RESPONSABILE: "/overview",
  ADMIN: "/utenze",
};

interface AuthContextValue {
  user: User | null;
  isHydrated: boolean;
  loginAs: (ruolo: UserRole) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as User;
        if (parsed && parsed.ruolo && ROLE_ROUTES[parsed.ruolo]) {
          setUser(parsed);
        }
      }
    } catch {
      // Ignora errori di accesso/parsing localStorage
    } finally {
      setIsHydrated(true);
    }
  }, []);

  const loginAs = (ruolo: UserRole) => {
    const selectedUser = MOCK_USERS[ruolo];
    setUser(selectedUser);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedUser));
      window.localStorage.setItem("marlegno_role", ruolo);
    } catch {
      // Ignora errori localStorage
    }
    router.push(ROLE_ROUTES[ruolo]);
  };

  const logout = () => {
    setUser(null);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem("marlegno_role");
    } catch {
      // Ignora errori localStorage
    }
    router.push("/");
  };

  return (
    <AuthContext.Provider value={{ user, isHydrated, loginAs, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve essere utilizzato dentro un AuthProvider");
  }
  return context;
}
