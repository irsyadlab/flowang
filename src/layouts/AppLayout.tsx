import { Outlet } from "react-router-dom";
import { useUIStore } from "@/stores/uiStore";
import BottomNav from "@/components/layout/BottomNav";
import ErrorMessage from "@/components/shared/ErrorMessage";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import TourController from "@/components/tour/TourController";

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
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-2xl bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">F</span>
          </div>
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-[480px] flex-col bg-background">
      <TourController />
      <main className="flex-1 pb-24">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
