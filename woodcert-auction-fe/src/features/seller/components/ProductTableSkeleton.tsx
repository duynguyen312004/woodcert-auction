/**
 * Dòng skeleton cho bảng sản phẩm seller.
 *
 * Dùng lúc dữ liệu đang tải để bảng không bị nhảy layout trước khi có dòng thật.
 */
export function ProductTableSkeleton() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, index) => (
        <tr key={index}>
          <td className="px-6 py-4">
            <div className="flex items-center gap-4">
              <div className="size-12 shrink-0 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
            </div>
          </td>
          <td className="px-6 py-4">
            <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
          </td>
          <td className="px-6 py-4">
            <div className="h-5 w-20 animate-pulse rounded-full bg-gray-200" />
          </td>
          <td className="px-6 py-4 text-right">
            <div className="ml-auto h-5 w-5 animate-pulse rounded bg-gray-200" />
          </td>
        </tr>
      ))}
    </>
  );
}
