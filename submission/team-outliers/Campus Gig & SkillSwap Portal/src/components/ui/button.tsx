import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "accent";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315efb]/40 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none active:scale-[0.98] transition-transform";

    const variantStyles = {
      default: "bg-[#315efb] text-white shadow-sm hover:bg-[#2448d8] active:bg-[#1d39ac]",
      accent: "bg-[#eef2ff] text-[#27335a] hover:bg-[#dfe6ff] border border-[#cfd9ff]",
      destructive: "bg-red-600 text-white shadow-sm hover:bg-red-700",
      outline: "border border-[#dbe1eb] bg-white shadow-sm hover:bg-[#f7f8fc] hover:text-[#172033] text-[#45516a]",
      secondary: "bg-[#eef1f7] text-[#172033] shadow-sm hover:bg-[#e1e6ef]",
      ghost: "hover:bg-[#eef1f7] hover:text-[#172033] text-[#45516a]",
      link: "text-[#315efb] underline-offset-4 hover:underline",
    };

    const sizeStyles = {
      default: "h-10 px-4 py-2",
      sm: "h-8 rounded-md px-3 text-xs",
      lg: "h-11 rounded-lg px-8 text-base",
      icon: "h-9 w-9 p-0",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
