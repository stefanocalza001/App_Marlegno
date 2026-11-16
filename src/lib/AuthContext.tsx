"use client";

/**
 * @file src/lib/AuthContext.tsx
 * @description Contesto React per la gestione dell'autenticazione simulata (RBAC) e della persistenza di sessione
 * in `localStorage` per il mockup PWA "App Marlegno".
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { User, UserRole } from "@/types";
import { mockUsers } from "@/mocks/users";

/** Chiave utilizzata in `localStorage` per persistere il profilo dell'utente autenticato. */
const STORAGE_KEY = "marlegno_auth_user";

/** Chiave secondaria in `localStorage` per la lettura rapida del ruolo attivo. */
const ROLE_STORAGE_KEY = "marlegno_role";

/**
 * Mappa di instradamento che associa ciascun ruolo RBAC alla propria rotta iniziale dedicata.
 */
export const ROLE_ROUTES: Record<UserRole, string> = {
  GEOMETRA: "/dashboard",
  RESPONSABILE: "/overview",
  ADMIN: "/utenze",
};

/**
 * Contratto dei valori e dei metodi esposti dal contesto `AuthContext`.
 */
interface AuthContextValue {
  /** Oggetto utente attualmente autenticato, oppure `null` se non loggato. */
  user: User | null;
  /** Flag booleano che indica il completamento dell'idratazione iniziale da `localStorage`. */
  isHydrated: boolean;
  /** Verifica le credenziali fornite, salva la sessione e reindirizza alla dashboard di competenza. */
  login: (email: string, password: string) => User | null;
  /** Cancella la sessione attiva da stato e `localStorage` riportando l'utente alla schermata di login. */
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Provider globale dello stato di autenticazione RBAC.
 * Al mount legge eventuali dati salvati in `localStorage` per mantenere la sessione anche offline.
 *
 * @param props - Proprietà del componente contenenti i nodi figli (`children`).
 * @returns Elemento JSX del provider di autenticazione.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const router = useRouter();

  // Idratazione iniziale della sessione da localStorage al caricamento lato client
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
      // Ignora errori di accesso o parsing del localStorage in modalità privata/offline
    } finally {
      setIsHydrated(true);
    }
  }, []);

  /**
   * Esegue il login simulato confrontando email e password con l'array `mockUsers`.
   */
  const login = useCallback(
    (email: string, password: string): User | null => {
      const normalizedEmail = email.trim().toLowerCase();
      const matched = mockUsers.find(
        (u) =>
          u.email.toLowerCase() === normalizedEmail && u.password === password
      );

      if (!matched) {
        return null;
      }

      // Costruisce l'oggetto utente di sessione omettendo la password per pulizia
      const sessionUser: User = {
        id: matched.id,
        email: matched.email,
        role: matched.role,
        name: matched.name,
      };

      setUser(sessionUser);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionUser));
        window.localStorage.setItem(ROLE_STORAGE_KEY, sessionUser.role);
      } catch {
        // Ignora eventuali blocchi di scrittura su localStorage
      }

      router.push(ROLE_ROUTES[sessionUser.role]);
      return sessionUser;
    },
    [router]
  );

  /**
   * Effettua il logout rimuovendo i dati di sessione e reindirizzando alla root `/`.
   */
  const logout = useCallback(() => {
    setUser(null);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(ROLE_STORAGE_KEY);
    } catch {
      // Ignora eventuali blocchi di accesso a localStorage
    }
    router.push("/");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, isHydrated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook per accedere in modo tipizzato al contesto di autenticazione `AuthContext`.
 *
 * @throws {Error} Se invocato al di fuori della gerarchia di `<AuthProvider>`.
 * @returns Oggetto `AuthContextValue` con stato utente e funzioni `login` / `logout`.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve essere utilizzato dentro un AuthProvider");
  }
  return context;
}
