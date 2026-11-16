import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  shape?: "pill" | "super";
  fullWidth?: boolean;
}

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
