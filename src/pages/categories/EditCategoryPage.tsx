import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, TrendingUp, TrendingDown, ArrowLeftRight, Lock } from "lucide-react";
import { useCategoryStore } from "@/stores/categoryStore";
import { categorySchema, type CategoryInput } from "@/lib/validators";
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
import type { CategoryType } from "@/types";
import { useStickyHeader } from "@/hooks/useStickyHeader";

const TYPE_OPTIONS: { value: CategoryType; label: string; icon: React.ReactNode; colorClass: string; bgClass: string }[] = [
  {
    value: "income",
    label: "Pemasukan",
    icon: <TrendingUp className="h-4 w-4" />,
    colorClass: "text-[var(--income)]",
    bgClass: "bg-[var(--income-bg)]",
  },
  {
    value: "expense",
    label: "Pengeluaran",
    icon: <TrendingDown className="h-4 w-4" />,
    colorClass: "text-[var(--expense)]",
    bgClass: "bg-[var(--expense-bg)]",
  },
  {
    value: "both",
    label: "Keduanya",
    icon: <ArrowLeftRight className="h-4 w-4" />,
    colorClass: "text-[var(--transfer)]",
    bgClass: "bg-[var(--transfer-bg)]",
  },
];

export default function EditCategoryPage() {
  const stickyHeader = useStickyHeader();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { categories, isLoading, loadCategories, updateCategory } = useCategoryStore();

  useEffect(() => {
    if (categories.length === 0) loadCategories();
  }, [categories.length, loadCategories]);

  const category = categories.find((c) => c.id === id);

  const form = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name ?? "",
      type: category?.type ?? "expense",
    },
  });

  useEffect(() => {
    if (category) {
      form.reset({ name: category.name, type: category.type });
    }
  }, [category, form]);

  const watchedName = useWatch({ control: form.control, name: "name" });
  const watchedType = useWatch({ control: form.control, name: "type" });

  if (isLoading && categories.length === 0) {
    return <LoadingSpinner fullscreen />;
  }

  if (!category) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <ErrorMessage message="Kategori tidak ditemukan" />
      </div>
    );
  }

  const activeType = TYPE_OPTIONS.find((t) => t.value === watchedType) ?? TYPE_OPTIONS[1];
  const isDefault = category.isDefault;

  const handleSubmit = form.handleSubmit(async (data) => {
    const isDuplicate = categories.some(
      (c) => c.id !== category.id && c.name.toLowerCase() === data.name.toLowerCase() && c.type === data.type
    );
    if (isDuplicate) {
      form.setError("name", { message: "Nama kategori sudah digunakan untuk tipe ini" });
      return;
    }
    await updateCategory(category.id, { name: data.name, type: data.type });
    navigate("/categories");
  });

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
        <h1 className="text-xl font-bold text-foreground">Edit Kategori</h1>
        {isDefault && (
          <span className="ml-auto flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[10px] text-muted-foreground">
            <Lock className="h-2.5 w-2.5" />
            Default
          </span>
        )}
      </div>
      <div className="flex flex-col min-h-[calc(100vh-64px)]">

      {/* Live preview */}
      <div className="px-4 pb-5">
        <div className="rounded-2xl border border-border bg-card px-4 py-3.5 flex items-center gap-3">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${activeType.bgClass} ${activeType.colorClass} transition-colors duration-200`}>
            {activeType.icon}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {watchedName || <span className="text-muted-foreground">Nama Kategori</span>}
            </p>
            <p className={`text-xs font-medium mt-0.5 ${activeType.colorClass} transition-colors duration-200`}>
              {activeType.label}
            </p>
          </div>
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Preview</span>
        </div>
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
                    <FormLabel className="text-sm font-medium">Nama Kategori</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Contoh: Gaji, Makanan, Transportasi..."
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
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Tipe</FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-3 gap-2">
                        {TYPE_OPTIONS.map((opt) => {
                          const isActive = field.value === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => !isDefault && field.onChange(opt.value)}
                              disabled={isDefault}
                              className={`flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-xs font-medium transition-all duration-150 disabled:pointer-events-none ${
                                isActive
                                  ? `${opt.bgClass} ${opt.colorClass} border-current/20`
                                  : "border-border bg-muted/30 text-muted-foreground hover:bg-muted"
                              } ${isDefault ? "opacity-60" : ""}`}
                            >
                              <span className={isActive ? opt.colorClass : ""}>{opt.icon}</span>
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </FormControl>
                    {isDefault && (
                      <p className="text-xs text-muted-foreground">Tipe kategori default tidak dapat diubah.</p>
                    )}
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
