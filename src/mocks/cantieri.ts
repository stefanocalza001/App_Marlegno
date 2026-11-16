import { Cantiere } from "@/types";

export const mockCantieri: Cantiere[] = [
  {
    id: "cant-01",
    nome: "Residenziale Parco",
    indirizzo: "Via Roma 1, Bergamo",
    stato: "Aperto",
    ultimoSal: 45,
  },
  {
    id: "cant-02",
    nome: "Eco-Villa Belvedere",
    indirizzo: "Via Colle Aperto 14, Brescia",
    stato: "Aperto",
    ultimoSal: 0,
  },
  {
    id: "cant-03",
    nome: "Complesso Legno Verde",
    indirizzo: "Viale Monza 88, Milano",
    stato: "Aperto",
    ultimoSal: 75,
  },
  {
    id: "cant-04",
    nome: "Polo Scolastico Bosco",
    indirizzo: "Via Dante 22, Bolgare (BG)",
    stato: "Chiuso",
    ultimoSal: 100,
  },
];
