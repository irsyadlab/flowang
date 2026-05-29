import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save } from 'lucide-react';
import { localDateStr } from '@/lib/utils';
import { useLoanContactStore } from '@/stores/loanContactStore';
import type { LoanEntry, LoanEntryFormData } from '@/types';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

export default function LoanForm({ mode, defaultContactId, entry, onSubmit }: LoanFormProps) {
  const { contacts } = useLoanContactStore();

  const form = useForm<LoanEntryFormValues>({
    resolver: zodResolver(loanEntrySchema),
    defaultValues: {
      contactId: entry?.contactId || defaultContactId || '',
      amount: entry?.amount || 0,
      direction: entry?.direction || 'lend',
      date: entry?.date || localDateStr(),
      note: entry?.note || '',
    },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    onSubmit(data as LoanEntryFormData);
  });

  return (
    <div className="flex-1 px-4 pb-8">
      <div className="rounded-2xl border border-border bg-card p-5 space-y-5">
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <FormField
              control={form.control}
              name="contactId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Kontak</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={mode === 'edit' || !!defaultContactId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kontak" />
                      </SelectTrigger>
                      <SelectContent>
                        {contacts.map((contact) => (
                          <SelectItem key={contact.id} value={contact.id}>
                            {contact.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Jumlah</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium select-none">
                        Rp
                      </span>
                      <Input
                        type="number"
                        placeholder="0"
                        className="pl-9"
                        {...field}
                        value={field.value === 0 ? '' : field.value}
                        onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="direction"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Arah</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih arah" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lend">Piutang (Kamu meminjamkan)</SelectItem>
                        <SelectItem value="borrow">Hutang (Kamu meminjam)</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Tanggal</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Catatan (opsional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Catatan tambahan..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full gap-2"
              disabled={form.formState.isSubmitting}
            >
              <Save className="h-4 w-4" />
              {form.formState.isSubmitting
                ? 'Menyimpan...'
                : mode === 'edit'
                  ? 'Simpan Perubahan'
                  : 'Tambah Entri'}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
