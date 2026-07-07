import React from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  initials?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export function Avatar({
  className,
  src,
  alt = "",
  initials,
  size = "md",
  ...props
}: AvatarProps) {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-xl",
  };

  return (
    <div
      className={cn(
        "relative flex shrink-0 overflow-hidden rounded-full border border-st-border bg-st-bg-elevated",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          className="aspect-square h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center font-medium text-st-text-secondary bg-st-bg-elevated">
          {initials || alt.charAt(0).toUpperCase() || "?"}
        </div>
      )}
    </div>
  );
}
