import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Menu, X, Leaf, ChevronDown, LogOut, User, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getDashboardPath as resolveDashboardPath, roleLabel } from '../../utils/roleMap';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const unreadCount = 0;

  const dashboardPath = user ? resolveDashboardPath(user.role) : '/login';

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate('/');
  };

  const roleLabels: Record<string, string> = {
    customer: roleLabel('customer'),
    garden_staff: roleLabel('garden_staff'),
    location_manager: roleLabel('location_manager'),
    manager: roleLabel('manager'),
    admin: roleLabel('admin'),
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md shadow-sm border-b border-green-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Green<span className="text-green-600">Slot</span></span>
          </Link>

          {/* Desktop Nav Links */}
          {(!user || user.role === 'customer') && (
            <div className="hidden md:flex items-center gap-6">
              <Link to="/gardens" className="text-gray-600 hover:text-green-600 font-medium transition-colors text-sm">Khám phá vườn</Link>
              <Link to="/how-it-works" className="text-gray-600 hover:text-green-600 font-medium transition-colors text-sm">Cách hoạt động</Link>
              <Link to="/services" className="text-gray-600 hover:text-green-600 font-medium transition-colors text-sm">Dịch vụ</Link>
              <Link to="/pricing" className="text-gray-600 hover:text-green-600 font-medium transition-colors text-sm">Bảng giá</Link>
            </div>
          )}

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && user ? (
              <>
                {/* Notifications */}
                <div className="relative">
                  <button onClick={() => setNotifOpen(!notifOpen)} className="relative p-2 rounded-lg hover:bg-green-50 transition-colors">
                    <Bell className="w-5 h-5 text-gray-600" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                  {notifOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <h3 className="font-semibold text-gray-900">Thông báo</h3>
                      </div>
                      <div className="max-h-72 overflow-y-auto px-4 py-6 text-center text-sm text-gray-400">
                        Chưa có thông báo
                      </div>
                      <div className="px-4 py-2 text-center">
                        <button className="text-sm text-green-600 hover:text-green-700 font-medium">Xem tất cả</button>
                      </div>
                    </div>
                  )}
                </div>

                {/* User menu */}
                <div className="relative">
                  <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-green-50 transition-colors">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-700 font-semibold text-sm">{user.name?.charAt(0)}</span>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900 leading-tight">{user.name}</p>
                      <p className="text-xs text-gray-500">{roleLabels[user.role]}</p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
                      <Link to={dashboardPath} onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                        <LayoutDashboard className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-700">Dashboard</span>
                      </Link>
                      <Link to="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-700">Hồ sơ cá nhân</span>
                      </Link>
                      <hr className="border-gray-100" />
                      <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors text-red-600">
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm">Đăng xuất</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-secondary text-sm">Đăng nhập</Link>
                <Link to="/register" className="btn-primary text-sm">Đăng ký</Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 rounded-lg hover:bg-green-50 text-gray-600">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-green-100 bg-white px-4 py-4 space-y-3">
          {(!user || user.role === 'customer') && (
            <>
              <Link to="/gardens" className="block text-gray-700 font-medium py-2">Khám phá vườn</Link>
              <Link to="/how-it-works" className="block text-gray-700 font-medium py-2">Cách hoạt động</Link>
              <Link to="/services" className="block text-gray-700 font-medium py-2">Dịch vụ</Link>
              <Link to="/pricing" className="block text-gray-700 font-medium py-2">Bảng giá</Link>
            </>
          )}
          {isAuthenticated ? (
            <>
              <Link to={dashboardPath} className="block text-green-600 font-medium py-2">Dashboard</Link>
              <button onClick={handleLogout} className="block w-full text-left text-red-600 font-medium py-2">Đăng xuất</button>
            </>
          ) : (
            <div className="flex gap-2 pt-2">
              <Link to="/login" className="btn-secondary flex-1 text-center text-sm">Đăng nhập</Link>
              <Link to="/register" className="btn-primary flex-1 text-center text-sm">Đăng ký</Link>
            </div>
          )}
        </div>
      )}
      </nav>
      {/* Spacer to prevent content from jumping under the fixed navbar */}
      <div className="h-16 w-full" />
    </>
  );
}
