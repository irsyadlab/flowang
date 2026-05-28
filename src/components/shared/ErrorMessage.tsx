import { AlertTriangle } from "lucide-react";

interface ErrorMessageProps {
  message: string;
  fullscreen?: boolean;
}

export default function ErrorMessage({ message, fullscreen }: ErrorMessageProps) {
  const content = (
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10">
        <AlertTriangle className="h-5 w-5 text-destructive" />
      </div>
      <p className="text-sm text-muted-foreground max-w-[240px] leading-relaxed">{message}</p>
    </div>
  );

  if (fullscreen) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        {content}
      </div>
    );
  }

  return <div className="px-4 py-8">{content}</div>;
}
