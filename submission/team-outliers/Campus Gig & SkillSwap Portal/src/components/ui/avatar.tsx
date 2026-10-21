import * as React from "react";
import { cn } from "@/lib/utils";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

function Avatar({ src, alt = "Avatar", fallback = "U", size = "md", className, ...props }: AvatarProps) {
  const [imageError, setImageError] = React.useState(false);

  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-base",
    xl: "h-20 w-20 text-xl font-bold",
  };

  const initials = fallback.slice(0, 2).toUpperCase();

  return (
    <div
      className={cn(
        "relative flex shrink-0 overflow-hidden rounded-full ring-2 ring-amber-100 shadow-sm bg-stone-100 items-center justify-center font-heading font-bold text-stone-700",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {src && !imageError ? (
        <img
          src={src}
          alt={alt}
          onError={() => setImageError(true)}
          className="aspect-square h-full w-full object-cover"
        />
      ) : (
        <span className="select-none">{initials}</span>
      )}
    </div>
  );
}

export { Avatar };
