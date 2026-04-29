import { clsx } from "clsx";
import { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variants: Record<ButtonVariant, string> = {
  primary: "bg-blue-600 hover:bg-blue-500 text-white border border-blue-500",
  secondary: "bg-[#1a2540] hover:bg-[#1e2d4a] text-slate-200 border border-[#2d4270]",
  ghost: "hover:bg-[#1a2540] text-slate-300 border border-transparent",
  danger: "bg-red-900/50 hover:bg-red-800/60 text-red-300 border border-red-800",
  success: "bg-emerald-900/50 hover:bg-emerald-800/60 text-emerald-300 border border-emerald-800",
};

const sizes: Record<ButtonSize, string> = {
  sm: "px-2.5 py-1 text-xs",
  md: "px-3.5 py-1.5 text-sm",
  lg: "px-5 py-2.5 text-sm",
};

export function Button({ variant = "secondary", size = "md", className, children, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex items-center gap-1.5 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
