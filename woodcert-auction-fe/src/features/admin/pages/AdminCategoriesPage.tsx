import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";

import { isApiError } from "@/shared/api/errors";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { useNotification } from "@/shared/ui/notification";

import { adminCategoryApi, type AdminCategory } from "../api/categories";

export function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const notification = useNotification();
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", description: "" });
  const categoriesQuery = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: adminCategoryApi.getAll,
  });
  const saveMutation = useMutation({
    mutationFn: () =>
      editing
        ? adminCategoryApi.update({ id: editing.id, payload: form })
        : adminCategoryApi.create(form),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      setEditing(null);
      setForm({ name: "", slug: "", description: "" });
      notification.success("Đã lưu danh mục");
    },
    onError: (error) =>
      notification.error("Không thể lưu danh mục", {
        description: isApiError(error) ? error.message : "Vui lòng thử lại.",
      }),
  });
  const deleteMutation = useMutation({
    mutationFn: adminCategoryApi.delete,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["admin", "categories"] }),
  });

  return (
    <main className="px-8 py-8">
      <header className="border-b border-white/10 pb-5">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Admin</p>
        <h1 className="mt-1 text-3xl font-bold">Danh mục</h1>
      </header>
      <section className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
        <form
          className="rounded-lg border border-white/10 bg-[#f2eee5] p-5 text-stone-950"
          onSubmit={(event) => {
            event.preventDefault();
            void saveMutation.mutateAsync();
          }}
        >
          <h2 className="font-bold">{editing ? "Sửa danh mục" : "Thêm danh mục"}</h2>
          <div className="mt-4 space-y-3">
            <Input
              placeholder="Tên danh mục"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              placeholder="Slug tùy chọn"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
            />
            <Input
              placeholder="Mô tả"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <Button type="submit" className="mt-4 w-full" disabled={saveMutation.isPending}>
            <Plus className="h-4 w-4" />
            Lưu
          </Button>
        </form>

        <div className="overflow-hidden rounded-lg border border-white/10 bg-[#f2eee5] text-stone-950">
          <table className="w-full text-left text-sm">
            <tbody className="divide-y divide-stone-300">
              {(categoriesQuery.data ?? []).map((category) => (
                <tr key={category.id}>
                  <td className="px-5 py-3 font-bold">{category.name}</td>
                  <td className="px-5 py-3 text-stone-500">{category.slug}</td>
                  <td className="px-5 py-3 text-right">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditing(category);
                        setForm({
                          name: category.name,
                          slug: category.slug,
                          description: category.description ?? "",
                        });
                      }}
                    >
                      Sửa
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => void deleteMutation.mutateAsync(category.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
