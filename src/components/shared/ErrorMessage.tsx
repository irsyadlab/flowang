import { AlertTriangle } from "lucide-react";

interface ErrorMessageProps {
  message: string;
  fullscreen?: boolean;
}

export default function ErrorMessage({ message, fullscreen }: ErrorMessageProps) {
  const content = (
    <div className="flex flex-col items-center gap-3 text-center">
      <AlertTriangle className="h-10 w-10 text-destructive" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );

  if (fullscreen) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        {content}
      </div>
    );
  }

  return <div className="px-4 py-6">{content}</div>;
}
