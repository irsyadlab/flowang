import { Suspense, lazy, useState } from "react";
import { Outlet } from "react-router-dom";
import { useUIStore } from "@/stores/uiStore";
import { useTourStore } from "@/stores/tourStore";
import { shouldAutoStart } from "@/lib/tourStorage";
import BottomNav from "@/components/layout/BottomNav";
import ErrorMessage from "@/components/shared/ErrorMessage";

/**
 * TourController membawa react-joyride (~71 KB) dan dirender di shell ini,
 * artinya ada di setiap halaman. Padahal tour hanya relevan bagi user yang
 * belum pernah menjalankannya.
 *
 * Karena itu dia bukan hanya di-lazy-load, tapi juga baru dirender saat memang
 * dibutuhkan. Lazy saja tidak cukup: komponennya tetap mount di tiap halaman,
 * jadi chunk-nya tetap terunduh — hanya bergeser keluar dari critical path.
 * Dengan gate ini, user lama tidak pernah mengunduhnya sama sekali.
 */
const TourController = lazy(() => import("@/components/tour/TourController"));

export default function AppLayout() {
  const dbError = useUIStore((state) => state.dbError);

  // Tour berjalan karena dimulai manual dari halaman More (restartTour)
  const tourRunning = useTourStore((state) => state.run);

  // Dievaluasi sekali saat mount: user baru (belum ada status tour tersimpan).
  // Sengaja tidak reaktif — begitu chunk-nya termuat, tidak ada gunanya
  // meng-unmount controller di tengah sesi.
  const [isFirstTimeUser] = useState(shouldAutoStart);

  if (dbError !== null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <ErrorMessage message={dbError} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-[480px] flex-col bg-background">
      {(isFirstTimeUser || tourRunning) && (
        <Suspense fallback={null}>
          <TourController />
        </Suspense>
      )}
      <main className="flex-1 pb-24">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
