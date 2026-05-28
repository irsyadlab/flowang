import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  fullscreen?: boolean;
}

export default function LoadingSpinner({ fullscreen }: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center",
        fullscreen && "min-h-screen"
      )}
    >
      <div className="relative h-8 w-8">
        <div className="absolute inset-0 rounded-full border-2 border-border" />
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-primary" />
      </div>
    </div>
  );
}
