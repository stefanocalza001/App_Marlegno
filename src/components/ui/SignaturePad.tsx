"use client";

import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Eraser, PenLine } from "lucide-react";

export interface SignaturePadHandle {
  getDataURL: () => string | null;
  isEmpty: () => boolean;
  clear: () => void;
}

interface SignaturePadProps {
  label?: string;
  onChange?: (hasSignature: boolean, dataUrl?: string) => void;
}

export const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(
  function SignaturePad(
    { label = "Firma Impresa Esecutrice", onChange },
    ref
  ) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const isDrawingRef = useRef(false);
    const [hasSignature, setHasSignature] = useState(false);

    useImperativeHandle(
      ref,
      () => ({
        getDataURL: () => {
          if (!hasSignature || !canvasRef.current) return null;
          return canvasRef.current.toDataURL("image/png");
        },
        isEmpty: () => !hasSignature,
        clear: () => clearCanvas(),
      }),
      [hasSignature]
    );

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

    const getCoordinates = (
      e:
        | React.MouseEvent<HTMLCanvasElement>
        | React.TouchEvent<HTMLCanvasElement>
    ) => {
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

    const stopDrawing = () => {
      if (!isDrawingRef.current) return;
      isDrawingRef.current = false;
      const canvas = canvasRef.current;
      if (canvas && onChange) {
        onChange(true, canvas.toDataURL("image/png"));
      }
    };

    const clearCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasSignature(false);
      if (onChange) {
        onChange(false, undefined);
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
