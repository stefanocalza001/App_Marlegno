"use client";

/**
 * @file src/components/forms/ChecklistForm.tsx
 * @description Modulo principale per la compilazione e l'aggiornamento della Checklist di Sicurezza Cantiere.
 * Gestisce lo stato reattivo di tutte le sezioni di verifica, l'acquisizione delle firme digitali e
 * la generazione client-side del report PDF con layout a "isole supercerchio" tramite `jspdf` e `jspdf-autotable`.
 */

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { jsPDF } from "jspdf";
import autoTable, { UserOptions } from "jspdf-autotable";
import { Cantiere } from "@/types";
import { useAuth } from "@/lib/AuthContext";
import {
  SignaturePad,
  SignaturePadHandle,
} from "@/components/ui/SignaturePad";
import {
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  FileCheck2,
  Loader2,
  MapPin,
  UserCheck,
} from "lucide-react";

/**
 * Valori ammessi per l'esito di ciascun punto di verifica della checklist.
 */
export type EsitoVoce =
  | "Da verificare"
  | "Conforme"
  | "Non conforme"
  | "N/A";

/**
 * Struttura statica di una sezione della Checklist di Sicurezza.
 */
export interface ChecklistSectionDef {
  /** Identificativo univoco della sezione (es. `"sec-1"`). */
  id: string;
  /** Titolo numerato mostrato nell'header della card e nel PDF. */
  title: string;
  /** Elenco testuale dei punti di verifica appartenenti alla sezione. */
  items: string[];
}

/**
 * Costante contenente le 6 sezioni ufficiali e i relativi punti di controllo per i cantieri Marlegno.
 */
export const SECTIONS: ChecklistSectionDef[] = [
  {
    id: "sec-1",
    title: "1. Organizzazione del cantiere",
    items: [
      "Recinzione di cantiere integra, stabile e correttamente segnalata",
      "Cartellonistica di cantiere e segnaletica di sicurezza esposte e visibili",
      "Viabilità interna, accessi pedonali/carrabili e aree di stoccaggio ordinati",
    ],
  },
  {
    id: "sec-2",
    title: "2. Documentazione",
    items: [
      "PSC / POS delle imprese esecutrici presenti e aggiornati in cantiere",
      "Notifica preliminare e verbali di coordinamento disponibili",
      "Verifica idoneità tecnico-professionale e regolarità contributiva (DURC)",
    ],
  },
  {
    id: "sec-3",
    title: "3. Ponteggi",
    items: [
      "Pi.M.U.S. e progetto del ponteggio (se > 20m o fuori schema tipo) presenti",
      "Ancoraggi, basette, tavole fermapiede e parapetti completi e integri",
      "Scale di accesso interne ed efficienza delle protezioni contro le cadute",
    ],
  },
  {
    id: "sec-4",
    title: "4. Opere Provvisionali e Protezioni Collettive",
    items: [
      "Parapetti perimetrali, reti anticaduta e protezioni aperture nel vuoto",
      "Linee vita provvisorie e punti di ancoraggio certificati per montaggio legno",
      "Stabilità e protezione degli scavi e delle zone di sollevamento carichi",
    ],
  },
  {
    id: "sec-5",
    title: "5. Impianti Elettrici, Macchine e Attrezzature",
    items: [
      "Quadro elettrico di cantiere certificato (ASC), cablaggi sollevati o protetti",
      "Dichiarazione di conformità impianto di terra e protezioni differenziali",
      "Gru, autogrù e attrezzature di sollevamento con verifiche periodiche valide",
    ],
  },
  {
    id: "sec-6",
    title: "6. DPI, Igiene e Gestione Emergenze",
    items: [
      "Utilizzo costante dei DPI (casco, calzature S3, imbracatura anticaduta, guanti)",
      "Presidi di primo soccorso (cassetta medicazione) ed estintori presenti",
      "Servizi igienico-assistenziali e spogliatoi puliti e adeguatamente attrezzati",
    ],
  },
];

/** Stato di compilazione di una singola voce di controllo. */
interface ItemState {
  esito: EsitoVoce;
  nota: string;
}

