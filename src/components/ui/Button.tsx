/**
 * @file src/components/ui/Button.tsx
 * @description Componente atomico riutilizzabile per i pulsanti di "App Marlegno".
 * Implementa di default il Design System aziendale (verde `#063D37`, angoli arrotondati Apple-like e feedback tattile `active:scale-95`).
 */

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Proprietà supportate dal componente `Button`.
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Variante cromatica del pulsante (`"primary"` default verde Marlegno). */
  variant?: "primary" | "secondary" | "outline" | "ghost";
  /** Dimensione verticale e spaziatura orizzontale touch-friendly. */
  size?: "sm" | "md" | "lg";
  /** Forma del bordo arrotondato (`"pill"` per `rounded-full`, `"super"` per `rounded-2xl`). */
  shape?: "pill" | "super";
  /** Se `true`, espande il pulsante al 100% della larghezza del contenitore padre. */
  fullWidth?: boolean;
}

/**
 * Componente pulsante accessibile e touch-friendly con supporto `ref`.
 *
 * @param props - Configurazione visiva, attributi HTML nativi del bottone e contenuto figlio.
 * @param ref - Riferimento inoltrato all'elemento DOM `<button>`.
 * @returns Elemento JSX `<button>` stilizzato.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      shape = "pill",
      fullWidth = false,
      children,
      ...props
    },
    ref
  ) => {
    const variantClasses = {
      primary:
        "bg-primary text-white border-0 shadow-sm hover:bg-primary-hover",
      secondary:
        "bg-white text-primary border-0 shadow-sm hover:bg-slate-50",
      outline:
        "bg-transparent text-primary border border-primary/20 hover:bg-primary/5",
      ghost:
        "bg-transparent text-primary border-0 hover:bg-primary/10",
    };

    const sizeClasses = {
      sm: "h-10 px-4 text-sm font-medium",
      md: "h-12 px-6 text-base font-semibold",
      lg: "h-14 px-8 text-lg font-semibold",
    };

    const shapeClasses = {
      pill: "rounded-full",
      super: "rounded-2xl",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 select-none transition-all duration-150 ease-out active:scale-95 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          variantClasses[variant],
          sizeClasses[size],
          shapeClasses[shape],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
