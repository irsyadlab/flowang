import { Outlet } from "react-router-dom";
import { useUIStore } from "@/stores/uiStore";
import BottomNav from "@/components/layout/BottomNav";
import ErrorMessage from "@/components/shared/ErrorMessage";
import TourController from "@/components/tour/TourController";

export default function AppLayout() {
  const dbError = useUIStore((state) => state.dbError);

  if (dbError !== null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <ErrorMessage message={dbError} />
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
