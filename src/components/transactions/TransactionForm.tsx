import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { transactionSchema, type TransactionInput } from "@/lib/validators";
import { useWalletStore } from "@/stores/walletStore";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DatePickerSheet, formatDateShortID } from "@/components/ui/date-picker-sheet";
import { TrendingUp, TrendingDown, ArrowLeftRight } from "lucide-react";
import { localDateStr } from "@/lib/utils";
import CategoryCombobox from "@/components/transactions/CategoryCombobox";

interface TransactionFormProps {
  initialData?: TransactionInput;
  onSubmit: (data: TransactionInput) => Promise<void>;
  submitLabel?: string;
}

const TYPE_OPTIONS = [
  { value: "expense", label: "Keluar", icon: TrendingDown, color: "text-red-500", activeBg: "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400" },
  { value: "income",  label: "Masuk",  icon: TrendingUp,   color: "text-emerald-500", activeBg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400" },
  { value: "transfer", label: "Transfer", icon: ArrowLeftRight, color: "text-blue-500", activeBg: "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400" },
] as const;

/** Format number to IDR display string, e.g. 1500000 → "1.500.000" */
function formatAmount(value: number): string {
  if (!value) return "";
  return value.toLocaleString("id-ID");
}

export default function TransactionForm({ initialData, onSubmit, submitLabel = "Simpan" }: TransactionFormProps) {
  const wallets = useWalletStore((s) => s.wallets);

  const today = localDateStr();

  const form = useForm<TransactionInput>({
    resolver: zodResolver(transactionSchema),
    defaultValues: initialData ?? {
      type: "expense",
      amount: 0,
      walletId: "",
      toWalletId: "",
      categoryId: "",
      date: today,
      note: "",
    },
  });

  const watchType = useWatch({ control: form.control, name: "type" });
  const watchWalletId = useWatch({ control: form.control, name: "walletId" });
  const watchAmount = useWatch({ control: form.control, name: "amount" });
  const isTransfer = watchType === "transfer";

  const [displayAmount, setDisplayAmount] = useState(
    initialData?.amount ? formatAmount(initialData.amount) : ""
  );

  const activeType = TYPE_OPTIONS.find((t) => t.value === watchType);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

        {/* Type selector — pill tabs */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <div className="grid grid-cols-3 gap-2">
                {TYPE_OPTIONS.map(({ value, label, icon: Icon, activeBg }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      field.onChange(value);
                      // Reset category when switching type
                      form.setValue("categoryId", "");
                      form.setValue("toWalletId", "");
                    }}
                    className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all ${
                      field.value === value
                        ? activeBg
                        : "border-border bg-card text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </button>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Amount — hero input */}
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <div className={`w-full overflow-hidden rounded-2xl border p-5 transition-colors ${
                watchAmount > 0 ? "border-border bg-card" : "border-dashed border-border bg-card"
              }`}>
                <p className="text-xs font-medium text-muted-foreground mb-3">Jumlah</p>
                <div className="flex w-full items-center gap-2">
                  <span className="shrink-0 text-2xl font-bold text-muted-foreground/50">Rp</span>
                  <input
                    inputMode="numeric"
                    placeholder="0"
                    value={displayAmount}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^\d]/g, "");
                      const num = parseInt(raw, 10) || 0;
                      const formatted = num ? formatAmount(num) : "";
                      setDisplayAmount(formatted);
                      field.onChange(num);
                    }}
                    className="w-0 flex-1 bg-transparent text-3xl font-bold tracking-tight text-foreground outline-none placeholder:text-muted-foreground/30 truncate"
                  />
                </div>
                {watchAmount > 0 && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(watchAmount)}
                  </p>
                )}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Detail fields — grouped card */}
        <div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">

          {/* Wallet source */}
          <FormField
            control={form.control}
            name="walletId"
            render={({ field }) => (
              <FormItem className="p-0">
                <div className="flex items-center gap-3 px-4 py-3">
                  <span className="w-24 shrink-0 text-xs font-medium text-muted-foreground">
                    {isTransfer ? "Dari" : "Wallet"}
                  </span>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="border-0 shadow-none p-0 h-auto text-sm font-medium focus:ring-0 bg-transparent">
                        <SelectValue placeholder="Pilih wallet" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {wallets.map((w) => (
                        <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <FormMessage className="px-4 pb-2 text-xs" />
              </FormItem>
            )}
          />

          {/* Wallet destination (transfer only) */}
          {isTransfer && (
            <FormField
              control={form.control}
              name="toWalletId"
              render={({ field }) => (
                <FormItem className="p-0">
                  <div className="flex items-center gap-3 px-4 py-3">
                    <span className="w-24 shrink-0 text-xs font-medium text-muted-foreground">Ke</span>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="border-0 shadow-none p-0 h-auto text-sm font-medium focus:ring-0 bg-transparent">
                          <SelectValue placeholder="Pilih wallet tujuan" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {wallets.filter((w) => w.id !== watchWalletId).map((w) => (
                          <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <FormMessage className="px-4 pb-2 text-xs" />
                </FormItem>
              )}
            />
          )}

          {/* Category (non-transfer only) */}
          {!isTransfer && (
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem className="p-0">
                  <div className="flex items-center gap-3 px-4 py-3">
                    <span className="w-24 shrink-0 text-xs font-medium text-muted-foreground">Kategori</span>
                    <FormControl>
                      <CategoryCombobox
                        value={field.value}
                        onChange={field.onChange}
                        typeFilter={watchType === "income" || watchType === "expense" ? watchType : undefined}
                        placeholder="Pilih kategori"
                      />
                    </FormControl>
                  </div>
                  <FormMessage className="px-4 pb-2 text-xs" />
                </FormItem>
              )}
            />
          )}

          {/* Date */}
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="p-0">
                <div className="flex items-center gap-3 px-4 py-3">
                  <span className="w-24 shrink-0 text-xs font-medium text-muted-foreground">Tanggal</span>
                  <DatePickerSheet
                    value={field.value || today}
                    onChange={field.onChange}
                    trigger={
                      <span className="flex-1 text-sm font-medium text-foreground">
                        {formatDateShortID(field.value || today)}
                      </span>
                    }
                  />
                </div>
                <FormMessage className="px-4 pb-2 text-xs" />
              </FormItem>
            )}
          />

          {/* Note */}
          <FormField
            control={form.control}
            name="note"
            render={({ field }) => (
              <FormItem className="p-0">
                <div className="flex items-center gap-3 px-4 py-3">
                  <span className="w-24 shrink-0 text-xs font-medium text-muted-foreground">Catatan</span>
                  <input
                    type="text"
                    placeholder="Opsional..."
                    {...field}
                    className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/40"
                  />
                </div>
                <FormMessage className="px-4 pb-2 text-xs" />
              </FormItem>
            )}
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={form.formState.isSubmitting}
          variant={activeType?.value === "expense" ? "destructive" : "default"}
        >
          {submitLabel}
        </Button>
      </form>
    </Form>
  );
}