/** Stato complessivo di una singola sezione della checklist. */
interface SectionState {
  nonPresente: boolean;
  osservazioni: string;
  items: Record<number, ItemState>;
}

/** Stato globale del modulo ChecklistForm. */
interface ChecklistFormState {
  sections: Record<string, SectionState>;
  esitoComplessivo: string;
  prescrizioni: string;
  noteGenerali: string;
  hasImpresaSignature: boolean;
  impresaSignatureDataUrl?: string;
}

/** Opzioni selezionabili nel menu a tendina di ogni singolo punto di verifica. */
const ESITO_OPTIONS: EsitoVoce[] = [
  "Da verificare",
  "Conforme",
  "Non conforme",
  "N/A",
];

/** Opzioni selezionabili per l'esito complessivo finale del sopralluogo. */
const ESITO_COMPLESSIVO_OPTIONS = [
  "Regolare",
  "Regolare con prescrizioni",
  "Non regolare - Diffida / Sospensione",
];

/**
 * Disegna un contenitore ad angoli arrotondati ("supercerchio") sul documento `jsPDF`.
 *
 * @param doc - Istanza attiva di `jsPDF`.
 * @param x - Coordinata orizzontale superiore sinistra in mm.
 * @param y - Coordinata verticale superiore sinistra in mm.
 * @param width - Larghezza del rettangolo in mm.
 * @param height - Altezza del rettangolo in mm.
 * @param options - Parametri opzionali di stile (colore di riempimento, colore bordo, raggio e spessore linea).
 */
function drawSuperRect(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  options?: {
    fillColor?: [number, number, number];
    strokeColor?: [number, number, number];
    radius?: number;
    lineWidth?: number;
  }
): void {
  const fill = options?.fillColor ?? [248, 250, 249]; // Default #f8faf9
  const stroke = options?.strokeColor;
  const radius = options?.radius ?? 4;
  const lineWidth = options?.lineWidth ?? 0.3;

  doc.setFillColor(fill[0], fill[1], fill[2]);

  if (stroke) {
    doc.setDrawColor(stroke[0], stroke[1], stroke[2]);
    doc.setLineWidth(lineWidth);
    doc.roundedRect(x, y, width, height, radius, radius, "FD");
  } else {
    doc.roundedRect(x, y, width, height, radius, radius, "F");
  }
}

/**
 * Simula il rendering di una tabella `autoTable` su un documento `jsPDF` temporaneo in memoria
 * per calcolarne preventivamente l'altezza esatta in millimetri.
 * Questo permette di disegnare il box "isola supercerchio" `#f8faf9` dietro la tabella con altezza perfetta.
 *
 * @param tableOptions - Configurazione `UserOptions` della tabella `autoTable`.
 * @returns Altezza verticale totale occupata dalla tabella in mm.
 */
function measureAutoTableHeight(tableOptions: UserOptions): number {
  const scratchDoc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });
  autoTable(scratchDoc, { ...tableOptions, startY: 20 });
  const finalY =
    (scratchDoc as unknown as { lastAutoTable?: { finalY: number } })
      .lastAutoTable?.finalY ?? 40;
  return finalY - 20;
}

/**
 * Estrae la coordinata verticale `finalY` dell'ultima tabella disegnata da `jspdf-autotable`.
 *
 * @param doc - Istanza `jsPDF` su cui è stata appena eseguita `autoTable`.
 * @param fallbackY - Valore di fallback in mm qualora `lastAutoTable` non sia definito.
 * @returns Coordinata verticale `Y` finale in mm.
 */
