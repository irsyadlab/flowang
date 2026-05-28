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
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-lg font-semibold">Edit Kategori</h1>
      <CategoryForm
        initialData={{ name: category.name, type: category.type }}
        excludeId={category.id}
        onSubmit={handleSubmit}
        submitLabel="Simpan Perubahan"
      />
    </div>
  );
}
