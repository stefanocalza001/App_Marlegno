/**
 * @file src/mocks/users.ts
 * @description Dataset fittizio degli utenti abilitati per la simulazione del login RBAC in "App Marlegno".
 */

import { User } from "@/types";

/**
 * Elenco statico dei tre profili utente di test (Geometra, Responsabile, Admin)
 * verificati dal form di login iniziale e dal contesto di autenticazione.
 */
export const mockUsers: User[] = [
  {
    id: "1",
    email: "geometra.test",
    password: "geo",
    role: "GEOMETRA",
    name: "Mario Rossi",
  },
  {
    id: "2",
    email: "responsabile.test",
    password: "resp",
    role: "RESPONSABILE",
    name: "Luigi Verdi",
  },
  {
    id: "3",
    email: "admin.test",
    password: "adm",
    role: "ADMIN",
    name: "Admin di Sistema",
  },
];
