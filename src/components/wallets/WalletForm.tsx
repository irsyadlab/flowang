import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { walletSchema, walletEditSchema, type WalletInput, type WalletEditInput } from "@/lib/validators";
import { useWalletStore } from "@/stores/walletStore";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface WalletFormCreateProps {
  mode?: "create";
  initialData?: WalletInput;
  currentBalance?: never;
  excludeId?: string;
  onSubmit: (data: WalletInput) => Promise<void>;
  submitLabel?: string;
}

interface WalletFormEditProps {
  mode: "edit";
  initialData?: Pick<WalletInput, "name">;
  currentBalance: number;
  excludeId?: string;
  onSubmit: (data: WalletEditInput) => Promise<void>;
  submitLabel?: string;
}

type WalletFormProps = WalletFormCreateProps | WalletFormEditProps;

export default function WalletForm(props: WalletFormProps) {
  const { mode = "create", initialData, excludeId, submitLabel = "Simpan" } = props;
  const wallets = useWalletStore((s) => s.wallets);

  const createForm = useForm<WalletInput>({
    resolver: zodResolver(walletSchema),
    defaultValues: (mode === "create" ? initialData : undefined) ?? {
      name: "",
      initialBalance: 0,
    },
  });

  const editForm = useForm<WalletEditInput>({
    resolver: zodResolver(walletEditSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      balance: mode === "edit" ? (props as WalletFormEditProps).currentBalance : 0,
    },
  });

  if (mode === "edit") {
    const handleSubmit = editForm.handleSubmit(async (data) => {
      const isDuplicate = wallets.some(
        (w) => w.id !== excludeId && w.name.toLowerCase() === data.name.toLowerCase()
      );
      if (isDuplicate) {
        editForm.setError("name", { message: "Nama wallet sudah digunakan" });
        return;
      }
      await (props as WalletFormEditProps).onSubmit(data);
    });

    return (
      <Form {...editForm}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField
            control={editForm.control}
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
            control={editForm.control}
            name="balance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Saldo Sekarang</FormLabel>
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
          <Button type="submit" className="w-full" disabled={editForm.formState.isSubmitting}>
            {submitLabel}
          </Button>
        </form>
      </Form>
    );
  }

  // Create mode
  const handleSubmit = createForm.handleSubmit(async (data) => {
    const isDuplicate = wallets.some(
      (w) => w.id !== excludeId && w.name.toLowerCase() === data.name.toLowerCase()
    );
    if (isDuplicate) {
      createForm.setError("name", { message: "Nama wallet sudah digunakan" });
      return;
    }
    await (props as WalletFormCreateProps).onSubmit(data);
  });

  return (
    <Form {...createForm}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          control={createForm.control}
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
          control={createForm.control}
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
        <Button type="submit" className="w-full" disabled={createForm.formState.isSubmitting}>
          {submitLabel}
        </Button>
      </form>
    </Form>
  );
}
