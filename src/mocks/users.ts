import { User } from "@/types";

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
