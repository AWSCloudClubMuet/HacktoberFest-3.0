import * as React from "react";
import { cn } from "@/lib/utils";

export interface BentoGridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function BentoGrid({ className, children, ...props }: BentoGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-min",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface BentoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  colSpan?: 1 | 2 | 3 | 4;
  rowSpan?: 1 | 2;
  gradient?: boolean;
}

export function BentoCard({
  className,
  children,
  colSpan = 1,
  rowSpan = 1,
  gradient = false,
  ...props
}: BentoCardProps) {
  const colSpanClasses = {
    1: "col-span-1",
    2: "col-span-1 md:col-span-2",
    3: "col-span-1 md:col-span-2 lg:col-span-3",
    4: "col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4",
  };

  const rowSpanClasses = {
    1: "row-span-1",
    2: "row-span-1 md:row-span-2",
  };

  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-stone-200/80 bg-white/95 p-6 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-amber-200/80",
        gradient && "bg-gradient-to-br from-amber-50/50 via-white to-stone-50/40",
        colSpanClasses[colSpan],
        rowSpanClasses[rowSpan],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
