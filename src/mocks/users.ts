import { User, UserRole } from "@/types";

export const MOCK_USERS: Record<UserRole, User> = {
  GEOMETRA: {
    id: "usr-geometra-01",
    nome: "Marco Rossi",
    ruolo: "GEOMETRA",
  },
  RESPONSABILE: {
    id: "usr-responsabile-01",
    nome: "Laura Bianchi",
    ruolo: "RESPONSABILE",
  },
  ADMIN: {
    id: "usr-admin-01",
    nome: "Amministratore Sistema",
    ruolo: "ADMIN",
  },
};
