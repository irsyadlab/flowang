import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { localDateStr, localTimeStr } from '@/lib/utils';
import type { LoanEntry, LoanEntryFormData } from '@/types';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { DatePickerSheet, formatDateShortID } from '@/components/ui/date-picker-sheet';
import { TimePickerSheet, formatTimeDisplay } from '@/components/ui/time-picker-sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ContactCombobox from '@/components/loans/ContactCombobox';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useWalletStore } from '@/stores/walletStore';
import { useCategoryStore } from '@/stores/categoryStore';

const loanEntrySchema = z.object({
  contactId: z.string().min(1, 'Kontak wajib dipilih'),
  amount: z.number()
    .gt(0, 'Jumlah harus lebih dari 0')
    .max(999_999_999_999, 'Jumlah melebihi batas maksimum'),
  direction: z.enum(['lend', 'borrow'], { required_error: 'Arah hutang wajib dipilih' }),
  date: z.string().min(1, 'Tanggal wajib diisi'),
  time: z.string().optional(),
  note: z.string().optional(),
  categoryId: z.string().optional(),
  createTransaction: z.boolean().default(false),
  walletId: z.string().optional(),
}).superRefine((data, ctx) => {
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

type LoanEntryFormValues = z.infer<typeof loanEntrySchema>;

interface LoanFormProps {
  mode: 'create' | 'edit';
  defaultContactId?: string;
  entry?: LoanEntry;
  onSubmit: (data: LoanEntryFormData) => void;
}

const DIRECTION_OPTIONS = [
  {
    value: 'lend',
    label: 'Piutang',
    sublabel: 'Kamu meminjamkan',
    icon: TrendingUp,
    activeBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
  },
  {
    value: 'borrow',
    label: 'Hutang',
    sublabel: 'Kamu meminjam',
    icon: TrendingDown,
    activeBg: 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400',
  },
] as const;

/** Format number to IDR display string */
function formatAmount(value: number): string {
  if (!value) return '';
  return value.toLocaleString('id-ID');
}

export default function LoanForm({ mode, defaultContactId, entry, onSubmit }: LoanFormProps) {
  const today = localDateStr();
  const wallets = useWalletStore((s) => s.wallets);
  const categories = useCategoryStore((s) => s.categories);

  const form = useForm<LoanEntryFormValues>({
    resolver: zodResolver(loanEntrySchema),
    defaultValues: {
      contactId: entry?.contactId || defaultContactId || '',
      amount: entry?.amount || 0,
      direction: entry?.direction || 'lend',
      date: entry?.date || today,
      time: entry?.time || localTimeStr(),
      note: entry?.note || '',
      categoryId: entry?.categoryId || '',
      createTransaction: false,
      walletId: '',
    },
  });

  const watchAmount = useWatch({ control: form.control, name: 'amount' });
  const watchDirection = useWatch({ control: form.control, name: 'direction' });
  const watchCreateTransaction = useWatch({ control: form.control, name: 'createTransaction' });
  const watchTime = useWatch({ control: form.control, name: 'time' });

  const [displayAmount, setDisplayAmount] = useState(
    entry?.amount ? formatAmount(entry.amount) : ''
  );

  const handleSubmit = form.handleSubmit(async (data) => {
    const formData: LoanEntryFormData = {
      contactId: data.contactId,
      amount: data.amount,
      direction: data.direction,
      date: data.date,
      time: data.time || undefined,
      note: data.note,
      categoryId: data.categoryId || undefined,
      createTransaction: data.createTransaction,
      walletId: data.walletId || undefined,
    };
    onSubmit(formData);
  });

  const activeDir = DIRECTION_OPTIONS.find((d) => d.value === watchDirection);

  return (
    <div className="flex-1 px-4 pb-8">
      <Form {...form}>
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Direction selector */}
          <FormField
            control={form.control}
            name="direction"
            render={({ field }) => (
              <FormItem>
                <div className="grid grid-cols-2 gap-2" data-tour="loan-form-direction">
                  {DIRECTION_OPTIONS.map(({ value, label, sublabel, icon: Icon, activeBg }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => field.onChange(value)}
                      className={`flex flex-col items-center gap-1 rounded-2xl border px-3 py-3 text-center transition-all ${
                        field.value === value
                          ? activeBg
                          : 'border-border bg-card text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-xs font-semibold">{label}</span>
                      <span className="text-[10px] opacity-70">{sublabel}</span>
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
                  watchAmount > 0 ? 'border-border bg-card' : 'border-dashed border-border bg-card'
                }`}>
                  <p className="text-xs font-medium text-muted-foreground mb-3">Jumlah</p>
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
                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(watchAmount)}
                    </p>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Detail fields — grouped card */}
          <div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">

            {/* Contact */}
            <FormField
              control={form.control}
              name="contactId"
              render={({ field }) => (
                <FormItem className="p-0">
                  <div className="flex items-center gap-3 px-4 py-3">
                    <span className="w-24 shrink-0 text-xs font-medium text-muted-foreground">Kontak</span>
                    <ContactCombobox
                      value={field.value}
                      onChange={field.onChange}
                      disabled={mode === 'edit' || !!defaultContactId}
                    />
                  </div>
                  <FormMessage className="px-4 pb-2 text-xs" />
                </FormItem>
              )}
            />

            {/* Date + Time */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="p-0">
                  <div className="flex items-center justify-between gap-3 px-4 py-3">
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
                    <TimePickerSheet
                      value={watchTime || ''}
                      onChange={(v) => form.setValue('time', v)}
                      trigger={
                        <span className="text-sm font-medium text-foreground tabular-nums">
                          {watchTime ? formatTimeDisplay(watchTime) : <span className="text-muted-foreground/50 text-xs">Jam</span>}
                        </span>
                      }
                    />
                  </div>
                  <FormMessage className="px-4 pb-2 text-xs" />
                </FormItem>
              )}
            />

            {/* Category (always visible, optional) */}
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem className="p-0">
                  <div className="flex items-center gap-3 px-4 py-3">
                    <span className="w-24 shrink-0 text-xs font-medium text-muted-foreground">Kategori</span>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ''}
                    >
                      <FormControl>
                        <SelectTrigger className="border-0 shadow-none p-0 h-auto text-sm font-medium focus:ring-0 bg-transparent">
                          <SelectValue placeholder="Opsional..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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

          {/* Toggle: Catat sebagai transaksi */}
          <FormField
            control={form.control}
            name="createTransaction"
            render={({ field }) => (
              <FormItem className="p-0">
                <div className="rounded-2xl border border-border bg-card px-4 py-3">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={field.value}
                    data-tour="loan-form-create-tx"
                    onClick={() => {
                      field.onChange(!field.value);
                      if (field.value) {
                        // Reset wallet and category when toggling off
                        form.setValue('walletId', '');
                        form.clearErrors(['walletId', 'categoryId']);
                      }
                    }}
                    className="flex w-full items-center justify-between"
                  >
                    <span className="text-sm font-medium text-foreground">Catat sebagai transaksi</span>
                    <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      field.value ? 'bg-primary' : 'bg-muted'
                    }`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        field.value ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </div>
                  </button>
                </div>
              </FormItem>
            )}
          />

          {/* Conditional fields when createTransaction is ON */}
          {watchCreateTransaction && (
            <div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">

              {/* Wallet selector */}
              <FormField
                control={form.control}
                name="walletId"
                render={({ field }) => (
                  <FormItem className="p-0">
                    <div className="flex items-center gap-3 px-4 py-3">
                      <span className="w-24 shrink-0 text-xs font-medium text-muted-foreground">Wallet</span>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
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

              {/* Category selector (required when toggle is ON) */}
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem className="p-0">
                    <div className="flex items-center gap-3 px-4 py-3">
                      <span className="w-24 shrink-0 text-xs font-medium text-muted-foreground">Kategori</span>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                          <SelectTrigger className="border-0 shadow-none p-0 h-auto text-sm font-medium focus:ring-0 bg-transparent">
                            <SelectValue placeholder="Pilih kategori" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
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

          <Button
            type="submit"
            className="w-full"
            disabled={form.formState.isSubmitting}
            variant={activeDir?.value === 'borrow' ? 'destructive' : 'default'}
          >
            {form.formState.isSubmitting
              ? 'Menyimpan...'
              : mode === 'edit'
                ? 'Simpan Perubahan'
                : 'Tambah Entri'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
