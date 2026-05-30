import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tag, Plus, ArrowLeft } from "lucide-react";
import { useCategoryStore } from "@/stores/categoryStore";
import CategoryItem from "@/components/categories/CategoryItem";
import EmptyState from "@/components/shared/EmptyState";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

export default function CategoriesPage() {
  const navigate = useNavigate();
  const { categories, isLoading, loadCategories } = useCategoryStore();

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  if (isLoading && categories.length === 0) {
    return <LoadingSpinner fullscreen />;
  }

  const incomeCategories = categories.filter((c) => c.type === "income" || c.type === "both");
  const expenseCategories = categories.filter((c) => c.type === "expense" || c.type === "both");

  return (
    <div className="flex flex-col gap-4 p-4 pb-6">
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            aria-label="Kembali"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Kategori</h1>
        </div>
        <button
          type="button"
          onClick={() => navigate("/categories/new")}
          data-tour="categories-add"
          className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-95"
        >
          <Plus className="h-3.5 w-3.5" />
          Tambah
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-6">
          <EmptyState
            icon={Tag}
            title="Belum ada kategori"
            description="Buat kategori untuk mengelompokkan transaksi."
            action={{ label: "Tambah Kategori", onClick: () => navigate("/categories/new") }}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {expenseCategories.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Pengeluaran</p>
              <div className="flex flex-col gap-2 stagger-children">
                {expenseCategories.map((c) => (
                  <CategoryItem key={c.id} category={c} />
                ))}
              </div>
            </div>
          )}
          {incomeCategories.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Pemasukan</p>
              <div className="flex flex-col gap-2 stagger-children">
                {incomeCategories.map((c) => (
                  <CategoryItem key={c.id} category={c} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
