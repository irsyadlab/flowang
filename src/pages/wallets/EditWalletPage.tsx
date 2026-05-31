import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Wallet, ArrowLeft, Save, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useWalletStore } from "@/stores/walletStore";
import { walletEditSchema, type WalletEditInput } from "@/lib/validators";
import { formatCurrency } from "@/lib/utils";
import ErrorMessage from "@/components/shared/ErrorMessage";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
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
import { useStickyHeader } from "@/hooks/useStickyHeader";

const WALLET_GRADIENTS = [
  "wallet-card-1",
  "wallet-card-2",
  "wallet-card-3",
  "wallet-card-4",
  "wallet-card-5",
];

export default function EditWalletPage() {
  const stickyHeader = useStickyHeader();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { wallets, isLoading, loadWallets, updateWallet } = useWalletStore();

  useEffect(() => {
    if (wallets.length === 0) loadWallets();
  }, [wallets.length, loadWallets]);

  const wallet = wallets.find((w) => w.id === id);
  const walletIndex = wallets.findIndex((w) => w.id === id);

  const form = useForm<WalletEditInput>({
    resolver: zodResolver(walletEditSchema),
    defaultValues: {
      name: wallet?.name ?? "",
      balance: wallet?.balance ?? 0,
    },
  });

  // Reset form when wallet data loads
  useEffect(() => {
    if (wallet) {
      form.reset({ name: wallet.name, balance: wallet.balance });
    }
  }, [wallet, form]);

  const watchedName = useWatch({ control: form.control, name: "name" });
  const watchedBalance = useWatch({ control: form.control, name: "balance" });

  if (isLoading && wallets.length === 0) {
    return <LoadingSpinner fullscreen />;
  }

  if (!wallet) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <ErrorMessage message="Wallet tidak ditemukan" />
      </div>
    );
  }

  const balanceDelta = (watchedBalance ?? wallet.balance) - wallet.balance;
  const hasChange = balanceDelta !== 0;

  const handleSubmit = form.handleSubmit(async (data) => {
    const isDuplicate = wallets.some(
      (w) => w.id !== wallet.id && w.name.toLowerCase() === data.name.toLowerCase()
    );
    if (isDuplicate) {
      form.setError("name", { message: "Nama wallet sudah digunakan" });
      return;
    }
    // Convert desired balance to initialBalance for the store's correction logic:
    // newInitialBalance = currentInitialBalance + (desiredBalance - currentBalance)
    const newInitialBalance = wallet.initialBalance + (data.balance - wallet.balance);
    await updateWallet(wallet.id, { name: data.name, initialBalance: newInitialBalance });
    navigate("/wallets");
  });

  const gradientClass = WALLET_GRADIENTS[walletIndex % WALLET_GRADIENTS.length];

  return (
    <div>
      {/* Header */}
      <div className={`${stickyHeader} px-4 flex items-center gap-3 pt-5 pb-4`}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          aria-label="Kembali"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-xl font-bold text-foreground">Edit Wallet</h1>
      </div>
      <div className="flex flex-col min-h-[calc(100vh-64px)]">

      {/* Live preview card */}
      <div className="px-4 pb-5">
        <div className={`${gradientClass} relative rounded-2xl p-5 text-white shadow-lg overflow-hidden`}>
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
            <p className="text-[10px] text-white/50 uppercase tracking-widest mb-1">Saldo</p>
            <p className="text-2xl font-bold leading-tight tabular-nums">
              {formatCurrency(watchedBalance ?? wallet.balance)}
            </p>
            <p className="mt-2 text-sm text-white/70 font-medium truncate">
              {watchedName || wallet.name}
            </p>
          </div>
        </div>

        {/* Balance delta indicator */}
        {hasChange && (
          <div className={`flex items-center gap-1.5 mt-3 px-1 text-xs font-medium ${
            balanceDelta > 0 ? "text-[var(--income)]" : "text-[var(--expense)]"
          }`}>
            {balanceDelta > 0
              ? <TrendingUp className="h-3.5 w-3.5" />
              : <TrendingDown className="h-3.5 w-3.5" />
            }
            {balanceDelta > 0 ? "+" : ""}{formatCurrency(balanceDelta)} dari saldo saat ini
          </div>
        )}
        {!hasChange && (
          <div className="flex items-center gap-1.5 mt-3 px-1 text-xs text-muted-foreground">
            <Minus className="h-3.5 w-3.5" />
            Saldo tidak berubah
          </div>
        )}
      </div>

      {/* Form */}
      <div className="flex-1 px-4 pb-8">
        <div className="rounded-2xl border border-border bg-card p-5">
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
                name="balance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Saldo Sekarang</FormLabel>
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
                {form.formState.isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
    </div>
  );
}
