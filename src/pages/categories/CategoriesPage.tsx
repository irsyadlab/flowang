import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tag } from "lucide-react";
import { useCategoryStore } from "@/stores/categoryStore";
import CategoryItem from "@/components/categories/CategoryItem";
import EmptyState from "@/components/shared/EmptyState";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";

export default function CategoriesPage() {
  const navigate = useNavigate();
  const { categories, isLoading, loadCategories } = useCategoryStore();

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  if (isLoading && categories.length === 0) {
    return <LoadingSpinner fullscreen />;
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Kategori</h1>
        <Button size="sm" onClick={() => navigate("/categories/new")}>
          Tambah
        </Button>
      </div>

      {categories.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="Belum ada kategori"
          description="Buat kategori pertama untuk mengelompokkan transaksi."
          action={{ label: "Tambah Kategori", onClick: () => navigate("/categories/new") }}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {categories.map((c) => (
            <CategoryItem key={c.id} category={c} />
          ))}
        </div>
      )}
    </div>
  );
}
