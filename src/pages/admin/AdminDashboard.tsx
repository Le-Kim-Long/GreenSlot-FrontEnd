import { Link } from 'react-router-dom';
import { Users, TrendingUp, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { adminApi } from '../../api/adminApi';
import { useState, useEffect } from 'react';

const navItems = [
  { label: 'Tổng quan', path: '/dashboard/admin', icon: <TrendingUp className="w-full h-full" /> },
  { label: 'Người dùng', path: '/dashboard/admin/users', icon: <Users className="w-full h-full" /> },
  { label: 'Audit logs', path: '/dashboard/admin/audit', icon: <ShieldCheck className="w-full h-full" /> },
  { label: 'Nội dung', path: '/dashboard/admin/content', icon: <ShieldCheck className="w-full h-full" /> },
];

export default function AdminDashboard() {
  const [userCount, setUserCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getUsers(0, 1)
      .then(res => setUserCount(res.totalElements))
      .catch(() => setUserCount(0))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout navItems={navItems} title="Dashboard Admin">
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl p-6 text-white mb-6">
        <h2 className="text-xl font-bold mb-1">Bảng điều khiển GreenSlot</h2>
        <p className="text-slate-300 text-sm">Quản trị người dùng, audit logs và nội dung hệ thống</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card">
          <Users className="w-8 h-8 text-blue-600 mb-2" />
          <div className="text-2xl font-black">{loading ? '—' : userCount}</div>
          <div className="text-sm text-gray-500">Tổng người dùng</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/dashboard/admin/users" className="card hover:shadow-md transition-shadow flex items-center justify-between">
          <div>
            <div className="font-bold text-gray-900">Quản lý người dùng</div>
            <div className="text-sm text-gray-500">Phân quyền, khóa/mở tài khoản</div>
          </div>
          <ArrowRight className="w-5 h-5 text-green-600" />
        </Link>
      </div>

      {loading && <Loader2 className="w-6 h-6 animate-spin text-green-600 mt-4" />}
    </DashboardLayout>
  );
}
