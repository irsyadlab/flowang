import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Trash2, Lock } from "lucide-react";
import type { Category } from "@/types";
import { useCategoryStore } from "@/stores/categoryStore";
import ConfirmDialog from "@/components/shared/ConfirmDialog";

interface CategoryItemProps {
  category: Category;
}

export default function CategoryItem({ category }: CategoryItemProps) {
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const deleteCategory = useCategoryStore((s) => s.deleteCategory);
  const error = useCategoryStore((s) => s.error);

  const handleDelete = async () => {
    await deleteCategory(category.id);
    setConfirmOpen(false);
  };

  return (
    <>
      <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3 transition-all duration-200 hover:border-border hover:shadow-sm">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium text-foreground">{category.name}</p>
            {category.isDefault && (
              <span className="shrink-0 flex items-center gap-1 rounded-md border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
                <Lock className="h-2.5 w-2.5" />
                Default
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => navigate(`/categories/${category.id}`)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            aria-label="Edit kategori"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={category.isDefault}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:pointer-events-none disabled:opacity-30"
            aria-label="Hapus kategori"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Hapus Kategori"
        description={`Yakin ingin menghapus "${category.name}"? Kategori yang masih digunakan tidak dapat dihapus.`}
        onConfirm={handleDelete}
      />

      {error && !confirmOpen && (
        <p className="mt-1 px-1 text-xs text-destructive">{error}</p>
      )}
    </>
  );
}