function getLastAutoTableFinalY(doc: jsPDF, fallbackY: number): number {
  return (
    (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? fallbackY
  );
}

/**
 * Restituisce le classi cromatiche Tailwind CSS per la `<select>` dell'esito in base al valore selezionato.
 *
 * @param esito - Valore corrente dell'esito (`"Conforme"`, `"Non conforme"`, `"N/A"`, `"Da verificare"`).
 * @returns Stringa di classi Tailwind CSS per bordo, sfondo e testo.
 */
function getSelectColorClasses(esito: EsitoVoce): string {
  switch (esito) {
    case "Conforme":
      return "border-emerald-300 bg-emerald-50/70 text-emerald-900";
    case "Non conforme":
      return "border-rose-300 bg-rose-50/70 text-rose-900";
    case "N/A":
      return "border-slate-200 bg-slate-100 text-slate-600";
    default:
      return "border-amber-300 bg-amber-50/70 text-amber-900";
  }
}

/**
 * Proprietà in ingresso per il componente `ChecklistForm`.
 */
interface ChecklistFormProps {
  /** Oggetto anagrafico del cantiere a cui si riferisce la checklist. */
  cantiere: Cantiere;
  /** Se `true`, inizializza il form in modalità "Aggiornamento Checklist" pre-impostando gli esiti pregressi. */
  isUpdate?: boolean;
}

/**
 * Form completo a scorrimento singolo per la compilazione della Checklist di Sicurezza Cantiere
 * e la generazione del relativo report PDF certificato.
 *
 * @param props - Oggetto `cantiere` e flag opzionale `isUpdate`.
 * @returns Elemento JSX del form checklist con barra di salvataggio fissa.
 */
export function ChecklistForm({
  cantiere,
  isUpdate = false,
}: ChecklistFormProps) {
  const { user } = useAuth();
  const router = useRouter();
  const signaturePadRef = useRef<SignaturePadHandle | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const todayFormatted = new Date().toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  // Inizializzazione differenziata dello stato in base alla modalità (Prima Compilazione vs Aggiornamento)
  const [formData, setFormData] = useState<ChecklistFormState>(() => {
    const initialSections: Record<string, SectionState> = {};

    for (const [secIdx, sec] of SECTIONS.entries()) {
      const initialItems: Record<number, ItemState> = {};

      sec.items.forEach((_, idx) => {
        if (isUpdate) {
          // Simula il caricamento degli esiti già verificati nella revisione precedente
          const isPrechecked = secIdx < 4 || idx === 0;
          initialItems[idx] = {
            esito: isPrechecked ? "Conforme" : "Da verificare",
            nota: "",
          };
        } else {
          initialItems[idx] = {
            esito: "Da verificare",
            nota: "",
          };
        }
      });

      initialSections[sec.id] = {
        nonPresente: false,
        osservazioni: "",
        items: initialItems,
      };
    }

    return {
      sections: initialSections,
      esitoComplessivo: "Regolare",
      prescrizioni: "",
      noteGenerali: "",
      hasImpresaSignature: false,
    };
  });

  /**
   * Abilita o disabilita un'intera sezione ("Non presente in cantiere").
   */
  const handleToggleSection = (sectionId: string, nonPresente: boolean) => {
    setFormData((prev) => ({
      ...prev,
      sections: {
        ...prev.sections,
        [sectionId]: {
          ...prev.sections[sectionId],
          nonPresente,
        },
      },
    }));
  };

  /**
   * Aggiorna il campo `esito` o `nota` di un singolo punto di controllo all'interno di una sezione.
   */
  const handleItemChange = (
    sectionId: string,
    itemIndex: number,
    field: keyof ItemState,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      sections: {
        ...prev.sections,
        [sectionId]: {
          ...prev.sections[sectionId],
          items: {
            ...prev.sections[sectionId].items,
            [itemIndex]: {
              ...prev.sections[sectionId].items[itemIndex],
              [field]: value,
            },
          },
        },
      },
    }));
  };

  /**
   * Aggiorna il campo testuale delle osservazioni generali di una specifica sezione.
   */
  const handleSectionOsservazioni = (sectionId: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      sections: {
        ...prev.sections,
        [sectionId]: {
          ...prev.sections[sectionId],
          osservazioni: value,
        },
      },
    }));
  };

  /**
   * Salva i dati della checklist in `localStorage`, genera lato client il documento PDF A4
   * con layout a "isole supercerchio", avvia il download e reindirizza a `/cantiere/[id]`.
   *
   * @param e - Evento di submit del form HTML.
   */
  const generatePDF = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isGeneratingPdf) return;

    setIsGeneratingPdf(true);

    // Acquisisce data e ora esatte del momento di conferma e generazione del documento
    const now = new Date();
    const dataOggi = now.toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const oraOggi = now.toLocaleTimeString("it-IT", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const tecnicoNome = user?.name ?? "Mario Rossi";
    const signatureBase64 =
      signaturePadRef.current?.getDataURL() ??
      formData.impresaSignatureDataUrl ??
      null;

    // Persistenza simulata in localStorage per supporto offline
    try {
      window.localStorage.setItem(
        `marlegno_checklist_${cantiere.id}`,
        JSON.stringify({
          cantiereId: cantiere.id,
          cantiereNome: cantiere.nome,
          isUpdate,
          dataCompilazione: dataOggi,
          oraCompilazione: oraOggi,
          tecnico: tecnicoNome,
          ...formData,
          impresaSignatureDataUrl: signatureBase64 ?? undefined,
        })
      );
    } catch {
      // Ignora errori di quota o accesso a localStorage
    }

    try {
      // Breve pausa per consentire il rendering dello stato di caricamento (Loader2) sul pulsante
      await new Promise((resolve) => setTimeout(resolve, 450));

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // 1. Header Principale: Unico box verde scuro (#1e4d3b -> RGB [30, 77, 59]) in stile supercerchio
      drawSuperRect(doc, 14, 10, 182, 16, {
        fillColor: [30, 77, 59],
        radius: 4,
      });
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("CHECK LIST SICUREZZA", 20, 20);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.text(
        isUpdate
          ? "Aggiornamento Checklist (Rev. 4) • Ultima mod. 12/11/2026"
          : `Prima Compilazione (Rev. 1) • ${dataOggi}`,
        190,
        20,
        { align: "right" }
      );

      // 2. Isola Supercerchio Dati Cantiere (#f8faf9)
      drawSuperRect(doc, 14, 30, 182, 19, {
        fillColor: [248, 250, 249],
        strokeColor: [222, 230, 226],
        radius: 4,
      });

      autoTable(doc, {
        startY: 31.5,
        margin: { left: 17, right: 17 },
        tableWidth: 176,
        theme: "plain",
        styles: {
          fontSize: 8.5,
          cellPadding: 2,
          fillColor: [248, 250, 249],
          textColor: [30, 41, 59],
        },
        headStyles: {
          fillColor: [248, 250, 249],
          textColor: [100, 116, 139],
          fontStyle: "bold",
          fontSize: 7.5,
        },
        head: [["CANTIERE", "INDIRIZZO", "DATA", "TECNICO RILEVATORE"]],
        body: [[cantiere.nome, cantiere.indirizzo, dataOggi, tecnicoNome]],
      });

      let currentY = 54;

      // 3. Layout Sezioni a Isole (#f8faf9): calcola l'altezza, disegna il supercerchio e poi la tabella interna
      for (const section of SECTIONS) {
        const secState = formData.sections[section.id];
        if (secState.nonPresente) {
          continue;
        }

        const sectionRows: string[][] = section.items.map((itemText, idx) => {
          const itemState = secState.items[idx];
          return [
            itemText,
            itemState.esito,
            itemState.nota.trim() !== "" ? itemState.nota.trim() : "-",
          ];
        });

        if (secState.osservazioni.trim() !== "") {
          sectionRows.push([
            "Osservazioni di sezione",
            "N/A",
            secState.osservazioni.trim(),
          ]);
        }

        const tableConfig: UserOptions = {
          margin: { left: 17, right: 17 },
          tableWidth: 176,
          theme: "plain",
          styles: {
            fontSize: 8.5,
            cellPadding: 2.5,
            fillColor: [248, 250, 249],
            textColor: [30, 41, 59],
            lineColor: [226, 232, 240],
            lineWidth: { bottom: 0.15, top: 0, left: 0, right: 0 },
          },
          headStyles: {
            fillColor: [248, 250, 249],
            textColor: [100, 116, 139],
            fontStyle: "bold",
            fontSize: 7.5,
            lineColor: [203, 213, 225],
            lineWidth: { bottom: 0.25, top: 0, left: 0, right: 0 },
          },
          columnStyles: {
            0: { cellWidth: 96 },
            1: { cellWidth: 30, halign: "center" },
            2: { cellWidth: 50 },
          },
          head: [["Punto di controllo", "Esito", "Note"]],
          body: sectionRows,
          didParseCell: (data) => {
            // Applica i colori semantici esclusivamente al testo della colonna "Esito"
            if (data.section === "body" && data.column.index === 1) {
              const esitoValue = String(data.cell.raw ?? "");
              if (esitoValue === "Conforme") {
                data.cell.styles.textColor = [34, 139, 34]; // Verde
                data.cell.styles.fontStyle = "bold";
              } else if (esitoValue === "Non conforme") {
                data.cell.styles.textColor = [204, 0, 0]; // Rosso
                data.cell.styles.fontStyle = "bold";
              } else if (esitoValue === "Da verificare") {
                data.cell.styles.textColor = [230, 126, 34]; // Arancione
                data.cell.styles.fontStyle = "bold";
              }
            }
          },
        };

        const measuredTableHeight = measureAutoTableHeight(tableConfig);
        const cardHeight = 11 + measuredTableHeight + 3;

        // Salto pagina preventivo se l'isola della sezione non entra nello spazio residuo del foglio A4
        if (currentY + cardHeight > 278) {
          doc.addPage();
          currentY = 16;
        }

        drawSuperRect(doc, 14, currentY, 182, cardHeight, {
          fillColor: [248, 250, 249],
          strokeColor: [220, 228, 224],
          radius: 4,
        });

        doc.setTextColor(30, 77, 59);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text(section.title, 17.5, currentY + 7);

        autoTable(doc, {
          ...tableConfig,
          startY: currentY + 9.5,
        });

        currentY = getLastAutoTableFinalY(doc, currentY + cardHeight) + 6;
      }

      // 4. Isola Supercerchio "Esito Complessivo del Sopralluogo"
      const summaryTableConfig: UserOptions = {
        margin: { left: 17, right: 17 },
        tableWidth: 176,
        theme: "plain",
        styles: {
          fontSize: 8.5,
          cellPadding: 2.5,
          fillColor: [248, 250, 249],
          textColor: [30, 41, 59],
          lineColor: [226, 232, 240],
          lineWidth: { bottom: 0.15, top: 0, left: 0, right: 0 },
        },
        columnStyles: {
          0: { cellWidth: 42, fontStyle: "bold", textColor: [71, 85, 105] },
          1: { cellWidth: 134 },
        },
        body: [
          ["Esito Generale", formData.esitoComplessivo],
          [
            "Prescrizioni",
            formData.prescrizioni.trim() !== ""
              ? formData.prescrizioni.trim()
              : "-",
          ],
          [
            "Note Generali",
            formData.noteGenerali.trim() !== ""
              ? formData.noteGenerali.trim()
              : "-",
          ],
        ],
        didParseCell: (data) => {
          if (
            data.section === "body" &&
            data.row.index === 0 &&
            data.column.index === 1
          ) {
            const val = String(data.cell.raw ?? "").toLowerCase();
            data.cell.styles.fontStyle = "bold";
            if (val.includes("non regolare") || val.includes("sospensione")) {
              data.cell.styles.textColor = [204, 0, 0];
            } else if (val.includes("prescrizioni")) {
              data.cell.styles.textColor = [230, 126, 34];
            } else {
              data.cell.styles.textColor = [34, 139, 34];
            }
          }
        },
      };

      const summaryTableHeight = measureAutoTableHeight(summaryTableConfig);
      const summaryCardHeight = 11 + summaryTableHeight + 3;

      if (currentY + summaryCardHeight > 278) {
        doc.addPage();
        currentY = 16;
      }

      drawSuperRect(doc, 14, currentY, 182, summaryCardHeight, {
        fillColor: [248, 250, 249],
        strokeColor: [220, 228, 224],
        radius: 4,
      });

      doc.setTextColor(30, 77, 59);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Esito Complessivo del Sopralluogo", 17.5, currentY + 7);

      autoTable(doc, {
        ...summaryTableConfig,
        startY: currentY + 9.5,
      });

      currentY = getLastAutoTableFinalY(doc, currentY + summaryCardHeight) + 8;

      // 5. Box Firme Certificati (Supercerchi affiancati con timestamp e geolocalizzazione nominale)
      const signBoxHeight = 42;
      if (currentY + signBoxHeight > 282) {
        doc.addPage();
        currentY = 18;
      }

      drawSuperRect(doc, 14, currentY, 88, signBoxHeight, {
        fillColor: [248, 250, 249],
        strokeColor: [215, 224, 220],
        radius: 4,
      });

      drawSuperRect(doc, 108, currentY, 88, signBoxHeight, {
        fillColor: [248, 250, 249],
        strokeColor: [215, 224, 220],
        radius: 4,
      });

      doc.setTextColor(30, 77, 59);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("Firma Tecnico Rilevatore", 18, currentY + 6.5);
      doc.text("Firma Impresa Esecutrice", 112, currentY + 6.5);

      doc.setFont("times", "italic");
      doc.setFontSize(14);
      doc.setTextColor(30, 77, 59);
      doc.text(tecnicoNome, 58, currentY + 19, { align: "center" });

      if (signatureBase64) {
        try {
          doc.addImage(signatureBase64, "PNG", 114, currentY + 8.5, 76, 17);
        } catch {
          // Ignora eventuale immagine corrotta o vuota
        }
      } else {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(148, 163, 184);
        doc.text("Firma non apposta", 152, currentY + 19, {
          align: "center",
        });
      }

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.line(18, currentY + 27.5, 98, currentY + 27.5);
      doc.line(112, currentY + 27.5, 192, currentY + 27.5);

      const locationText = `Firmato a: ${cantiere.nome} (${cantiere.indirizzo})`;
      const timestampText = `Il ${dataOggi} alle ${oraOggi}`;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);

      doc.text(locationText, 18, currentY + 32, { maxWidth: 80 });
      doc.text(timestampText, 18, currentY + 38.5);

      doc.text(locationText, 112, currentY + 32, { maxWidth: 80 });
      doc.text(timestampText, 112, currentY + 38.5);

      // 6. Download del PDF e redirect automatico alla vista del cantiere
      doc.save("Checklist_Cantiere_Modern.pdf");

      setShowToast(true);
      setTimeout(() => {
        router.push(`/cantiere/${cantiere.id}?saved=1`);
      }, 900);
    } catch {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <>
      {/* Toast Discreto di Conferma */}
      {showToast && (
        <div
          role="status"
          className="fixed top-20 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Documento salvato con successo</span>
        </div>
      )}

      <form onSubmit={generatePDF} className="space-y-6 pb-28">
        {/* Header Titolo e Box Storicizzazione (Metadati Revisione) */}
        <div>
          <div className="px-1 mb-3">
            <span
              className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                isUpdate
                  ? "bg-amber-500/15 text-amber-800"
                  : "bg-brand/10 text-brand"
              }`}
            >
              {isUpdate ? "Revisione dati pregressi" : "Nuovo sopralluogo"}
            </span>
            <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">
              {isUpdate
                ? "Aggiornamento Checklist"
                : "Prima Compilazione Checklist"}
            </h1>
          </div>

          {isUpdate ? (
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-6 flex flex-wrap justify-between items-center gap-2 text-sm text-gray-500">
              <span>Ultima modifica: 12 Novembre 2026</span>
              <span className="font-semibold text-gray-700">Revisione n° 4</span>
              <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand">
                Status: In Lavorazione
              </span>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-6 flex flex-wrap justify-between items-center gap-2 text-sm text-gray-500">
              <span className="font-semibold text-gray-700">
                Creazione nuova revisione (Rev. 1)
              </span>
              <span>Data odierna: {todayFormatted}</span>
            </div>
          )}
        </div>

        {/* 1. Intestazione Dati Generali Cantiere (Sola Lettura) */}
        <section className="rounded-super bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
            <ClipboardList className="h-5 w-5 text-brand" />
            <h2 className="text-base font-bold text-slate-900">
              Dati Generali Sopralluogo
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <Building2 className="h-3.5 w-3.5 text-brand" />
                <span>Cantiere</span>
              </label>
              <input
                type="text"
                readOnly
                value={cantiere.nome}
                className="h-11 w-full rounded-2xl border border-slate-200 bg-background px-3.5 text-sm font-semibold text-slate-800 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <MapPin className="h-3.5 w-3.5 text-brand" />
                <span>Indirizzo</span>
              </label>
              <input
                type="text"
                readOnly
                value={cantiere.indirizzo}
                className="h-11 w-full rounded-2xl border border-slate-200 bg-background px-3.5 text-sm font-medium text-slate-700 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <Calendar className="h-3.5 w-3.5 text-brand" />
                <span>Data</span>
              </label>
              <input
                type="text"
                readOnly
                value={todayFormatted}
                className="h-11 w-full rounded-2xl border border-slate-200 bg-background px-3.5 text-sm font-medium text-slate-700 focus:outline-none"
              />
            </div>
          </div>
        </section>

        {/* 2. Iterazione Sezioni e Punti di Verifica */}
        {SECTIONS.map((section) => {
          const secState = formData.sections[section.id];
          const isDisabled = secState.nonPresente;

          return (
            <section
              key={section.id}
              className="overflow-hidden rounded-super bg-white shadow-sm"
            >
              {/* Header Sezione: Riga 1 = Titolo, Riga 2 = Toggle "Non presente in cantiere" */}
              <div className="border-b border-brand/10 bg-green-50/70 px-5 py-4">
                <h3 className="text-base font-bold text-brand">
                  {section.title}
                </h3>

                <div className="mt-2.5 flex items-center">
                  <label className="inline-flex cursor-pointer items-center gap-2.5 select-none rounded-full bg-white/80 px-3 py-1.5 shadow-2xs ring-1 ring-brand/15">
                    <input
                      type="checkbox"
                      checked={isDisabled}
                      onChange={(e) =>
                        handleToggleSection(section.id, e.target.checked)
                      }
                      className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
                    />
                    <span className="text-xs font-semibold text-slate-700">
                      Non presente in cantiere
                    </span>
                  </label>
                </div>
              </div>

              {/* Corpo Sezione (opacizzato e disabilitato se "Non presente in cantiere" è attivo) */}
              <div
                className={`space-y-5 p-5 transition-opacity duration-150 ${
                  isDisabled ? "pointer-events-none select-none opacity-50" : ""
                }`}
              >
                <div className="divide-y divide-slate-100">
                  {section.items.map((itemText, idx) => {
                    const itemState = secState.items[idx];
                    return (
                      <div
                        key={idx}
                        className="space-y-3 py-4 first:pt-0 last:pb-0"
                      >
                        <p className="text-sm font-semibold leading-snug text-slate-800">
                          <span className="mr-1.5 text-brand">•</span>
                          {itemText}
                        </p>

                        {/* Controlli Mobile-First: Select Esito (con freccia custom pr-10) + Input Note */}
                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                          <div>
                            <label className="mb-1 block text-xs font-medium text-slate-500">
                              Esito verifica
                            </label>
                            <div className="relative">
                              <select
                                value={itemState.esito}
                                disabled={isDisabled}
                                onChange={(e) =>
                                  handleItemChange(
                                    section.id,
                                    idx,
                                    "esito",
                                    e.target.value as EsitoVoce
                                  )
                                }
                                className={`h-12 w-full appearance-none rounded-2xl border pl-3.5 pr-10 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand/20 ${getSelectColorClasses(
                                  itemState.esito
                                )}`}
                              >
                                {ESITO_OPTIONS.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 opacity-70" />
                            </div>
                          </div>

                          <div>
                            <label className="mb-1 block text-xs font-medium text-slate-500">
                              Note
                            </label>
                            <input
                              type="text"
                              disabled={isDisabled}
                              placeholder="Aggiungi nota puntuale..."
                              value={itemState.nota}
                              onChange={(e) =>
                                handleItemChange(
                                  section.id,
                                  idx,
                                  "nota",
                                  e.target.value
                                )
                              }
                              className="h-12 w-full rounded-2xl border border-slate-200 bg-background px-3.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Textarea Osservazioni di Sezione */}
                <div className="border-t border-slate-100 pt-4">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Osservazioni per questa sezione
                  </label>
                  <textarea
                    rows={2}
                    disabled={isDisabled}
                    placeholder="Inserisci eventuali osservazioni generali per questa sezione..."
                    value={secState.osservazioni}
                    onChange={(e) =>
                      handleSectionOsservazioni(section.id, e.target.value)
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-background p-3.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20"
                  />
                </div>
              </div>
            </section>
          );
        })}

        {/* 3. Blocco Finale ed Esito Complessivo del Sopralluogo */}
        <section className="space-y-4 rounded-super bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <FileCheck2 className="h-5 w-5 text-brand" />
            <h2 className="text-base font-bold text-slate-900">
              Esito Complessivo del Sopralluogo
            </h2>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">
              Esito Generale
            </label>
            <div className="relative">
              <select
                value={formData.esitoComplessivo}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    esitoComplessivo: e.target.value,
                  }))
                }
                className="h-12 w-full appearance-none rounded-2xl border border-brand/30 bg-brand/[0.05] pl-4 pr-10 text-sm font-bold text-brand focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              >
                {ESITO_COMPLESSIVO_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand opacity-80" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">
              Prescrizioni
            </label>
            <textarea
              rows={3}
              placeholder="Indica eventuali prescrizioni operative e tempistiche di adeguamento..."
              value={formData.prescrizioni}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  prescrizioni: e.target.value,
                }))
              }
              className="w-full rounded-2xl border border-slate-200 bg-background p-3.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">
              Note Generali
            </label>
            <textarea
              rows={3}
              placeholder="Ulteriori note generali sul sopralluogo..."
              value={formData.noteGenerali}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  noteGenerali: e.target.value,
                }))
              }
              className="w-full rounded-2xl border border-slate-200 bg-background p-3.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </div>
        </section>

        {/* 4. Sezione Firme (Tecnico Precompilata + SignaturePad Impresa Esecutrice) */}
        <section className="space-y-5 rounded-super bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-slate-900">
            Validazione e Firme
          </h2>

          {/* Box Firma Tecnico (Simulata Precompilata) */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
              <UserCheck className="h-4 w-4 text-brand" />
              <span>Firma Tecnico Rilevatore</span>
            </label>
            <div className="flex h-24 flex-col items-center justify-center rounded-2xl border border-brand/20 bg-brand/[0.04] px-4 text-center">
              <span className="font-serif text-2xl italic tracking-wide text-brand">
                {user?.name ?? "Mario Rossi"}
              </span>
              <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Firma digitale tecnico precompilata ({todayFormatted})
              </span>
            </div>
          </div>

          {/* Box Firma Impresa Esecutrice (Canvas Interattivo con ref) */}
          <SignaturePad
            ref={signaturePadRef}
            label="Firma Impresa Esecutrice"
            onChange={(hasSignature, dataUrl) =>
              setFormData((prev) => ({
                ...prev,
                hasImpresaSignature: hasSignature,
                impresaSignatureDataUrl: dataUrl,
              }))
            }
          />
        </section>

        {/* 5. Bottone Fisso in Basso: Salva e Genera PDF */}
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200/80 bg-white/95 p-4 backdrop-blur-md">
          <div className="mx-auto max-w-2xl">
            <button
              type="submit"
              disabled={isGeneratingPdf}
              className="flex h-14 w-full items-center justify-center gap-2.5 rounded-super bg-brand px-6 text-lg font-semibold text-white shadow-md transition-transform duration-150 hover:bg-brand-hover active:scale-95 disabled:pointer-events-none disabled:opacity-80"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Generazione PDF in corso...</span>
                </>
              ) : (
                <>
                  <FileCheck2 className="h-5 w-5" />
                  <span>Salva e Genera PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
