export type UserRole = "GEOMETRA" | "RESPONSABILE" | "ADMIN";

export interface User {
  id: string;
  email: string;
  password?: string;
  role: UserRole;
  name: string;
}
