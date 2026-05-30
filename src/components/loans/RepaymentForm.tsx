import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { localDateStr } from '@/lib/utils';
import type { LoanEntry, RepaymentFormData } from '@/types';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { DatePickerSheet, formatDateShortID } from '@/components/ui/date-picker-sheet';
import { useWalletStore } from '@/stores/walletStore';
import { useCategoryStore } from '@/stores/categoryStore';

/** Format number to IDR display string */
function formatAmount(value: number): string {
  if (!value) return '';
  return value.toLocaleString('id-ID');
}

interface RepaymentFormProps {
  loanEntry: LoanEntry;
  onSubmit: (data: RepaymentFormData) => void;
  onCancel?: () => void;
}

export default function RepaymentForm({ loanEntry, onSubmit, onCancel }: RepaymentFormProps) {
  const today = localDateStr();
  const wallets = useWalletStore((s) => s.wallets);
  const categories = useCategoryStore((s) => s.categories);

  // Build schema with closure over loanEntry.remainingAmount for dynamic validation
  const repaymentSchema = z
    .object({
      amount: z
        .number({ invalid_type_error: 'Jumlah harus lebih dari 0' })
        .gt(0, 'Jumlah harus lebih dari 0'),
      date: z.string().min(1, 'Tanggal wajib diisi'),
      note: z.string().optional(),
      categoryId: z.string().optional(),
      createTransaction: z.boolean(),
      walletId: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      // Validate amount ≤ remainingAmount (Requirements 1.4)
      if (data.amount > 0 && data.amount > loanEntry.remainingAmount) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Jumlah melebihi sisa hutang/piutang',
          path: ['amount'],
        });
      }
      // Validate required fields when toggle is active (Requirements 3.2)
      if (data.createTransaction) {
        if (!data.walletId || data.walletId.trim() === '') {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Wallet wajib dipilih saat mencatat sebagai transaksi',
            path: ['walletId'],
          });
        }
        if (!data.categoryId || data.categoryId.trim() === '') {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Kategori wajib diisi saat mencatat sebagai transaksi',
            path: ['categoryId'],
          });
        }
      }
    });

  type RepaymentFormValues = z.infer<typeof repaymentSchema>;

  const form = useForm<RepaymentFormValues>({
    resolver: zodResolver(repaymentSchema),
    defaultValues: {
      amount: 0,
      date: today,
      note: '',
      categoryId: '',
      createTransaction: false,
      walletId: '',
    },
  });

  const watchAmount = useWatch({ control: form.control, name: 'amount' });
  const watchCreateTransaction = useWatch({ control: form.control, name: 'createTransaction' });

  const [displayAmount, setDisplayAmount] = useState('');

  const handleSubmit = form.handleSubmit((data) => {
    const formData: RepaymentFormData = {
      loanEntryId: loanEntry.id,
      amount: data.amount,
      date: data.date,
      note: data.note || undefined,
      categoryId: data.categoryId || undefined,
      createTransaction: data.createTransaction,
      walletId: data.walletId || undefined,
    };
    onSubmit(formData);
  });

  return (
    <div className="flex-1 px-4 pb-8">
      <Form {...form}>
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Remaining amount hint (Requirements 1.7) */}
          <div className="rounded-2xl border border-border bg-muted/40 px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Sisa hutang/piutang:{' '}
              <span className="font-semibold text-foreground">
                {new Intl.NumberFormat('id-ID', {
                  style: 'currency',
                  currency: 'IDR',
                  maximumFractionDigits: 0,
                }).format(loanEntry.remainingAmount)}
              </span>
            </p>
          </div>

          {/* Amount — hero input (Requirements 1.2, 1.3, 1.4) */}
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <div
                  className={`w-full overflow-hidden rounded-2xl border p-5 transition-colors ${
                    watchAmount > 0
                      ? 'border-border bg-card'
                      : 'border-dashed border-border bg-card'
                  }`}
                >
                  <p className="text-xs font-medium text-muted-foreground mb-3">Jumlah Pembayaran</p>
                  <div className="flex w-full items-center gap-2">
                    <span className="shrink-0 text-2xl font-bold text-muted-foreground/50">Rp</span>
                    <input
                      inputMode="numeric"
                      placeholder="0"
                      value={displayAmount}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^\d]/g, '');
                        const num = parseInt(raw, 10) || 0;
                        setDisplayAmount(num ? formatAmount(num) : '');
                        field.onChange(num);
                      }}
                      className="w-0 flex-1 bg-transparent text-3xl font-bold tracking-tight text-foreground outline-none placeholder:text-muted-foreground/30 truncate"
                    />
                  </div>
                  {watchAmount > 0 && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        maximumFractionDigits: 0,
                      }).format(watchAmount)}
                    </p>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Detail fields — grouped card */}
          <div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">

            {/* Date (Requirements 1.2) */}
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

            {/* Note (Requirements 1.2) */}
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

          {/* Toggle: Catat sebagai transaksi (Requirements 3.1) */}
          <FormField
            control={form.control}
            name="createTransaction"
            render={({ field }) => (
              <FormItem>
                <div className="rounded-2xl border border-border bg-card px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">Catat sebagai transaksi</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Catat pembayaran ini ke wallet
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={field.value}
                      onClick={() => {
                        const next = !field.value;
                        field.onChange(next);
                        // Reset wallet and category when toggling off
                        if (!next) {
                          form.setValue('walletId', '');
                          form.setValue('categoryId', '');
                          form.clearErrors(['walletId', 'categoryId']);
                        }
                      }}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                        field.value ? 'bg-primary' : 'bg-input'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${
                          field.value ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Conditional fields when createTransaction is active (Requirements 3.2, 4.2) */}
          {watchCreateTransaction && (
            <div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">

              {/* Wallet (required when toggle is ON) */}
              <FormField
                control={form.control}
                name="walletId"
                render={({ field }) => (
                  <FormItem className="p-0">
                    <div className="flex items-center gap-3 px-4 py-3">
                      <span className="w-24 shrink-0 text-xs font-medium text-muted-foreground">
                        Wallet <span className="text-destructive">*</span>
                      </span>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ''}
                      >
                        <FormControl>
                          <SelectTrigger className="border-0 shadow-none p-0 h-auto text-sm font-medium focus:ring-0 bg-transparent">
                            <SelectValue placeholder="Pilih wallet" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {wallets.map((w) => (
                            <SelectItem key={w.id} value={w.id}>
                              {w.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <FormMessage className="px-4 pb-2 text-xs" />
                  </FormItem>
                )}
              />

              {/* Category (required when toggle is ON) (Requirements 4.2) */}
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem className="p-0">
                    <div className="flex items-center gap-3 px-4 py-3">
                      <span className="w-24 shrink-0 text-xs font-medium text-muted-foreground">
                        Kategori <span className="text-destructive">*</span>
                      </span>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ''}
                      >
                        <FormControl>
                          <SelectTrigger className="border-0 shadow-none p-0 h-auto text-sm font-medium focus:ring-0 bg-transparent">
                            <SelectValue placeholder="Pilih kategori" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <FormMessage className="px-4 pb-2 text-xs" />
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={onCancel}
              >
                Batal
              </Button>
            )}
            <Button
              type="submit"
              className={onCancel ? 'flex-1' : 'w-full'}
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? 'Menyimpan...' : 'Catat Pembayaran'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
