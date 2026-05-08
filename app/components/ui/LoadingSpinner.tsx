"use client";

import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  message?: string;
  size?: "sm" | "md" | "lg";
}

const SIZE_CLASSES: Record<NonNullable<LoadingSpinnerProps["size"]>, string> = {
  sm: "w-6 h-6",
  md: "w-12 h-12",
  lg: "w-16 h-16",
};

export function LoadingSpinner({
  message,
  size = "md",
}: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
      <Loader2
        className={`${SIZE_CLASSES[size]} text-purple-500 animate-spin`}
      />
      {message ? (
        <p className="text-white mt-4 text-lg animate-pulse">{message}</p>
      ) : null}
    </div>
  );
}
