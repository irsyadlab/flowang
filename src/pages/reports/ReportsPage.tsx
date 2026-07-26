import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useTransactionStore } from "@/stores/transactionStore";
import { useLoanEntries } from "@/hooks/useLoanEntries";
import { useLoanRepayments } from "@/hooks/useLoanRepayments";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RealtimeReport from "@/components/reports/RealtimeReport";
import MonthlyReport from "@/components/reports/MonthlyReport";
import CustomReport from "@/components/reports/CustomReport";
import LoanReportSection from "@/components/loans/LoanReportSection";
import ErrorMessage from "@/components/shared/ErrorMessage";
import { useStickyHeader } from "@/hooks/useStickyHeader";

export default function ReportsPage() {
  const stickyHeader = useStickyHeader();
  const navigate = useNavigate();
  const txError = useTransactionStore((s) => s.error);
  const { entries } = useLoanEntries();
  const { repayments } = useLoanRepayments();

  const handleNavigateToContact = useCallback(
    (contactId: string) => {
      try {
        navigate(`/loans/${contactId}`);
      } catch {
        toast.error("Gagal membuka halaman detail. Silakan coba lagi.");
      }
    },
    [navigate]
  );

  if (txError) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <h1 className="text-xl font-bold text-foreground pt-1">Laporan</h1>
        <ErrorMessage message={txError} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-6">
      <div className={`${stickyHeader} px-4 py-3`}>
        <h1 className="text-xl font-bold text-foreground">Laporan</h1>
      </div>
      <div className="px-4 flex flex-col gap-4">
      <Tabs defaultValue="realtime">
        <TabsList className="w-full rounded-2xl bg-muted p-1 h-auto">
          <TabsTrigger value="realtime" data-tour="report-tab-realtime" className="flex-1 rounded-xl text-xs font-medium py-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
            Realtime
          </TabsTrigger>
          <TabsTrigger value="monthly" data-tour="report-tab-monthly" className="flex-1 rounded-xl text-xs font-medium py-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
            Bulanan
          </TabsTrigger>
          <TabsTrigger value="custom" data-tour="report-tab-custom" className="flex-1 rounded-xl text-xs font-medium py-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
            Custom
          </TabsTrigger>
        </TabsList>
        <TabsContent value="realtime" className="mt-4 space-y-4">
          <RealtimeReport />
          <LoanReportSection
            entries={entries}
            repayments={repayments}
            onNavigateToContact={handleNavigateToContact}
          />
        </TabsContent>
        <TabsContent value="monthly" className="mt-4 space-y-4">
          <MonthlyReport />
          <LoanReportSection
            entries={entries}
            repayments={repayments}
            onNavigateToContact={handleNavigateToContact}
          />
        </TabsContent>
        <TabsContent value="custom" className="mt-4 space-y-4">
          <CustomReport />
          <LoanReportSection
            entries={entries}
            repayments={repayments}
            onNavigateToContact={handleNavigateToContact}
          />
        </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
