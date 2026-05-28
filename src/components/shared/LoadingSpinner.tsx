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
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
    </div>
  );
}
