import { Outlet } from "react-router-dom";
import { useUIStore } from "@/stores/uiStore";
import BottomNav from "@/components/layout/BottomNav";
import ErrorMessage from "@/components/shared/ErrorMessage";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

export default function AppLayout() {
  const dbReady = useUIStore((state) => state.dbReady);
  const dbError = useUIStore((state) => state.dbError);

  if (dbError !== null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <ErrorMessage message={dbError} />
      </div>
    );
  }

  if (!dbReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingSpinner fullscreen />
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-[480px] flex-col bg-background font-sans">
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
