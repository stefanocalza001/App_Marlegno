export type UserRole = "GEOMETRA" | "RESPONSABILE" | "ADMIN";

export interface User {
  id: string;
  email: string;
  password?: string;
  role: UserRole;
  name: string;
}

export type StatoCantiere = "Aperto" | "Chiuso";

export interface Cantiere {
  id: string;
  nome: string;
  indirizzo: string;
  stato: StatoCantiere;
  checklistCompilata: boolean;
  // ultimoSal?: number; // Rimosso riferimento alla percentuale SAL
}
