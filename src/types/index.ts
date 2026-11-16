/**
 * @file src/types/index.ts
 * @description Definizioni centralizzate delle interfacce e dei tipi TypeScript per il mockup PWA "App Marlegno".
 * Copre la modellazione dei ruoli utente (RBAC), dei profili di autenticazione e dell'anagrafica cantieri.
 */

/**
 * Ruoli applicativi supportati dal sistema RBAC (Role-Based Access Control).
 * - `GEOMETRA`: Operatore di cantiere abilitato alla compilazione di checklist e verbali.
 * - `RESPONSABILE`: Supervisore con vista di monitoraggio trasversale sui cantieri.
 * - `ADMIN`: Amministratore di sistema per la gestione di utenze e permessi.
 */
export type UserRole = "GEOMETRA" | "RESPONSABILE" | "ADMIN";

/**
 * Rappresenta il profilo di un utente registrato nell'applicazione.
 */
export interface User {
  /** Identificativo univoco dell'utente. */
  id: string;
  /** Indirizzo email o username utilizzato in fase di autenticazione. */
  email: string;
  /** Password in chiaro usata esclusivamente per la verifica nel mockup locale (omessa nella sessione attiva). */
  password?: string;
  /** Ruolo assegnato all'utente per lo smistamento RBAC. */
  role: UserRole;
  /** Nome e cognome completi dell'utente visualizzati nell'interfaccia e nei PDF. */
  name: string;
}

/**
 * Stato operativo di avanzamento di un cantiere Marlegno.
 */
export type StatoCantiere = "Aperto" | "Chiuso";

/**
 * Rappresenta l'entità anagrafica e operativa di un cantiere edilizio.
 */
export interface Cantiere {
  /** Identificativo univoco del cantiere (usato anche nelle rotte dinamiche `/cantiere/[id]`). */
  id: string;
  /** Denominazione ufficiale del cantiere o della commessa. */
  nome: string;
  /** Indirizzo fisico completo del cantiere (via, numero civico, località). */
  indirizzo: string;
  /** Stato corrente del cantiere (`"Aperto"` visibile in dashboard operativa, `"Chiuso"` archiviato). */
  stato: StatoCantiere;
  /** Indica se per il cantiere esiste già una prima compilazione della Checklist Sicurezza. */
  checklistCompilata: boolean;
}
