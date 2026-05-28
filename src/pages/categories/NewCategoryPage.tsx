import { useNavigate } from "react-router-dom";
import { useCategoryStore } from "@/stores/categoryStore";
import CategoryForm from "@/components/categories/CategoryForm";
import type { CategoryInput } from "@/lib/validators";

export default function NewCategoryPage() {
  const navigate = useNavigate();
  const addCategory = useCategoryStore((s) => s.addCategory);

  const handleSubmit = async (data: CategoryInput) => {
    await addCategory({ name: data.name, type: data.type, isDefault: false });
    navigate("/categories");
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-lg font-semibold">Kategori Baru</h1>
      <CategoryForm onSubmit={handleSubmit} submitLabel="Buat Kategori" />
    </div>
  );
}
