import { Button } from "@/shared/ui/button";

type PaginationProps = {
  page: number;
  pages: number;
  onPage: (page: number) => void;
};

export function Pagination({ page, pages, onPage }: PaginationProps) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-end gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
      >
        Trước
      </Button>
      <span className="text-sm text-[#d2c5b2]">
        Trang {page}/{pages}
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={page >= pages}
        onClick={() => onPage(page + 1)}
      >
        Sau
      </Button>
    </div>
  );
}
