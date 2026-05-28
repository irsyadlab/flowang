import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { categorySchema, type CategoryInput } from "@/lib/validators";
import { useCategoryStore } from "@/stores/categoryStore";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface CategoryFormProps {
  initialData?: CategoryInput;
  excludeId?: string;
  onSubmit: (data: CategoryInput) => Promise<void>;
  submitLabel?: string;
}

export default function CategoryForm({ initialData, excludeId, onSubmit, submitLabel = "Simpan" }: CategoryFormProps) {
  const categories = useCategoryStore((s) => s.categories);

  const form = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: initialData ?? {
      name: "",
      type: "expense",
    },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    const isDuplicate = categories.some(
      (c) => c.id !== excludeId && c.name.toLowerCase() === data.name.toLowerCase() && c.type === data.type
    );
    if (isDuplicate) {
      form.setError("name", { message: "Nama kategori sudah digunakan untuk tipe ini" });
      return;
    }
    await onSubmit(data);
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Kategori</FormLabel>
              <FormControl>
                <Input placeholder="Contoh: Gaji, Makanan, ..." {...field} />
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
              <FormLabel>Tipe</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tipe" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {submitLabel}
        </Button>
      </form>
    </Form>
  );
}
