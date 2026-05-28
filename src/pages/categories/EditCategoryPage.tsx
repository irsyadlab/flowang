import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCategoryStore } from "@/stores/categoryStore";
import CategoryForm from "@/components/categories/CategoryForm";
import ErrorMessage from "@/components/shared/ErrorMessage";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import type { CategoryInput } from "@/lib/validators";

export default function EditCategoryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { categories, isLoading, loadCategories, updateCategory } = useCategoryStore();

  useEffect(() => {
    if (categories.length === 0) loadCategories();
  }, [categories.length, loadCategories]);

  const category = categories.find((c) => c.id === id);

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

  const handleSubmit = async (data: CategoryInput) => {
    await updateCategory(category.id, { name: data.name, type: data.type });
    navigate("/categories");
  };

  return (
    <div className="flex flex-col gap-4 p-4 pb-6">
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          aria-label="Kembali"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h1 className="text-xl font-bold text-foreground">Edit Kategori</h1>
      </div>
      <CategoryForm
        initialData={{ name: category.name, type: category.type }}
        excludeId={category.id}
        onSubmit={handleSubmit}
        submitLabel="Simpan Perubahan"
      />
    </div>
  );
}
