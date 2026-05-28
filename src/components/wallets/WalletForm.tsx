import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { walletSchema, type WalletInput } from "@/lib/validators";
import { useWalletStore } from "@/stores/walletStore";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface WalletFormProps {
  initialData?: WalletInput;
  onSubmit: (data: WalletInput) => Promise<void>;
  submitLabel?: string;
}

export default function WalletForm({ initialData, onSubmit, submitLabel = "Simpan" }: WalletFormProps) {
  const wallets = useWalletStore((s) => s.wallets);

  const form = useForm<WalletInput>({
    resolver: zodResolver(walletSchema),
    defaultValues: initialData ?? {
      name: "",
      initialBalance: 0,
    },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    const isDuplicate = wallets.some(
      (w) => w.name.toLowerCase() === data.name.toLowerCase()
    );
    if (isDuplicate) {
      form.setError("name", { message: "Nama wallet sudah digunakan" });
      return;
    }
    await onSubmit(data);
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Wallet</FormLabel>
              <FormControl>
                <Input placeholder="Contoh: BCA, Cash, ..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="initialBalance"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Saldo Awal</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="0"
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {submitLabel}
        </Button>
      </form>
    </Form>
  );
}
