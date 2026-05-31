import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MonthlyReportChart from "@/components/reports/MonthlyReportChart";
import MonthlyReportCategory from "@/components/reports/MonthlyReportCategory";
import MonthlyReportNote from "@/components/reports/MonthlyReportNote";
import { localDateStr } from "@/lib/utils";
import { useStickyHeader } from "@/hooks/useStickyHeader";

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export default function MonthlyDetailPage() {
  const stickyHeader = useStickyHeader();
  const { year, month } = useParams<{ year: string; month: string }>();
  const navigate = useNavigate();

  const y = Number(year);
  const m = Number(month); // 1-12

  const { dateFrom, dateTo } = useMemo(() => {
    const firstDay = new Date(y, m - 1, 1);
    const lastDay = new Date(y, m, 0);
    return {
      dateFrom: localDateStr(firstDay),
      dateTo: localDateStr(lastDay),
    };
  }, [y, m]);

  if (!y || !m || m < 1 || m > 12) {
    return (
      <div className="p-4">
        <p className="text-sm text-muted-foreground">Periode tidak valid.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className={`${stickyHeader} px-4 flex items-center gap-2 py-3`}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          aria-label="Kembali"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-foreground leading-tight">
            {MONTH_NAMES[m - 1]} {y}
          </h1>
          <p className="text-[10px] text-muted-foreground">Laporan Bulanan</p>
        </div>
      </div>
      <div className="flex flex-col gap-4 px-4 pb-6">

      {/* Tabs */}
      <Tabs defaultValue="chart">
        <TabsList className="w-full rounded-2xl bg-muted p-1 h-auto">
          <TabsTrigger value="chart" className="flex-1 rounded-xl text-xs font-medium py-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
            Chart
          </TabsTrigger>
          <TabsTrigger value="kategori" className="flex-1 rounded-xl text-xs font-medium py-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
            Kategori
          </TabsTrigger>
          <TabsTrigger value="judul" className="flex-1 rounded-xl text-xs font-medium py-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
            Judul
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chart" className="mt-4">
          <MonthlyReportChart year={y} month={m} dateFrom={dateFrom} dateTo={dateTo} />
        </TabsContent>
        <TabsContent value="kategori" className="mt-4">
          <MonthlyReportCategory dateFrom={dateFrom} dateTo={dateTo} />
        </TabsContent>
        <TabsContent value="judul" className="mt-4">
          <MonthlyReportNote dateFrom={dateFrom} dateTo={dateTo} />
        </TabsContent>
      </Tabs>
    </div>
    </div>
  );
}
