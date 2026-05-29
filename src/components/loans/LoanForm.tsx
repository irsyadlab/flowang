import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { localDateStr } from '@/lib/utils';
import type { LoanEntry, LoanEntryFormData } from '@/types';
import {
  Form,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { DatePickerSheet, formatDateShortID } from '@/components/ui/date-picker-sheet';
import ContactCombobox from '@/components/loans/ContactCombobox';
import { TrendingUp, TrendingDown } from 'lucide-react';

const loanEntrySchema = z.object({
  contactId: z.string().min(1, 'Kontak wajib dipilih'),
  amount: z.number()
    .gt(0, 'Jumlah harus lebih dari 0')
    .max(999_999_999_999, 'Jumlah melebihi batas maksimum'),
  direction: z.enum(['lend', 'borrow'], { required_error: 'Arah hutang wajib dipilih' }),
  date: z.string().min(1, 'Tanggal wajib diisi'),
  note: z.string().optional(),
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
  const today = localDateStr();  const form = useForm<LoanEntryFormValues>({
    resolver: zodResolver(loanEntrySchema),
    defaultValues: {
      contactId: entry?.contactId || defaultContactId || '',
      amount: entry?.amount || 0,
      direction: entry?.direction || 'lend',
      date: entry?.date || today,
      note: entry?.note || '',
    },
  });

  const watchAmount = useWatch({ control: form.control, name: 'amount' });
  const watchDirection = useWatch({ control: form.control, name: 'direction' });

  const [displayAmount, setDisplayAmount] = useState(
    entry?.amount ? formatAmount(entry.amount) : ''
  );

  const handleSubmit = form.handleSubmit(async (data) => {
    onSubmit(data as LoanEntryFormData);
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
                <div className="grid grid-cols-2 gap-2">
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
