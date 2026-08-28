import { useState, useEffect } from 'react';
import { Users, Phone, Mail, Loader2 } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import Pagination from '../../components/common/Pagination';
import { useAuth } from '../../context/AuthContext';
import { managerApi } from '../../api/managerApi';
import { staffNavItems } from './staffNav';
import { roleLabel } from '../../utils/roleMap';
import type { UserAdmin } from '../../types/api';

interface Location {
  id: number;
  name: string;
}

export default function StaffListPage() {
  const { user } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationId, setLocationId] = useState<number>(() => user?.locationId || 0);
  const [staffs, setStaffs] = useState<UserAdmin[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [loadingStaffs, setLoadingStaffs] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    managerApi.getLocations()
      .then((locs: Location[]) => {
        setLocations(locs);
        if (locs.length > 0) {
          const target = user?.locationId ? locs.find(l => l.id === user.locationId) || locs[0] : locs[0];
          setLocationId(target.id);
        }
      })
      .catch(() => setError('Không thể tải danh sách cơ sở'))
      .finally(() => setLoadingLocations(false));
  }, [user?.locationId]);

  useEffect(() => {
    if (!locationId) return;
    setLoadingStaffs(true);
    setError('');
    setCurrentPage(1);
    managerApi.getStaffs(locationId)
      .then(data => setStaffs((data || []).sort((a: UserAdmin, b: UserAdmin) => b.id - a.id)))
      .catch(() => setError('Không thể tải danh sách nhân viên'))
      .finally(() => setLoadingStaffs(false));
  }, [locationId]);

  const totalPages = Math.ceil(staffs.length / pageSize) || 1;
  const paginatedStaffs = staffs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <DashboardLayout navItems={staffNavItems} title="Nhân viên">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Nhân viên theo cơ sở</h2>
          <p className="text-gray-500 text-sm">{staffs.length} nhân viên</p>
        </div>
        <select
          className="input max-w-xs"
          value={locationId}
          onChange={e => {
            setLocationId(Number(e.target.value));
            setCurrentPage(1);
          }}
          disabled={loadingLocations || locations.length === 0}
        >
          {locations.length === 0 ? (
            <option value={0}>Chưa có cơ sở</option>
          ) : (
            locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)
          )}
        </select>
      </div>

      {error && <div className="bg-red-50 text-red-600 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>}

      {loadingLocations || loadingStaffs ? (
        <div className="text-center py-16"><Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto" /></div>
      ) : staffs.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Chưa có nhân viên nào tại cơ sở này</p>
        </div>
      ) : (
        <div className="card overflow-x-auto space-y-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase border-b">
                <th className="px-4 py-3">Nhân viên</th>
                <th className="px-4 py-3">Liên hệ</th>
                <th className="px-4 py-3">Vai trò</th>
                <th className="px-4 py-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginatedStaffs.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-semibold">{s.fullName || s.username}</div>
                    <div className="text-xs text-gray-500">@{s.username}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-sm text-gray-700"><Mail className="w-3.5 h-3.5 text-gray-400" />{s.email}</div>
                    {s.phone && <div className="flex items-center gap-1 text-sm text-gray-700 mt-0.5"><Phone className="w-3.5 h-3.5 text-gray-400" />{s.phone}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {s.roles?.map(r => <span key={r} className="badge-blue text-xs">{roleLabel(r)}</span>)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={s.enabled ? 'badge-green' : 'badge-red'}>{s.enabled ? 'Hoạt động' : 'Khóa'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {staffs.length > 0 && (
            <div className="pt-3 border-t border-gray-100">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={staffs.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(sz) => {
                  setPageSize(sz);
                  setCurrentPage(1);
                }}
                itemName="nhân viên"
              />
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
