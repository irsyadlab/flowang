import { useReports } from "@/hooks/useReports";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export default function RealtimeReport() {
  const { summary } = useReports();

  return (
    <div className="space-y-3">
      <Card>
        <CardContent className="pt-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Income</span>
              <span className="text-sm font-medium text-emerald-500">
                {formatCurrency(summary.totalIncome)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Expense</span>
              <span className="text-sm font-medium text-red-500">
                {formatCurrency(summary.totalExpense)}
              </span>
            </div>
            <div className="border-t border-border pt-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Saldo Bersih</span>
                <span className="text-sm font-bold">
                  {formatCurrency(summary.netBalance)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
