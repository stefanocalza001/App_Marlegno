"use client";

/**
 * @file src/components/forms/VerbaleForm.tsx
 * @description Componente form unificato per la redazione dei Verbali di Cantiere ("Sicurezza" e "Qualità").
 * Supporta la compilazione dei soggetti coinvolti, l'eventuale elemento contestato (solo per Qualità),
 * la descrizione della rilevazione, l'acquisizione di allegati fotografici con miniature in anteprima,
 * le firme digitali e l'esportazione PDF client-side in stile "isole supercerchio".
 */

import React, { useEffect, useRef, useState } from "react";
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
  Camera,
  CheckCircle2,
  ClipboardList,
  FileCheck2,
  FileText,
  Layers,
  Loader2,
  MapPin,
  Trash2,
  UserCheck,
  Users,
} from "lucide-react";

/**
 * Tipologia di verbale gestita dal componente `VerbaleForm`.
 */
export type VerbaleType = "Sicurezza" | "Qualità";

/**
 * Rappresenta una foto allegata dall'utente con il relativo URL temporaneo di anteprima (`blob:`).
 */
interface PhotoPreview {
  /** Identificativo univoco locale dell'allegato. */
  id: string;
  /** Nome originale del file immagine. */
  name: string;
  /** URL generato tramite `URL.createObjectURL(file)` per il rendering della miniatura. */
  previewUrl: string;
}

/**
 * Proprietà in ingresso per il componente `VerbaleForm`.
 */
interface VerbaleFormProps {
  /** Dati anagrafici del cantiere attivo. */
  cantiere: Cantiere;
  /** Tipologia del verbale da emettere (`"Sicurezza"` o `"Qualità"`). */
  type: VerbaleType;
}

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
 * Simula il rendering di una tabella `autoTable` su un documento `jsPDF` temporaneo
 * per calcolarne preventivamente l'altezza esatta in millimetri.
 *
 * @param tableOptions - Configurazione `UserOptions` della tabella `autoTable`.
 * @returns Altezza verticale occupata dalla tabella in mm.
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
 * Componente form completo per la creazione di un Verbale di Sicurezza o di Qualità,
 * comprensivo di caricamento fotografico, firma touch su canvas ed esportazione PDF.
 *
 * @param props - Oggetto `cantiere` e tipologia `type` (`"Sicurezza"` | `"Qualità"`).
 * @returns Elemento JSX del modulo verbale.
 */
