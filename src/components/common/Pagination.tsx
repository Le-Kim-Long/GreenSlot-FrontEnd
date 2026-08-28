import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import clsx from 'clsx';

export interface PaginationProps {
  currentPage: number; // 1-based index (1, 2, 3...)
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  itemName?: string;
  className?: string;
}

// Hàm tính toán danh sách số trang thông minh kèm dấu ba chấm
function getPageNumbers(currentPage: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const delta = 1;
  const left = Math.max(2, currentPage - delta);
  const right = Math.min(totalPages - 1, currentPage + delta);

  const items: (number | 'ellipsis')[] = [1];

  if (left > 2) {
    items.push('ellipsis');
  }

  for (let i = left; i <= right; i++) {
    items.push(i);
  }

  if (right < totalPages - 1) {
    items.push('ellipsis');
  }

  if (totalPages > 1) {
    items.push(totalPages);
  }

  return items;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
  itemName = 'mục',
  className = '',
}: PaginationProps) {
  if (totalItems !== undefined && totalItems === 0) {
    return null;
  }

  const safeTotalPages = Math.max(1, totalPages || 1);
  const safeCurrentPage = Math.min(Math.max(1, currentPage), safeTotalPages);
  const pageNumbers = getPageNumbers(safeCurrentPage, safeTotalPages);

  const startItem = totalItems && pageSize ? Math.min((safeCurrentPage - 1) * pageSize + 1, totalItems) : null;
  const endItem = totalItems && pageSize ? Math.min(safeCurrentPage * pageSize, totalItems) : null;

  return (
    <div
      className={clsx(
        'flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white border border-gray-100 rounded-2xl shadow-xs text-xs text-gray-600 select-none mt-4',
        className
      )}
    >
      {/* Thông tin số lượng & Page size selector */}
      <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-start">
        {totalItems !== undefined ? (
          <span>
            {startItem && endItem ? (
              <>
                Hiển thị <strong className="font-semibold text-gray-900">{startItem} - {endItem}</strong> trên tổng số{' '}
                <strong className="font-semibold text-gray-900">{totalItems}</strong> {itemName}
              </>
            ) : (
              <>
                Tổng số <strong className="font-semibold text-gray-900">{totalItems}</strong> {itemName}
              </>
            )}
          </span>
        ) : (
          <span>
            Trang <strong className="font-semibold text-gray-900">{safeCurrentPage}</strong> / {safeTotalPages}
          </span>
        )}

        {onPageSizeChange && pageSize && (
          <div className="flex items-center gap-1.5 ml-2 pl-3 border-l border-gray-200">
            <span className="text-gray-400">Hiển thị:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs font-semibold text-gray-700 outline-none focus:ring-1 focus:ring-green-500 cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} / trang
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Điều khiển chuyển trang */}
      <div className="flex items-center gap-1">
        {/* Nút Về trang đầu */}
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={safeCurrentPage === 1}
          title="Trang đầu"
          className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-green-700 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        {/* Nút Trang trước */}
        <button
          type="button"
          onClick={() => onPageChange(safeCurrentPage - 1)}
          disabled={safeCurrentPage === 1}
          title="Trang trước"
          className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-green-700 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Các số trang */}
        <div className="flex items-center gap-1 mx-1">
          {pageNumbers.map((p, idx) => {
            if (p === 'ellipsis') {
              return (
                <span key={`ellipsis-${idx}`} className="px-1.5 text-gray-400 font-mono">
                  …
                </span>
              );
            }
            const isCurrent = p === safeCurrentPage;
            return (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                className={clsx(
                  'w-7 h-7 rounded-lg text-xs font-semibold transition flex items-center justify-center cursor-pointer',
                  isCurrent
                    ? 'bg-green-600 text-white shadow-xs'
                    : 'border border-gray-200 text-gray-700 hover:bg-green-50 hover:border-green-300 hover:text-green-700'
                )}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Nút Trang sau */}
        <button
          type="button"
          onClick={() => onPageChange(safeCurrentPage + 1)}
          disabled={safeCurrentPage >= safeTotalPages}
          title="Trang kế tiếp"
          className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-green-700 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Nút Đến trang cuối */}
        <button
          type="button"
          onClick={() => onPageChange(safeTotalPages)}
          disabled={safeCurrentPage >= safeTotalPages}
          title="Trang cuối"
          className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-green-700 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
