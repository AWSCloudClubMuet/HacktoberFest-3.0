import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | "default"
    | "secondary"
    | "destructive"
    | "outline"
    | "success"
    | "warning"
    | "info"
    | "category-programming"
    | "category-design"
    | "category-writing"
    | "category-tutoring";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const baseStyles =
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";

  const variantStyles = {
    default: "border-transparent bg-[#315efb] text-white shadow hover:bg-[#2448d8]",
    secondary: "border-transparent bg-[#eef1f7] text-[#45516a] hover:bg-[#e1e6ef]",
    destructive: "border-transparent bg-red-600 text-white shadow hover:bg-red-700",
    outline: "text-[#45516a] border-[#dbe1eb]",
    success: "border-transparent bg-[#e7f7f0] text-[#087f5b] border-[#bde8d7]",
    warning: "border-transparent bg-[#fff4df] text-[#b15f00] border-[#f5dba8]",
    info: "border-transparent bg-[#e8f0ff] text-[#315efb] border-[#cfd9ff]",
    "category-programming": "border-[#cfd9ff] bg-[#e8f0ff] text-[#315efb] font-medium",
    "category-design": "border-[#ead8ff] bg-[#f5ecff] text-[#7c3aed] font-medium",
    "category-writing": "border-[#bde8d7] bg-[#e7f7f0] text-[#087f5b] font-medium",
    "category-tutoring": "border-[#f5dba8] bg-[#fff4df] text-[#b15f00] font-medium",
  };

  return <div className={cn(baseStyles, variantStyles[variant], className)} {...props} />;
}

export { Badge };
