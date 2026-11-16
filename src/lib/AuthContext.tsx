"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, UserRole } from "@/types";
import { mockUsers } from "@/mocks/users";

const STORAGE_KEY = "marlegno_auth_user";

export const ROLE_ROUTES: Record<UserRole, string> = {
  GEOMETRA: "/dashboard",
  RESPONSABILE: "/overview",
  ADMIN: "/utenze",
};

interface AuthContextValue {
  user: User | null;
  isHydrated: boolean;
  login: (email: string, password: string) => User | null;
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
        if (parsed && parsed.role && ROLE_ROUTES[parsed.role]) {
          setUser(parsed);
        }
      }
    } catch {
      // Ignora errori di accesso/parsing localStorage
    } finally {
      setIsHydrated(true);
    }
  }, []);

  const login = (email: string, password: string): User | null => {
    const normalizedEmail = email.trim().toLowerCase();
    const matched = mockUsers.find(
      (u) =>
        u.email.toLowerCase() === normalizedEmail && u.password === password
    );

    if (!matched) {
      return null;
    }

    const sessionUser: User = {
      id: matched.id,
      email: matched.email,
      role: matched.role,
      name: matched.name,
    };

    setUser(sessionUser);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionUser));
      window.localStorage.setItem("marlegno_role", sessionUser.role);
    } catch {
      // Ignora errori localStorage
    }

    router.push(ROLE_ROUTES[sessionUser.role]);
    return sessionUser;
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
    <AuthContext.Provider value={{ user, isHydrated, login, logout }}>
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
