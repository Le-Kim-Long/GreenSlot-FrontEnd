import { useState, useEffect } from 'react';
import { ShieldCheck, Users, TrendingUp, Search, Loader2, Calendar, RefreshCw } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { adminApi } from '../../api/adminApi';
import type { AuditLog } from '../../types/api';

const navItems = [
  { label: 'Tổng quan', path: '/dashboard/admin', icon: <TrendingUp className="w-full h-full" /> },
  { label: 'Người dùng', path: '/dashboard/admin/users', icon: <Users className="w-full h-full" /> },
  { label: 'Audit logs', path: '/dashboard/admin/audit', icon: <ShieldCheck className="w-full h-full" /> },
  { label: 'Nội dung', path: '/dashboard/admin/content', icon: <ShieldCheck className="w-full h-full" /> },
];

const actionColors: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-700',
  UPDATE: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-red-100 text-red-700',
  LOGIN:  'bg-purple-100 text-purple-700',
  LOGOUT: 'bg-gray-100 text-gray-600',
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function sevenDaysAgoStr() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().slice(0, 10);
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState(sevenDaysAgoStr());
  const [endDate, setEndDate] = useState(todayStr());

  const fetchLogs = () => {
    setLoading(true);
    setError('');
    const start = startDate ? `${startDate}T00:00:00` : undefined;
    const end = endDate ? `${endDate}T23:59:59` : undefined;
    adminApi.getAuditLogs(start, end)
      .then(data => setLogs(Array.isArray(data) ? data : []))
      .catch(() => setError('Không thể tải audit logs'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLogs(); }, []);

  const filtered = logs.filter(log => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      log.performedBy?.toLowerCase().includes(q) ||
      log.action?.toLowerCase().includes(q) ||
      log.entityType?.toLowerCase().includes(q) ||
      log.details?.toLowerCase().includes(q)
    );
  });

  return (
    <DashboardLayout navItems={navItems} title="Audit Logs">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Nhật ký hoạt động</h2>
        <p className="text-gray-500 text-sm mt-1">Theo dõi toàn bộ hành động trong hệ thống</p>
      </div>

      {/* Filters */}
      <div className="card mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="input pl-9"
              placeholder="Tìm theo người dùng, hành động..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input type="date" className="input w-36" value={startDate} onChange={e => setStartDate(e.target.value)} />
            <span className="text-gray-400 text-sm">—</span>
            <input type="date" className="input w-36" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          <button onClick={fetchLogs} className="btn-primary flex items-center gap-2 flex-shrink-0">
            <RefreshCw className="w-4 h-4" /> Lọc
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-600 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>}

      {loading ? (
        <div className="text-center py-16"><Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <ShieldCheck className="w-16 h-16 mx-auto mb-4 text-gray-200" />
          <p className="text-gray-400">Không có log nào trong khoảng thời gian này</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <div className="text-xs text-gray-400 mb-3">{filtered.length} bản ghi</div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase border-b border-gray-100">
                <th className="px-3 py-3">Thời gian</th>
                <th className="px-3 py-3">Người thực hiện</th>
                <th className="px-3 py-3">Hành động</th>
                <th className="px-3 py-3">Đối tượng</th>
                <th className="px-3 py-3">Chi tiết</th>
                <th className="px-3 py-3">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(log => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-3 py-3 text-gray-500 whitespace-nowrap text-xs">
                    {formatDate(log.performedAt)}
                  </td>
                  <td className="px-3 py-3 font-medium text-gray-900 whitespace-nowrap">
                    {log.performedBy}
                  </td>
                  <td className="px-3 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${actionColors[log.action] ?? 'bg-gray-100 text-gray-600'}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-gray-600 whitespace-nowrap">
                    {log.entityType} {log.entityId ? `#${log.entityId}` : ''}
                  </td>
                  <td className="px-3 py-3 text-gray-500 max-w-xs truncate">
                    {log.details || '—'}
                  </td>
                  <td className="px-3 py-3 text-gray-400 text-xs whitespace-nowrap">
                    {log.ipAddress || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}
