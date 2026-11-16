/**
 * @file src/mocks/cantieri.ts
 * @description Dataset fittizio dei cantieri Marlegno per la simulazione della Dashboard Geometra e dei moduli documentali.
 */

import { Cantiere } from "@/types";

/**
 * Lista mock dei cantieri aziendali.
 * Include 3 cantieri con stato `"Aperto"` (sia alla prima compilazione che in aggiornamento)
 * e 1 cantiere `"Chiuso"` escluso dal filtro della vista operativa.
 */
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
