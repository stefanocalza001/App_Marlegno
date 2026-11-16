"use client";

/**
 * @file src/components/ui/SignaturePad.tsx
 * @description Componente interattivo basato su `<canvas>` HTML5 per l'acquisizione della firma digitale
 * su dispositivi touch (smartphone/tablet in cantiere) e desktop.
 */

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Eraser, PenLine } from "lucide-react";

/**
 * Metodi imperativi esposti tramite `ref` dal componente `SignaturePad`
 * per consentire al form padre di estrarre l'immagine Base64 durante la generazione del PDF.
 */
export interface SignaturePadHandle {
  /** Restituisce la firma come stringa Data URL PNG (`data:image/png;base64,...`) o `null` se vuota. */
  getDataURL: () => string | null;
  /** Indica se il riquadro firma è attualmente privo di tratti disegnati. */
  isEmpty: () => boolean;
  /** Cancella integralmente il contenuto del canvas e ripristina lo stato iniziale. */
  clear: () => void;
}

/**
 * Proprietà di configurazione del componente `SignaturePad`.
 */
interface SignaturePadProps {
  /** Etichetta descrittiva mostrata sopra l'area di firma. */
  label?: string;
  /** Callback invocata al termine di un tratto o alla pulizia del canvas. */
  onChange?: (hasSignature: boolean, dataUrl?: string) => void;
}

/**
 * Riquadro firma digitale con calibrazione automatica High-DPI (`devicePixelRatio`)
 * e blocco dello scroll verticale nativo durante il disegno touch (`touch-none`).
 *
 * @param props - Etichetta e callback di modifica dello stato firma.
 * @param ref - Riferimento imperativo conforme a `SignaturePadHandle`.
 * @returns Elemento JSX contenente l'intestazione, il pulsante di pulizia e il `<canvas>`.
 */
export const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(
  function SignaturePad(
    { label = "Firma Impresa Esecutrice", onChange },
    ref
  ) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const isDrawingRef = useRef(false);
    const [hasSignature, setHasSignature] = useState(false);

    /**
     * Pulisce il canvas di disegno e notifica il componente padre.
     */
    const clearCanvas = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasSignature(false);
      if (onChange) {
        onChange(false, undefined);
      }
    }, [onChange]);

    // Espone i metodi imperativi al componente genitore (es. ChecklistForm)
    useImperativeHandle(
      ref,
      () => ({
        getDataURL: () => {
          if (!hasSignature || !canvasRef.current) return null;
          return canvasRef.current.toDataURL("image/png");
        },
        isEmpty: () => !hasSignature,
        clear: clearCanvas,
      }),
      [hasSignature, clearCanvas]
    );

    // Configura la risoluzione fisica del canvas in base al devicePixelRatio dello schermo
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const setupCanvas = () => {
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.scale(dpr, dpr);
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.strokeStyle = "#063D37";
          ctx.lineWidth = 2.2;
        }
      };

      setupCanvas();
      window.addEventListener("resize", setupCanvas);
      return () => window.removeEventListener("resize", setupCanvas);
    }, []);

    /**
     * Normalizza le coordinate del puntatore (mouse o tocco singolo) rispetto al rettangolo del canvas.
     *
     * @param e - Evento mouse o touch generato dall'interazione dell'utente.
     * @returns Coordinate `{ x, y }` relative all'angolo superiore sinistro del canvas.
     */
    const getCoordinates = (
      e:
        | React.MouseEvent<HTMLCanvasElement>
        | React.TouchEvent<HTMLCanvasElement>
    ): { x: number; y: number } => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();

      if ("touches" in e) {
        const touch = e.touches[0] || e.changedTouches[0];
        return {
          x: touch.clientX - rect.left,
          y: touch.clientY - rect.top,
        };
      }

      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    /**
     * Avvia un nuovo tracciato sul canvas al primo tocco o click.
     */
    const startDrawing = (
      e:
        | React.MouseEvent<HTMLCanvasElement>
        | React.TouchEvent<HTMLCanvasElement>
    ) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const { x, y } = getCoordinates(e);
      isDrawingRef.current = true;
      ctx.beginPath();
      ctx.moveTo(x, y);
    };

    /**
     * Prosegue il disegno del tratto corrente durante il movimento del dito o del mouse.
     */
    const draw = (
      e:
        | React.MouseEvent<HTMLCanvasElement>
        | React.TouchEvent<HTMLCanvasElement>
    ) => {
      if (!isDrawingRef.current) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const { x, y } = getCoordinates(e);
      ctx.lineTo(x, y);
      ctx.stroke();

      if (!hasSignature) {
        setHasSignature(true);
      }
    };

    /**
     * Conclude il tratto corrente ed esporta l'immagine PNG aggiornata verso il callback `onChange`.
     */
    const stopDrawing = () => {
      if (!isDrawingRef.current) return;
      isDrawingRef.current = false;
      const canvas = canvasRef.current;
      if (canvas && onChange) {
        onChange(true, canvas.toDataURL("image/png"));
      }
    };

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
            <PenLine className="h-4 w-4 text-brand" />
            <span>{label}</span>
          </label>
          <button
            type="button"
            onClick={clearCanvas}
            className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-200 active:scale-95"
          >
            <Eraser className="h-3.5 w-3.5" />
            <span>Pulisci</span>
          </button>
        </div>

        <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 bg-background">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="h-36 w-full cursor-crosshair touch-none"
          />
          {!hasSignature && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-medium text-slate-400">
                Firma qui con il dito o il cursore
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
);
