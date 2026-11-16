"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
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

export type EsitoVoce =
  | "Da verificare"
  | "Conforme"
  | "Non conforme"
  | "N/A";

export interface ChecklistSectionDef {
  id: string;
  title: string;
  items: string[];
}

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

interface ItemState {
  esito: EsitoVoce;
  nota: string;
}

interface SectionState {
  nonPresente: boolean;
  osservazioni: string;
  items: Record<number, ItemState>;
}

interface ChecklistFormState {
  sections: Record<string, SectionState>;
  esitoComplessivo: string;
  prescrizioni: string;
  noteGenerali: string;
  hasImpresaSignature: boolean;
  impresaSignatureDataUrl?: string;
}

const ESITO_OPTIONS: EsitoVoce[] = [
  "Da verificare",
  "Conforme",
  "Non conforme",
  "N/A",
];

const ESITO_COMPLESSIVO_OPTIONS = [
  "Regolare",
  "Regolare con prescrizioni",
  "Non regolare - Diffida / Sospensione",
];

interface ChecklistFormProps {
  cantiere: Cantiere;
  isUpdate?: boolean;
}

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

  const [formData, setFormData] = useState<ChecklistFormState>(() => {
    const initialSections: Record<string, SectionState> = {};

    for (const [secIdx, sec] of SECTIONS.entries()) {
      const initialItems: Record<number, ItemState> = {};

      sec.items.forEach((_, idx) => {
        if (isUpdate) {
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

  const getLastAutoTableFinalY = (doc: jsPDF, fallbackY: number): number => {
    return (
      (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
        ?.finalY ?? fallbackY
    );
  };

  const generatePDF = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isGeneratingPdf) return;

    setIsGeneratingPdf(true);
    const tecnicoNome = user?.name ?? "Mario Rossi";
    const signatureBase64 =
      signaturePadRef.current?.getDataURL() ??
      formData.impresaSignatureDataUrl ??
      null;

    try {
      window.localStorage.setItem(
        `marlegno_checklist_${cantiere.id}`,
        JSON.stringify({
          cantiereId: cantiere.id,
          cantiereNome: cantiere.nome,
          isUpdate,
          dataCompilazione: todayFormatted,
          tecnico: tecnicoNome,
          ...formData,
          impresaSignatureDataUrl: signatureBase64 ?? undefined,
        })
      );
    } catch {
      // Ignora errori localStorage
    }

    try {
      await new Promise((resolve) => setTimeout(resolve, 450));

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // 1. Header Rettangolo Verde Scuro (#1e4d3b -> RGB: 30, 77, 59)
      doc.setFillColor(30, 77, 59);
      doc.rect(0, 0, 210, 24, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.text("CHECK LIST SICUREZZA CANTIERE", 14, 15);

      // 2. Box Metadati Grigio Chiaro (#F3F4F6 -> RGB: 243, 244, 246) con angoli smussati
      doc.setFillColor(243, 244, 246);
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.3);
      doc.roundedRect(14, 29, 182, 11, 2.5, 2.5, "FD");

      doc.setTextColor(55, 65, 81);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      if (isUpdate) {
        doc.text("Aggiornamento Checklist (Revisione 4)", 18, 36);
        doc.setFont("helvetica", "normal");
        doc.text("Ultima modifica: 12 Novembre 2026", 192, 36, {
          align: "right",
        });
      } else {
        doc.text("Prima Compilazione", 18, 36);
        doc.setFont("helvetica", "normal");
        doc.text(`Creazione nuova revisione (Rev. 1) • ${todayFormatted}`, 192, 36, {
          align: "right",
        });
      }

      // 3. Griglia Dati Cantiere (autotable 1-riga senza bordi verticali esterni)
      autoTable(doc, {
        startY: 44,
        theme: "plain",
        styles: {
          fontSize: 9,
          cellPadding: 3,
          textColor: [15, 23, 42],
          lineColor: [226, 232, 240],
          lineWidth: { top: 0.2, bottom: 0.2, left: 0, right: 0 },
        },
        headStyles: {
          fillColor: [232, 245, 238], // Background verdino leggero
          textColor: [30, 77, 59], // Testo verde scuro #1e4d3b
          fontStyle: "bold",
        },
        head: [["Cantiere", "Indirizzo", "Data", "Tecnico"]],
        body: [[cantiere.nome, cantiere.indirizzo, todayFormatted, tecnicoNome]],
      });

      let currentY = getLastAutoTableFinalY(doc, 62);

      // 4. Tabelle delle Sezioni (una tabella autotable per ogni sezione abilitata)
      for (const section of SECTIONS) {
        const secState = formData.sections[section.id];
        if (secState.nonPresente) {
          continue;
        }

        currentY += 6;
        if (currentY > 250) {
          doc.addPage();
          currentY = 20;
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

        autoTable(doc, {
          startY: currentY,
          theme: "grid",
          styles: {
            fontSize: 8.5,
            cellPadding: 2.8,
            textColor: [30, 41, 59],
          },
          head: [
            [
              {
                content: section.title,
                colSpan: 3,
                styles: {
                  fillColor: [30, 77, 59], // #1e4d3b
                  textColor: [255, 255, 255],
                  fontStyle: "bold",
                  fontSize: 9.5,
                },
              },
            ],
            [
              {
                content: "Punto di controllo",
                styles: {
                  fillColor: [241, 245, 249],
                  textColor: [30, 77, 59],
                  fontStyle: "bold",
                },
              },
              {
                content: "Esito",
                styles: {
                  fillColor: [241, 245, 249],
                  textColor: [30, 77, 59],
                  fontStyle: "bold",
                  halign: "center",
                },
              },
              {
                content: "Note",
                styles: {
                  fillColor: [241, 245, 249],
                  textColor: [30, 77, 59],
                  fontStyle: "bold",
                },
              },
            ],
          ],
          columnStyles: {
            0: { cellWidth: 96 }, // Punto di controllo (larga)
            1: { cellWidth: 32, halign: "center" }, // Esito (stretta al centro)
            2: { cellWidth: 54 }, // Note (larga)
          },
          body: sectionRows,
          didParseCell: (data) => {
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
        });

        currentY = getLastAutoTableFinalY(doc, currentY + 25);
      }

      // 5. Tabella Riassuntiva "Esito Complessivo del Sopralluogo"
      currentY += 7;
      if (currentY > 240) {
        doc.addPage();
        currentY = 20;
      }

      autoTable(doc, {
        startY: currentY,
        theme: "grid",
        styles: {
          fontSize: 9,
          cellPadding: 3,
          textColor: [30, 41, 59],
        },
        headStyles: {
          fillColor: [30, 77, 59], // #1e4d3b
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        columnStyles: {
          0: { cellWidth: 50, fontStyle: "bold" },
          1: { cellWidth: 132 },
        },
        head: [
          [
            {
              content: "Esito Complessivo del Sopralluogo",
              colSpan: 2,
            },
          ],
        ],
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
      });

      currentY = getLastAutoTableFinalY(doc, currentY + 30);

      // 6. Riquadri Affiancati per le Firme ("Firma Tecnico" e "Firma Impresa")
      currentY += 10;
      if (currentY > 235) {
        doc.addPage();
        currentY = 20;
      }

      doc.setTextColor(30, 77, 59);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Firma Tecnico", 14, currentY);
      doc.text("Firma Impresa", 114, currentY);

      doc.setDrawColor(203, 213, 225);
      doc.setFillColor(250, 250, 250);
      doc.rect(14, currentY + 3, 82, 28, "FD");
      doc.rect(114, currentY + 3, 82, 28, "FD");

      // Firma Tecnico precompilata nel riquadro di sinistra
      doc.setFont("times", "italic");
      doc.setFontSize(14);
      doc.setTextColor(30, 77, 59);
      doc.text(tecnicoNome, 55, currentY + 19, { align: "center" });

      // Firma Impresa dal SignaturePad (via ref) nel riquadro di destra
      if (signatureBase64) {
        try {
          doc.addImage(signatureBase64, "PNG", 117, currentY + 5, 76, 24);
        } catch {
          // Ignora eventuale immagine non valida
        }
      } else {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(148, 163, 184);
        doc.text("Firma non apposta", 155, currentY + 19, {
          align: "center",
        });
      }

      // 7. Download PDF con il nome richiesto e Redirect al Cantiere
      doc.save("Checklist_Cantiere_Modern.pdf");

      setShowToast(true);
      setTimeout(() => {
        router.push(`/cantiere/${cantiere.id}?saved=1`);
      }, 900);
    } catch {
      setIsGeneratingPdf(false);
    }
  };

  const getSelectColorClasses = (esito: EsitoVoce) => {
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
