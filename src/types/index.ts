export type UserRole = "GEOMETRA" | "RESPONSABILE" | "ADMIN";

export interface User {
  id: string;
  nome: string;
  ruolo: UserRole;
}
