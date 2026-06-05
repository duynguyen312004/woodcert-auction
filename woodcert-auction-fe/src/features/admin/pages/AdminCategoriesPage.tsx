import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Boxes, Pencil, Plus, RefreshCw, Trash2, X } from "lucide-react";

import { isApiError } from "@/shared/api/errors";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { useNotification } from "@/shared/ui/notification";

import { adminCategoryApi, type AdminCategory } from "../api/categories";
import { AdminConfirmDialog } from "../components/AdminConfirmDialog";
import { AdminEmptyState } from "../components/AdminEmptyState";

const EMPTY_FORM = { name: "", slug: "", description: "" };

export function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const notification = useNotification();
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminCategory | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

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
      setForm(EMPTY_FORM);
      notification.success("Đã lưu danh mục");
    },
    onError: (error) =>
      notification.error("Không thể lưu danh mục", {
        description: isApiError(error) ? error.message : "Vui lòng thử lại.",
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: adminCategoryApi.delete,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      if (pendingDelete?.id === editing?.id) {
        setEditing(null);
        setForm(EMPTY_FORM);
      }
      setPendingDelete(null);
      notification.success("Đã xóa danh mục");
    },
    onError: (error) =>
      notification.error("Không thể xóa danh mục", {
        description: isApiError(error) ? error.message : "Danh mục có thể đang được sử dụng.",
      }),
  });

  const categories = categoriesQuery.data ?? [];

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1180px] space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Admin</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Danh mục</h1>
          </div>
          <Button type="button" variant="outline" onClick={() => void categoriesQuery.refetch()}>
            <RefreshCw
              className={categoriesQuery.isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"}
            />
            Làm mới
          </Button>
        </header>

        <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <form
            className="rounded-lg border border-white/10 bg-card p-5 text-foreground shadow-xl shadow-black/10"
            onSubmit={(event) => {
              event.preventDefault();
              void saveMutation.mutateAsync();
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a49a88]">
                  Category
                </p>
                <h2 className="mt-1 text-xl font-bold text-[#f2eee5]">
                  {editing ? "Sửa danh mục" : "Thêm danh mục"}
                </h2>
              </div>
              {editing ? (
                <Button
                  type="button"
                  size="icon-sm"
                  variant="outline"
                  className="border-white/10 hover:bg-white/5"
                  aria-label="Hủy sửa danh mục"
                  onClick={() => {
                    setEditing(null);
                    setForm(EMPTY_FORM);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
            <div className="mt-4 space-y-3">
              <Input
                className="border-white/10 bg-white/5 text-foreground focus-visible:border-primary/50 focus-visible:ring-primary/20"
                placeholder="Tên danh mục"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <Input
                className="border-white/10 bg-white/5 text-foreground focus-visible:border-primary/50 focus-visible:ring-primary/20"
                placeholder="Slug tùy chọn"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
              />
              <textarea
                className="min-h-28 w-full resize-y rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground shadow-xs outline-none transition-[color,box-shadow,border-color] placeholder:text-[#a49a88] focus-visible:border-primary/50 focus-visible:ring-[3px] focus-visible:ring-primary/20"
                placeholder="Mô tả"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <Button
              type="submit"
              className="mt-4 w-full bg-primary text-primary-foreground hover:bg-primary/95"
              disabled={saveMutation.isPending}
            >
              <Plus className="h-4 w-4" />
              {editing ? "Lưu thay đổi" : "Thêm danh mục"}
            </Button>
          </form>

          <section className="overflow-hidden rounded-lg border border-white/10 bg-card text-foreground shadow-xl shadow-black/10">
            <div className="border-b border-white/10 px-5 py-4">
              <h2 className="font-bold text-[#f2eee5]">Danh sách danh mục</h2>
            </div>
            {categories.length === 0 ? (
              <AdminEmptyState
                icon={Boxes}
                title="Chưa có danh mục"
                description="Tạo danh mục đầu tiên để phân loại sản phẩm gỗ và giúp người dùng lọc phiên đấu giá dễ hơn."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="bg-white/5 text-xs uppercase text-[#a49a88]">
                    <tr>
                      <th className="px-5 py-3">Tên</th>
                      <th className="px-5 py-3">Slug</th>
                      <th className="px-5 py-3">Mô tả</th>
                      <th className="px-5 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {categories.map((category) => (
                      <tr key={category.id} className="transition-colors hover:bg-white/5">
                        <td className="px-5 py-3 font-bold text-[#f2eee5]">{category.name}</td>
                        <td className="px-5 py-3 text-[#d2c5b2]">{category.slug}</td>
                        <td className="max-w-[420px] px-5 py-3 align-top text-[#a49a88]">
                          <p className="whitespace-pre-wrap break-words leading-6">
                            {category.description ?? "Chưa có mô tả"}
                          </p>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="border-white/10 bg-white/5 text-[#f2eee5] hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
                              onClick={() => {
                                setEditing(category);
                                setForm({
                                  name: category.name,
                                  slug: category.slug,
                                  description: category.description ?? "",
                                });
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                              Sửa
                            </Button>
                            <Button
                              type="button"
                              size="icon-sm"
                              variant="destructive"
                              aria-label={`Xóa danh mục ${category.name}`}
                              title={`Xóa danh mục ${category.name}`}
                              onClick={() => setPendingDelete(category)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </section>
      </div>

      <AdminConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title="Xóa danh mục này?"
        description={`Danh mục "${pendingDelete?.name ?? ""}" sẽ bị xóa khỏi hệ thống. Hành động này có thể ảnh hưởng đến sản phẩm đang dùng danh mục.`}
        confirmLabel="Xóa danh mục"
        isPending={deleteMutation.isPending}
        onConfirm={() => {
          if (pendingDelete) {
            void deleteMutation.mutateAsync(pendingDelete.id);
          }
        }}
      />
    </main>
  );
}
