import { Cantiere } from "@/types";

export const mockCantieri: Cantiere[] = [
  {
    id: "cant-01",
    nome: "Residenziale Parco",
    indirizzo: "Via Roma 1, Bergamo",
    stato: "Aperto",
    checklistCompilata: true,
  },
  {
    id: "cant-02",
    nome: "Eco-Villa Belvedere",
    indirizzo: "Via Colle Aperto 14, Brescia",
    stato: "Aperto",
    checklistCompilata: false,
  },
  {
    id: "cant-03",
    nome: "Complesso Legno Verde",
    indirizzo: "Viale Monza 88, Milano",
    stato: "Aperto",
    checklistCompilata: true,
  },
  {
    id: "cant-04",
    nome: "Polo Scolastico Bosco",
    indirizzo: "Via Dante 22, Bolgare (BG)",
    stato: "Chiuso",
    checklistCompilata: true,
  },
];