export function VerbaleForm({ cantiere, type }: VerbaleFormProps) {
  const { user } = useAuth();
  const router = useRouter();
  const signaturePadRef = useRef<SignaturePadHandle | null>(null);

  const [soggettiCoinvolti, setSoggettiCoinvolti] = useState("");
  const [elementoContestato, setElementoContestato] = useState("");
  const [dettaglioRilevazione, setDettaglioRilevazione] = useState("");
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | undefined>(
    undefined
  );
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const now = new Date();
  const todayFormatted = now.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const currentTimeFormatted = now.toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Revoca gli URL blob delle miniature quando il componente viene smontato per evitare memory leak
  useEffect(() => {
    return () => {
      photos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    };
  }, [photos]);

  /**
   * Gestisce la selezione o lo scatto di nuove fotografie dal dispositivo mobile/desktop,
   * generando per ciascun file un URL di anteprima locale tramite `URL.createObjectURL`.
   *
   * @param e - Evento di cambio dell'input file `<input type="file">`.
   */
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const newPreviews: PhotoPreview[] = Array.from(fileList).map((file, idx) => ({
      id: `${Date.now()}-${idx}-${file.name}`,
      name: file.name,
      previewUrl: URL.createObjectURL(file),
    }));

    setPhotos((prev) => [...prev, ...newPreviews]);
    // Resetta il valore dell'input per permettere di riselezionare anche lo stesso file
    e.target.value = "";
  };

  /**
   * Rimuove una miniatura fotografica dallo stato revocando il relativo `objectURL`.
   *
   * @param id - Identificativo della foto da rimuovere.
   */
  const handleRemovePhoto = (id: string) => {
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((p) => p.id !== id);
    });
  };

  /**
   * Genera lato client il PDF del Verbale in stile "isole supercerchio",
   * avvia il download `Verbale_${type}_Mockup.pdf` e reindirizza a `/cantiere/${cantiere.id}`.
   *
   * @param e - Evento di submit del form HTML.
   */
  const generateVerbalePDF = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isGeneratingPdf) return;

    setIsGeneratingPdf(true);

    const submitTime = new Date();
    const dataOggi = submitTime.toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const oraOggi = submitTime.toLocaleTimeString("it-IT", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const tecnicoNome = user?.name ?? "Mario Rossi";
    const signatureBase64 =
      signaturePadRef.current?.getDataURL() ?? signatureDataUrl ?? null;

    // Salva i dati del verbale in localStorage per simulare la persistenza offline
    try {
      window.localStorage.setItem(
        `marlegno_verbale_${type.toLowerCase()}_${cantiere.id}`,
        JSON.stringify({
          cantiereId: cantiere.id,
          cantiereNome: cantiere.nome,
          type,
          dataEmissione: dataOggi,
          oraEmissione: oraOggi,
          tecnico: tecnicoNome,
          soggettiCoinvolti,
          elementoContestato: type === "Qualità" ? elementoContestato : undefined,
          dettaglioRilevazione,
          numeroFotoAllegate: photos.length,
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

      // 1. Header Principale: Box supercerchio verde scuro (#1e4d3b -> RGB [30, 77, 59])
      drawSuperRect(doc, 14, 10, 182, 16, {
        fillColor: [30, 77, 59],
        radius: 4,
      });
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(`VERBALE DI ${type.toUpperCase()}`, 20, 20);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.text(`Data emissione: ${dataOggi} • Ore ${oraOggi}`, 190, 20, {
        align: "right",
      });

      // 2. Box Grigio Chiaro (#f8faf9) con Data emissione e Dati Cantiere
      drawSuperRect(doc, 14, 30, 182, 22, {
        fillColor: [248, 250, 249],
        strokeColor: [220, 228, 224],
        radius: 4,
      });

      autoTable(doc, {
        startY: 32,
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
        head: [["CANTIERE", "INDIRIZZO", "DATA EMISSIONE", "TECNICO RILEVATORE"]],
        body: [
          [
            cantiere.nome,
            cantiere.indirizzo,
            `${dataOggi} (${oraOggi})`,
            tecnicoNome,
          ],
        ],
      });

      let currentY = 58;

      // 3. Corpo Centrale: Sezioni compilate racchiuse in isole supercerchio #f8faf9
      const detailRows: [string, string][] = [
        [
          "Soggetti Coinvolti (Imprese / Referenti)",
          soggettiCoinvolti.trim() !== ""
            ? soggettiCoinvolti.trim()
            : "Nessun soggetto specificato",
        ],
      ];

      if (type === "Qualità") {
        detailRows.push([
          "Elemento / Lavorazione Contestata",
          elementoContestato.trim() !== ""
            ? elementoContestato.trim()
            : "Non specificato",
        ]);
      }

      detailRows.push([
        "Descrizione della Non Conformità o Osservazione",
        dettaglioRilevazione.trim() !== ""
          ? dettaglioRilevazione.trim()
          : "Nessuna descrizione inserita",
      ]);

      const bodyTableConfig: UserOptions = {
        margin: { left: 17, right: 17 },
        tableWidth: 176,
        theme: "plain",
        styles: {
          fontSize: 9,
          cellPadding: 3,
          fillColor: [248, 250, 249],
          textColor: [30, 41, 59],
          lineColor: [226, 232, 240],
          lineWidth: { bottom: 0.15, top: 0, left: 0, right: 0 },
        },
        columnStyles: {
          0: { cellWidth: 55, fontStyle: "bold", textColor: [30, 77, 59] },
          1: { cellWidth: 121 },
        },
        body: detailRows,
      };

      const measuredHeight = measureAutoTableHeight(bodyTableConfig);
      const bodyCardHeight = 11 + measuredHeight + 3;

      drawSuperRect(doc, 14, currentY, 182, bodyCardHeight, {
        fillColor: [248, 250, 249],
        strokeColor: [220, 228, 224],
        radius: 4,
      });

      doc.setTextColor(30, 77, 59);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(`Dettaglio Verbale di ${type}`, 17.5, currentY + 7);

      autoTable(doc, {
        ...bodyTableConfig,
        startY: currentY + 9.5,
      });

      currentY = getLastAutoTableFinalY(doc, currentY + bodyCardHeight) + 7;

      // 4. Blocco Allegati Fotografici (se sono state caricate miniature nello stato)
      if (photos.length > 0) {
        drawSuperRect(doc, 14, currentY, 182, 16, {
          fillColor: [248, 250, 249],
          strokeColor: [220, 228, 224],
          radius: 4,
        });

        doc.setTextColor(30, 77, 59);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.text(
          "Allegati fotografici acquisiti digitalmente a sistema",
          17.5,
          currentY + 7
        );

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(
          `Totale allegati acquisiti: ${photos.length} (${photos
            .map((p) => p.name)
            .join(", ")})`,
          17.5,
          currentY + 12.5,
          { maxWidth: 175 }
        );

        currentY += 22;
      }

      // 5. Box Firme Finali in stile Supercerchio con Timestamp Certificato
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
          // Ignora eventuale immagine non valida
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

      // 6. Download del file PDF e redirect alla schermata del cantiere
      doc.save(`Verbale_${type}_Mockup.pdf`);

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

      <form
        onSubmit={generateVerbalePDF}
        className="mx-auto w-full max-w-2xl space-y-6 pb-28"
      >
        {/* Intestazione Principale e Box Metadati Data/Ora Correnti */}
        <div>
          <div className="px-1 mb-3">
            <span className="inline-block rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
              Modulo Ispettivo Cantiere
            </span>
            <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">
              Verbale di {type} Cantiere
            </h1>
          </div>

          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-6 flex flex-wrap justify-between items-center gap-2 text-sm text-gray-500">
            <span className="font-semibold text-gray-700">
              Data emissione: {todayFormatted}
            </span>
            <span>Ora rilevazione: {currentTimeFormatted}</span>
            <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand">
              Status: Nuova Emissione
            </span>
          </div>
        </div>

        {/* 1. Dati Cantiere in Sola Lettura */}
        <section className="rounded-super bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
            <ClipboardList className="h-5 w-5 text-brand" />
            <h2 className="text-base font-bold text-slate-900">
              Dati Cantiere
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

        {/* 2. Box "Soggetti Coinvolti" */}
        <section className="space-y-3 rounded-super bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Users className="h-5 w-5 text-brand" />
            <h2 className="text-base font-bold text-slate-900">
              Soggetti Coinvolti
            </h2>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="soggetti-coinvolti"
              className="block text-sm font-semibold text-slate-700"
            >
              Imprese/Referenti presenti
            </label>
            <textarea
              id="soggetti-coinvolti"
              rows={3}
              placeholder="Indica le imprese esecutrici, i preposti o i referenti presenti durante il sopralluogo..."
              value={soggettiCoinvolti}
              onChange={(e) => setSoggettiCoinvolti(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-background p-3.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </div>
        </section>

        {/* 3. Box Opzionale (visibile solo se type === 'Qualità'): Elemento/Lavorazione contestata */}
        {type === "Qualità" && (
          <section className="space-y-3 rounded-super bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Layers className="h-5 w-5 text-brand" />
              <h2 className="text-base font-bold text-slate-900">
                Ambito Qualità e Lavorazione
              </h2>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="elemento-contestato"
                className="block text-sm font-semibold text-slate-700"
              >
                Elemento/Lavorazione contestata
              </label>
              <input
                id="elemento-contestato"
                type="text"
                placeholder="es. Posa pareti XLAM Piano 1, Giunzioni strutturali copertura, Impermeabilizzazione..."
                value={elementoContestato}
                onChange={(e) => setElementoContestato(e.target.value)}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-background px-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>
          </section>
        )}

        {/* 4. Box "Dettaglio Rilevazione" */}
        <section className="space-y-3 rounded-super bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <FileText className="h-5 w-5 text-brand" />
            <h2 className="text-base font-bold text-slate-900">
              Dettaglio Rilevazione
            </h2>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="dettaglio-rilevazione"
              className="block text-sm font-semibold text-slate-700"
            >
              Descrizione della Non Conformità o Osservazione
            </label>
            <textarea
              id="dettaglio-rilevazione"
              rows={4}
              placeholder="Descrivi nel dettaglio l'osservazione rilevata, le azioni correttive richieste e le eventuali tempistiche..."
              value={dettaglioRilevazione}
              onChange={(e) => setDettaglioRilevazione(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-background p-3.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </div>
        </section>

        {/* 5. Box "Allegati Fotografici" con input file nascosto e griglia miniature */}
        <section className="space-y-4 rounded-super bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-brand" />
              <h2 className="text-base font-bold text-slate-900">
                Allegati Fotografici
              </h2>
            </div>
            {photos.length > 0 && (
              <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand">
                {photos.length} {photos.length === 1 ? "foto" : "foto"}
              </span>
            )}
          </div>

          <div>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              id="photo-upload"
              onChange={handlePhotoUpload}
              className="hidden"
            />
            <label
              htmlFor="photo-upload"
              className="flex h-14 w-full cursor-pointer items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed border-brand/30 bg-brand/[0.04] px-5 text-base font-semibold text-brand transition-all hover:bg-brand/[0.08] active:scale-[0.98]"
            >
              <Camera className="h-5 w-5" />
              <span>Allega Foto / Scatta</span>
            </label>
          </div>

          {photos.length > 0 && (
            <div className="grid grid-cols-3 gap-3 pt-1 sm:grid-cols-4">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="group relative aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-slate-100"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.previewUrl}
                    alt={photo.name}
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(photo.id)}
                    aria-label={`Rimuovi ${photo.name}`}
                    className="absolute top-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/65 text-white backdrop-blur-xs transition-transform active:scale-90"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 6. Box Firme: Firma Tecnico (fissa) + Firma Impresa (SignaturePad) */}
        <section className="space-y-5 rounded-super bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-slate-900">
            Validazione e Firme
          </h2>

          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
              <UserCheck className="h-4 w-4 text-brand" />
              <span>Firma Tecnico</span>
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

          <SignaturePad
            ref={signaturePadRef}
            label="Firma Impresa"
            onChange={(_hasSig, dataUrl) => setSignatureDataUrl(dataUrl)}
          />
        </section>

        {/* 7. Bottone Fisso in Basso: Salva e Genera PDF */}
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
