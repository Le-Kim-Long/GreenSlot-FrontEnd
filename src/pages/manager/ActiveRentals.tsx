import { useState, useEffect } from 'react';
import { Calendar, Search } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import Pagination from '../../components/common/Pagination';
import { managerApi } from '../../api/managerApi';
import { staffNavItems } from './staffNav';
import type { ActiveRental } from '../../types/api';

export default function ActiveRentals() {
  const [rentals, setRentals] = useState<ActiveRental[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    managerApi.getActiveRentals()
      .then(data => setRentals(data))
      .catch(() => setError('Không thể tải dữ liệu'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = rentals
    .filter(r =>
      JSON.stringify(r).toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const timeA = new Date(a.startTime || 0).getTime();
      const timeB = new Date(b.startTime || 0).getTime();
      if (timeA !== timeB) return timeB - timeA;
      return b.rentalId - a.rentalId;
    });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedRentals = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const fmt = (iso: string) => new Date(iso).toLocaleDateString('vi-VN');

  return (
    <DashboardLayout navItems={staffNavItems} title="Đang thuê">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm..."
            className="input pl-10"
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <div className="text-sm text-gray-500">{rentals.length} đơn đang thuê</div>
      </div>

      {error && <div className="bg-red-50 text-red-600 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Đang tải...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Không có đơn thuê nào đang hoạt động</p>
        </div>
      ) : (
        <div className="card overflow-x-auto space-y-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b text-xs uppercase">
                <th className="pb-3 font-medium">ID</th>
                <th className="pb-3 font-medium">Ô vườn</th>
                <th className="pb-3 font-medium">Khách hàng</th>
                <th className="pb-3 font-medium">Cơ sở</th>
                <th className="pb-3 font-medium">Bắt đầu</th>
                <th className="pb-3 font-medium">Kết thúc</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginatedRentals.map(r => (
                <tr key={r.rentalId} className="hover:bg-gray-50">
                  <td className="py-3 font-medium">#{r.rentalId}</td>
                  <td className="py-3">{r.slotNumber} ({r.pillarCode})</td>
                  <td className="py-3">
                    <div>{r.fullName}</div>
                    <div className="text-xs text-gray-400">{r.username}</div>
                  </td>
                  <td className="py-3">{r.locationName}</td>
                  <td className="py-3">{fmt(r.startTime)}</td>
                  <td className="py-3">{fmt(r.endTime)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length > 0 && (
            <div className="pt-3 border-t border-gray-100">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filtered.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(sz) => {
                  setPageSize(sz);
                  setCurrentPage(1);
                }}
                itemName="đơn thuê"
              />
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
