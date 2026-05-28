import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Trash2 } from "lucide-react";
import type { Category } from "@/types";
import { useCategoryStore } from "@/stores/categoryStore";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { Badge } from "@/components/ui/badge";

const TYPE_LABELS: Record<string, string> = {
  income: "Income",
  expense: "Expense",
  both: "Both",
};

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
      <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{category.name}</p>
          <Badge variant="secondary" className="shrink-0 text-xs">
            {TYPE_LABELS[category.type]}
          </Badge>
          {category.isDefault && (
            <Badge variant="outline" className="shrink-0 text-xs">
              Default
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => navigate(`/categories/${category.id}`)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={category.isDefault}
            className="inline-flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:pointer-events-none disabled:opacity-30"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Hapus Kategori"
        description={`Yakin ingin menghapus "${category.name}"?`}
        onConfirm={handleDelete}
      />

      {error && !confirmOpen && (
        <p className="mt-2 text-sm text-destructive">{error}</p>
      )}
    </>
  );
}
