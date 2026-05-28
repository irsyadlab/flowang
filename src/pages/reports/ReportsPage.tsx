import { useEffect } from "react";
import { useTransactionStore } from "@/stores/transactionStore";
import { useWalletStore } from "@/stores/walletStore";
import { useCategoryStore } from "@/stores/categoryStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RealtimeReport from "@/components/reports/RealtimeReport";
import MonthlyReport from "@/components/reports/MonthlyReport";
import CustomReport from "@/components/reports/CustomReport";
import ErrorMessage from "@/components/shared/ErrorMessage";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

export default function ReportsPage() {
  const { isLoading: txLoading, error: txError, loadTransactions } = useTransactionStore();
  const { loadWallets } = useWalletStore();
  const { loadCategories } = useCategoryStore();

  useEffect(() => {
    loadTransactions();
    loadWallets();
    loadCategories();
  }, [loadTransactions, loadWallets, loadCategories]);

  if (txLoading) {
    return <LoadingSpinner fullscreen />;
  }

  if (txError) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <h1 className="text-xl font-bold text-foreground pt-1">Laporan</h1>
        <ErrorMessage message={txError} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-6">
      <h1 className="text-xl font-bold text-foreground pt-1">Laporan</h1>
      <Tabs defaultValue="realtime">
        <TabsList className="w-full rounded-2xl bg-muted p-1 h-auto">
          <TabsTrigger value="realtime" className="flex-1 rounded-xl text-xs font-medium py-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
            Realtime
          </TabsTrigger>
          <TabsTrigger value="monthly" className="flex-1 rounded-xl text-xs font-medium py-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
            Bulanan
          </TabsTrigger>
          <TabsTrigger value="custom" className="flex-1 rounded-xl text-xs font-medium py-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
            Custom
          </TabsTrigger>
        </TabsList>
        <TabsContent value="realtime" className="mt-4">
          <RealtimeReport />
        </TabsContent>
        <TabsContent value="monthly" className="mt-4">
          <MonthlyReport />
        </TabsContent>
        <TabsContent value="custom" className="mt-4">
          <CustomReport />
        </TabsContent>
      </Tabs>
    </div>
  );
}
