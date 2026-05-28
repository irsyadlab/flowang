import { useNavigate } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Wallet, ArrowLeft, Save } from "lucide-react";
import { useWalletStore } from "@/stores/walletStore";
import { walletSchema, type WalletInput } from "@/lib/validators";
import { formatCurrency } from "@/lib/utils";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const WALLET_GRADIENTS = [
  "wallet-card-1",
  "wallet-card-2",
  "wallet-card-3",
  "wallet-card-4",
  "wallet-card-5",
];

export default function NewWalletPage() {
  const navigate = useNavigate();
  const { addWallet, wallets } = useWalletStore();

  const form = useForm<WalletInput>({
    resolver: zodResolver(walletSchema),
    defaultValues: { name: "", initialBalance: 0 },
  });

  const watchedName = useWatch({ control: form.control, name: "name" });
  const watchedBalance = useWatch({ control: form.control, name: "initialBalance" });

  const handleSubmit = form.handleSubmit(async (data) => {
    const isDuplicate = wallets.some(
      (w) => w.name.toLowerCase() === data.name.toLowerCase()
    );
    if (isDuplicate) {
      form.setError("name", { message: "Nama wallet sudah digunakan" });
      return;
    }
    await addWallet({ name: data.name, initialBalance: data.initialBalance });
    navigate("/wallets");
  });

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          aria-label="Kembali"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-xl font-bold text-foreground">Wallet Baru</h1>
      </div>

      {/* Live preview card */}
      <div className="px-4 pb-5">
        <div
          className={`${WALLET_GRADIENTS[wallets.length % WALLET_GRADIENTS.length]} relative rounded-2xl p-5 text-white shadow-lg overflow-hidden transition-all duration-500`}
        >
          {/* Decorative circles */}
          <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-white/5" />
          <div className="absolute -bottom-6 -right-4 h-20 w-20 rounded-full bg-white/5" />
          <div className="absolute top-1/2 -left-6 h-16 w-16 rounded-full bg-white/5" />

          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
                <Wallet className="h-4 w-4 text-white" />
              </div>
              <span className="text-[10px] text-white/40 uppercase tracking-widest font-medium">
                Preview
              </span>
            </div>
            <p className="text-[10px] text-white/50 uppercase tracking-widest mb-1">Saldo Awal</p>
            <p className="text-2xl font-bold leading-tight tabular-nums">
              {formatCurrency(watchedBalance || 0)}
            </p>
            <p className="mt-2 text-sm text-white/70 font-medium truncate">
              {watchedName || "Nama Wallet"}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 px-4 pb-8">
        <div className="rounded-2xl border border-border bg-card p-5 space-y-5">
          <Form {...form}>
            <form onSubmit={handleSubmit} className="space-y-5">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Nama Wallet</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Contoh: BCA, Cash, GoPay..."
                        autoComplete="off"
                        {...field}
                      />
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
                    <FormLabel className="text-sm font-medium">Saldo Awal</FormLabel>
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
                          value={field.value === 0 ? "" : field.value}
                          onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                        />
                      </div>
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
                {form.formState.isSubmitting ? "Menyimpan..." : "Simpan Wallet"}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
