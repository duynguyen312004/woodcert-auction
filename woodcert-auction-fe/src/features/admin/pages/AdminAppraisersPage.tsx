import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, ShieldCheck, ShieldX } from "lucide-react";

import { isApiError } from "@/shared/api/errors";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { useNotification } from "@/shared/ui/notification";

import { adminAppraiserApi } from "../api/appraisers";

export function AdminAppraisersPage() {
  const [queryText, setQueryText] = useState("");
  const queryClient = useQueryClient();
  const notification = useNotification();
  const usersQuery = useQuery({
    queryKey: ["admin", "appraisers", queryText],
    queryFn: () => adminAppraiserApi.getUsers({ query: queryText || undefined, size: 30 }),
  });
  const roleMutation = useMutation({
    mutationFn: ({ userId, action }: { userId: string; action: "promote" | "demote" }) =>
      action === "promote" ? adminAppraiserApi.promote(userId) : adminAppraiserApi.demote(userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "appraisers"] });
      notification.success("Đã cập nhật quyền appraiser");
    },
    onError: (error) =>
      notification.error("Không thể cập nhật quyền", {
        description: isApiError(error) ? error.message : "Vui lòng thử lại.",
      }),
  });

  return (
    <main className="px-8 py-8">
      <header className="border-b border-white/10 pb-5">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Admin</p>
        <h1 className="mt-1 text-3xl font-bold">Appraiser</h1>
      </header>
      <div className="relative mt-6 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
        <Input
          className="bg-[#f2eee5] pl-9 text-stone-950"
          value={queryText}
          onChange={(e) => setQueryText(e.target.value)}
          placeholder="Tìm email hoặc tên"
        />
      </div>
      <section className="mt-6 overflow-hidden rounded-lg border border-white/10 bg-[#f2eee5] text-stone-950">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-[#e9e2d6] text-xs uppercase text-stone-500">
            <tr>
              <th className="px-5 py-3">User</th>
              <th className="px-5 py-3">Trạng thái</th>
              <th className="px-5 py-3">Roles</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-300">
            {(usersQuery.data?.result ?? []).map((user) => {
              const isAppraiser = user.roles.includes("ROLE_APPRAISER");
              return (
                <tr key={user.id}>
                  <td className="px-5 py-3">
                    <p className="font-bold">{user.fullName}</p>
                    <p className="text-xs text-stone-500">{user.email}</p>
                  </td>
                  <td className="px-5 py-3">{user.status}</td>
                  <td className="px-5 py-3">{user.roles.join(", ")}</td>
                  <td className="px-5 py-3 text-right">
                    <Button
                      type="button"
                      size="sm"
                      variant={isAppraiser ? "outline" : "default"}
                      disabled={roleMutation.isPending}
                      onClick={() =>
                        void roleMutation.mutateAsync({
                          userId: user.id,
                          action: isAppraiser ? "demote" : "promote",
                        })
                      }
                    >
                      {isAppraiser ? (
                        <ShieldX className="h-4 w-4" />
                      ) : (
                        <ShieldCheck className="h-4 w-4" />
                      )}
                      {isAppraiser ? "Gỡ quyền" : "Cấp quyền"}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </main>
  );
}
