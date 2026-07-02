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
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-green-100 shadow-sm bg-white/80 backdrop-blur-md">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="flex items-center justify-center bg-green-600 w-9 h-9 rounded-xl">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Green<span className="text-green-600">Slot</span></span>
            </Link>

            {/* Desktop Nav Links */}
            {(!user || user.role === 'customer') && (
              <div className="items-center hidden gap-6 md:flex">
                <Link to="/gardens" className="text-sm font-medium text-gray-600 transition-colors hover:text-green-600">Khám phá vườn</Link>
                <Link to="/how-it-works" className="text-sm font-medium text-gray-600 transition-colors hover:text-green-600">Cách hoạt động</Link>
                <Link to="/services" className="text-sm font-medium text-gray-600 transition-colors hover:text-green-600">Dịch vụ</Link>
                <Link to="/pricing" className="text-sm font-medium text-gray-600 transition-colors hover:text-green-600">Bảng giá</Link>
              </div>
            )}

            {/* Right side */}
            <div className="items-center hidden gap-3 md:flex">
              {isAuthenticated && user ? (
                <>
                  {/* Notifications */}
                  <div className="relative">
                    <button onClick={() => setNotifOpen(!notifOpen)} className="relative p-2 transition-colors rounded-lg hover:bg-green-50">
                      <Bell className="w-5 h-5 text-gray-600" />
                      {unreadCount > 0 && (
                        <span className="absolute flex items-center justify-center w-4 h-4 text-xs text-white bg-red-500 rounded-full top-1 right-1">
                          {unreadCount}
                        </span>
                      )}
                    </button>
                    {notifOpen && (
                      <div className="absolute right-0 z-50 mt-2 overflow-hidden bg-white border border-gray-100 shadow-lg w-80 rounded-xl">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <h3 className="font-semibold text-gray-900">Thông báo</h3>
                        </div>
                        <div className="px-4 py-6 overflow-y-auto text-sm text-center text-gray-400 max-h-72">
                          Chưa có thông báo
                        </div>
                        <div className="px-4 py-2 text-center">
                          <button className="text-sm font-medium text-green-600 hover:text-green-700">Xem tất cả</button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* User menu */}
                  <div className="relative">
                    <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2 px-3 py-2 transition-colors rounded-lg hover:bg-green-50">
                      <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                        <span className="text-sm font-semibold text-green-700">{user.name.charAt(0)}</span>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium leading-tight text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">{roleLabels[user.role]}</p>
                      </div>
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    </button>
                    {userMenuOpen && (
                      <div className="absolute right-0 z-50 mt-2 overflow-hidden bg-white border border-gray-100 shadow-lg w-52 rounded-xl">
                        <Link to={dashboardPath} onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50">
                          <LayoutDashboard className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-700">Dashboard</span>
                        </Link>
                        <Link to="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-700">Hồ sơ cá nhân</span>
                        </Link>
                        <hr className="border-gray-100" />
                        <button onClick={handleLogout} className="flex items-center w-full gap-3 px-4 py-3 text-red-600 transition-colors hover:bg-red-50">
                          <LogOut className="w-4 h-4" />
                          <span className="text-sm">Đăng xuất</span>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-sm btn-secondary">Đăng nhập</Link>
                  <Link to="/register" className="text-sm btn-primary">Đăng ký</Link>
                </>
              )}
            </div>

            {/* Mobile toggle */}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 text-gray-600 rounded-lg md:hidden hover:bg-green-50">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="px-4 py-4 space-y-3 bg-white border-t border-green-100 md:hidden">
            {(!user || user.role === 'customer') && (
              <>
                <Link to="/gardens" className="block py-2 font-medium text-gray-700">Khám phá vườn</Link>
                <Link to="/how-it-works" className="block py-2 font-medium text-gray-700">Cách hoạt động</Link>
                <Link to="/services" className="block py-2 font-medium text-gray-700">Dịch vụ</Link>
                <Link to="/pricing" className="block py-2 font-medium text-gray-700">Bảng giá</Link>
              </>
            )}
            {isAuthenticated ? (
              <>
                <Link to={dashboardPath} className="block py-2 font-medium text-green-600">Dashboard</Link>
                <button onClick={handleLogout} className="block w-full py-2 font-medium text-left text-red-600">Đăng xuất</button>
              </>
            ) : (
              <div className="flex gap-2 pt-2">
                <Link to="/login" className="flex-1 text-sm text-center btn-secondary">Đăng nhập</Link>
                <Link to="/register" className="flex-1 text-sm text-center btn-primary">Đăng ký</Link>
              </div>
            )}
          </div>
        )}
      </nav>
      {/* Spacer to prevent content from jumping under the fixed navbar */}
      <div className="w-full h-16" />
    </>
  );
}
