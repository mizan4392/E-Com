"use client";

type LoadingSpinnerProps = {
  size?: "sm" | "md" | "lg";
  color?: "white" | "dark" | "primary";
  className?: string;
};

const sizeClasses = {
  sm: "h-4 w-4 border-2",
  md: "h-5 w-5 border-2",
  lg: "h-6 w-6 border-3",
};

const colorClasses = {
  white: "border-white/30 border-t-white",
  dark: "border-zinc-300 border-t-zinc-600",
  primary: "border-blue-200 border-t-blue-600",
};

export default function LoadingSpinner({
  size = "md",
  color = "primary",
  className = "",
}: LoadingSpinnerProps) {
  return (
    <div
      className={`animate-spin rounded-full ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}
