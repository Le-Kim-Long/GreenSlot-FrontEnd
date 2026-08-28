import { useState, useEffect, useMemo } from 'react';
import {
  ClipboardList, Wifi, CheckCircle, AlertTriangle,
  Loader2, ShieldAlert, Upload, Calendar, Bell, Eye,
  X, ExternalLink, Sprout, Zap, History, Wrench, Camera,
  MapPin, Layers, Filter, Play, Search, AlertCircle, Sparkles
} from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import Pagination from '../../components/common/Pagination';
import { taskApi, EligibleHarvestRental } from '../../api/taskApi';
import type { GardeningTask } from '../../types/api';
import clsx from 'clsx';

const navItems = [
  { label: 'Công việc', path: '/dashboard/garden-staff', icon: <ClipboardList className="w-full h-full" /> },
  { label: 'Lịch trực', path: '/dashboard/garden-staff/schedules', icon: <Calendar className="w-full h-full" /> },
  { label: 'Giám sát IoT', path: '/dashboard/garden-staff/monitoring', icon: <Wifi className="w-full h-full" /> },
  { label: 'Cảnh báo IoT', path: '/dashboard/garden-staff/alerts', icon: <ShieldAlert className="w-full h-full" /> },
  { label: 'Điều khiển máy bơm', path: '/dashboard/garden-staff/pump-control', icon: <CheckCircle className="w-full h-full" /> },
  { label: 'Camera', path: '/dashboard/garden-staff/cameras', icon: <Camera className="w-full h-full" /> },
  { label: 'Lịch sử thu hoạch', path: '/dashboard/garden-staff/harvest-history', icon: <History className="w-full h-full" /> }
];

const statusConfig: Record<string, { label: string; cls: string; dotCls: string }> = {
  PENDING: { label: 'Chờ xử lý', cls: 'bg-amber-50 text-amber-700 border-amber-200', dotCls: 'bg-amber-500' },
  IN_PROGRESS: { label: 'Đang làm', cls: 'bg-blue-50 text-blue-700 border-blue-200', dotCls: 'bg-blue-500' },
  PENDING_APPROVAL: { label: 'Chờ duyệt', cls: 'bg-purple-50 text-purple-700 border-purple-200', dotCls: 'bg-purple-500' },
  REJECTED: { label: 'Bị từ chối (Làm lại)', cls: 'bg-rose-50 text-rose-700 border-rose-200', dotCls: 'bg-rose-500' },
  COMPLETED: { label: 'Hoàn thành', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dotCls: 'bg-emerald-500' },
  CANCELLED: { label: 'Đã hủy', cls: 'bg-gray-50 text-gray-600 border-gray-200', dotCls: 'bg-gray-400' },
};

// Phân loại công việc chính xác, bao gồm Gieo trồng & Chăm sóc cây
export type TaskCategoryKey = 'ALL' | 'PLANTING_CARE' | 'HARVEST' | 'ISSUE' | 'SERVICE_REQUEST' | 'MAINTENANCE';

export const categoryConfig: Record<Exclude<TaskCategoryKey, 'ALL'>, { label: string; icon: JSX.Element; badgeCls: string }> = {
  PLANTING_CARE: { label: 'Gieo trồng & Chăm sóc', icon: <Sprout className="w-3.5 h-3.5" />, badgeCls: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  HARVEST: { label: 'Thu hoạch', icon: <Zap className="w-3.5 h-3.5" />, badgeCls: 'bg-amber-100 text-amber-800 border-amber-200' },
  ISSUE: { label: 'Báo cáo sự cố', icon: <AlertTriangle className="w-3.5 h-3.5" />, badgeCls: 'bg-rose-100 text-rose-800 border-rose-200' },
  SERVICE_REQUEST: { label: 'Dịch vụ khách yêu cầu', icon: <ClipboardList className="w-3.5 h-3.5" />, badgeCls: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  MAINTENANCE: { label: 'Bảo trì & Kỹ thuật', icon: <Wrench className="w-3.5 h-3.5" />, badgeCls: 'bg-slate-100 text-slate-800 border-slate-200' },
};

export function getTaskCategory(task: GardeningTask): Exclude<TaskCategoryKey, 'ALL'> {
  const name = (task.taskName || '').toLowerCase();
  const desc = (task.description || '').toLowerCase();
  const type = (task.taskType || '').toUpperCase();

  // 1. Thu hoạch
  if (type === 'HARVEST' || name.includes('thu hoạch') || desc.includes('thu hoạch')) {
    return 'HARVEST';
  }

  // 2. Báo cáo sự cố
  if (name.startsWith('issue report:') || type === 'INCIDENT' || name.includes('sự cố') || desc.includes('sự cố')) {
    return 'ISSUE';
  }

  // 3. Gieo trồng & Chăm sóc cây (Bao gồm gieo giống, chăm sóc, bón phân, cắt cỏ, cắt tỉa, tưới nước, làm cỏ, ươm mầm, đổi cây)
  if (
    type === 'PLANTING' ||
    name.includes('gieo') ||
    name.includes('trồng') ||
    name.includes('chăm sóc') ||
    name.includes('bón phân') ||
    name.includes('cắt cỏ') ||
    name.includes('cắt tỉa') ||
    name.includes('nhổ cỏ') ||
    name.includes('làm cỏ') ||
    name.includes('tưới') ||
    name.includes('ươm') ||
    name.includes('mầm') ||
    name.includes('cây mới') ||
    name.includes('đổi cây') ||
    name.includes('chuẩn bị & gieo') ||
    name.includes('chuẩn bị ô đất') ||
    desc.includes('gieo') ||
    desc.includes('cây giống') ||
    desc.includes('chăm sóc') ||
    desc.includes('trồng cây') ||
    desc.includes('bón phân') ||
    desc.includes('cắt cỏ')
  ) {
    return 'PLANTING_CARE';
  }

  // 4. Dịch vụ theo yêu cầu của khách hàng
  if (type === 'SERVICE_REQUEST') {
    return 'SERVICE_REQUEST';
  }

  // 5. Bảo trì hạ tầng, thiết bị, dọn dẹp, kiểm tra máy móc
  return 'MAINTENANCE';
}

export default function GardenStaffDashboard() {
  const [tasks, setTasks] = useState<GardeningTask[]>([]);
  const [availableTasks, setAvailableTasks] = useState<GardeningTask[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<TaskCategoryKey>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [claimingId, setClaimingId] = useState<number | null>(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [availPage, setAvailPage] = useState(1);
  const [availPageSize, setAvailPageSize] = useState(5);

  // Modals
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [completeModalTask, setCompleteModalTask] = useState<GardeningTask | null>(null);
  const [issueModalTask, setIssueModalTask] = useState<GardeningTask | null>(null);

  // Báo thu hoạch sớm (trước khi đủ số ngày sinh trưởng)
  const [eligibleRentals, setEligibleRentals] = useState<EligibleHarvestRental[]>([]);
  const [showEarlyPanel, setShowEarlyPanel] = useState(false);
  const [selectedEarlyItemKey, setSelectedEarlyItemKey] = useState('');
  const [earlyNotifying, setEarlyNotifying] = useState(false);
  const [earlyError, setEarlyError] = useState('');
  const [earlySuccess, setEarlySuccess] = useState('');

  const fetchTasks = () => {
    setLoading(true);
    Promise.all([taskApi.getMyTasks(), taskApi.getAvailableTasks(), taskApi.getEligibleEarlyHarvestRentals()])
      .then(([mine, available, eligible]) => {
        setTasks((mine || []).sort((a, b) => b.id - a.id));
        setAvailableTasks((available || []).sort((a, b) => b.id - a.id));
        setEligibleRentals(eligible || []);
      })
      .catch(() => setError('Không thể tải danh sách công việc'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTasks(); }, []);

  const handleNotifyEarlyHarvest = async () => {
    if (!selectedEarlyItemKey) return;
    const selectedItem = eligibleRentals.find((r, idx) => `${r.rentalId}_${r.pillarId || r.pillarCode || idx}` === selectedEarlyItemKey);
    if (!selectedItem) return;

    setEarlyNotifying(true);
    setEarlyError('');
    setEarlySuccess('');
    try {
      await taskApi.notifyEarlyHarvest({
        rentalId: selectedItem.rentalId,
        pillarId: selectedItem.pillarId,
        pillarCode: selectedItem.pillarCode || selectedItem.pillarCodes,
      });
      setEarlySuccess(`Đã gửi đề xuất thu hoạch sớm cho Ô ${selectedItem.slotNumber}${selectedItem.pillarCode ? ` (Trụ ${selectedItem.pillarCode})` : ''} lên Location Manager phê duyệt thành công!`);
      setSelectedEarlyItemKey('');
      fetchTasks();
    } catch (err: any) {
      setEarlyError(err?.response?.data?.message || 'Báo thu hoạch sớm thất bại.');
    } finally {
      setEarlyNotifying(false);
    }
  };

  const handleClaim = async (taskId: number) => {
    setClaimingId(taskId);
    try {
      await taskApi.claimTask(taskId);
      fetchTasks();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Nhận việc thất bại, có thể bạn chưa được phân công phụ trách ô vườn này hoặc ca trực khác đã nhận.');
    } finally {
      setClaimingId(null);
    }
  };

  const handleStartTask = async (taskId: number) => {
    try {
      await taskApi.updateTaskStatus(taskId, { status: 'IN_PROGRESS' });
      fetchTasks();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể bắt đầu làm việc. Vui lòng thử lại.');
    }
  };

  const handleNotifyHarvest = async (taskId: number) => {
    try {
      await taskApi.notifyHarvestChoice(taskId);
      fetchTasks();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Báo khách hàng thu hoạch thất bại.');
    }
  };

  const pendingCount = tasks.filter(t => t.status === 'PENDING').length;
  const inProgressCount = tasks.filter(t => t.status === 'IN_PROGRESS').length;

  // Lọc danh sách công việc của tôi
  const filteredMyTasks = useMemo(() => {
    return tasks.filter(task => {
      // Lọc theo Category
      if (selectedCategory !== 'ALL') {
        const cat = getTaskCategory(task);
        if (cat !== selectedCategory) return false;
      }
      // Lọc theo Status
      if (statusFilter !== 'ALL') {
        if (task.status !== statusFilter) return false;
      }
      // Lọc theo Tìm kiếm
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = task.taskName?.toLowerCase().includes(q);
        const matchSlot = task.targetSlotNumber?.toLowerCase().includes(q);
        const matchPillar = task.pillarCodes?.toLowerCase().includes(q);
        const matchTree = task.treeName?.toLowerCase().includes(q);
        const matchDesc = task.description?.toLowerCase().includes(q);
        const matchId = String(task.id).includes(q);
        if (!matchName && !matchSlot && !matchPillar && !matchTree && !matchDesc && !matchId) return false;
      }
      return true;
    });
  }, [tasks, selectedCategory, statusFilter, search]);

  // Phân trang công việc của tôi
  const totalPages = Math.max(1, Math.ceil(filteredMyTasks.length / pageSize));
  const paginatedMyTasks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredMyTasks.slice(start, start + pageSize);
  }, [filteredMyTasks, currentPage, pageSize]);

  // Lọc danh sách công việc có thể nhận
  const filteredAvailableTasks = useMemo(() => {
    return availableTasks.filter(task => {
      if (selectedCategory !== 'ALL') {
        const cat = getTaskCategory(task);
        if (cat !== selectedCategory) return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = task.taskName?.toLowerCase().includes(q);
        const matchSlot = task.targetSlotNumber?.toLowerCase().includes(q);
        const matchPillar = task.pillarCodes?.toLowerCase().includes(q);
        const matchTree = task.treeName?.toLowerCase().includes(q);
        const matchDesc = task.description?.toLowerCase().includes(q);
        const matchId = String(task.id).includes(q);
        if (!matchName && !matchSlot && !matchPillar && !matchTree && !matchDesc && !matchId) return false;
      }
      return true;
    });
  }, [availableTasks, selectedCategory, search]);

  // Phân trang công việc có thể nhận
  const availTotalPages = Math.max(1, Math.ceil(filteredAvailableTasks.length / availPageSize));
  const paginatedAvailTasks = useMemo(() => {
    const start = (availPage - 1) * availPageSize;
    return filteredAvailableTasks.slice(start, start + availPageSize);
  }, [filteredAvailableTasks, availPage, availPageSize]);

  // Thống kê số lượng theo từng category
  const categoryCounts = useMemo(() => {
    const counts: Record<TaskCategoryKey, number> = {
      ALL: tasks.length + availableTasks.length,
      PLANTING_CARE: 0,
      HARVEST: 0,
      ISSUE: 0,
      SERVICE_REQUEST: 0,
      MAINTENANCE: 0,
    };
    [...tasks, ...availableTasks].forEach(t => {
      const cat = getTaskCategory(t);
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [tasks, availableTasks]);

  return (
    <DashboardLayout navItems={navItems} title="Bảng điều khiển Nhân viên vườn">
      <div className="space-y-6">

        {/* 1. Thẻ thống kê tổng quan */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card bg-white border border-gray-100 shadow-sm p-5 rounded-2xl flex items-center justify-between">
            <div>
              <div className="text-3xl font-black text-gray-900">{tasks.length}</div>
              <div className="text-sm font-medium text-gray-500 mt-1">Việc của tôi đã nhận</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">
              <ClipboardList className="w-6 h-6" />
            </div>
          </div>

          <div className="card bg-white border border-gray-100 shadow-sm p-5 rounded-2xl flex items-center justify-between">
            <div>
              <div className="text-3xl font-black text-amber-600">{pendingCount}</div>
              <div className="text-sm font-medium text-gray-500 mt-1">Chờ bắt đầu làm</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg">
              <Play className="w-6 h-6" />
            </div>
          </div>

          <div className="card bg-white border border-gray-100 shadow-sm p-5 rounded-2xl flex items-center justify-between">
            <div>
              <div className="text-3xl font-black text-blue-600">{inProgressCount}</div>
              <div className="text-sm font-medium text-gray-500 mt-1">Đang thực hiện</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
              <Sparkles className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* 2. Thanh bộ lọc & Tìm kiếm tích hợp Dropdown */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            
            {/* Bộ lọc Dropdown Loại công việc */}
            <div className="flex items-center gap-2 flex-wrap flex-1">
              <Filter className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-sm font-bold text-gray-700">Loại công việc:</span>
              <select
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition bg-white font-medium shadow-xs"
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value as TaskCategoryKey);
                  setCurrentPage(1);
                  setAvailPage(1);
                }}
              >
                <option value="ALL">🌟 Tất cả loại công việc ({categoryCounts.ALL})</option>
                <option value="PLANTING_CARE">🌱 Gieo trồng & Chăm sóc ({categoryCounts.PLANTING_CARE})</option>
                <option value="HARVEST">🌾 Thu hoạch ({categoryCounts.HARVEST})</option>
                <option value="ISSUE">⚠️ Báo cáo sự cố ({categoryCounts.ISSUE})</option>
                <option value="SERVICE_REQUEST">🛠️ Dịch vụ khách yêu cầu ({categoryCounts.SERVICE_REQUEST})</option>
                <option value="MAINTENANCE">🧹 Bảo trì & Kỹ thuật ({categoryCounts.MAINTENANCE})</option>
              </select>

              {/* Lọc theo Trạng thái */}
              <span className="text-sm font-bold text-gray-700 ml-2">Trạng thái:</span>
              <select
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition bg-white font-medium shadow-xs"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="PENDING">Chờ xử lý</option>
                <option value="IN_PROGRESS">Đang làm</option>
                <option value="PENDING_APPROVAL">Chờ duyệt</option>
                <option value="REJECTED">Bị từ chối</option>
                <option value="COMPLETED">Hoàn thành</option>
              </select>
            </div>

            {/* Ô tìm kiếm */}
            <div className="relative min-w-[240px] sm:w-72">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm mã, ô vườn, trụ, tên việc..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                  setAvailPage(1);
                }}
                className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition bg-gray-50/50 hover:bg-white"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs p-1"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {(selectedCategory !== 'ALL' || statusFilter !== 'ALL' || search) && (
            <div className="flex items-center gap-2 pt-2 border-t border-gray-100 text-xs text-gray-500">
              <span>Đang lọc:</span>
              {selectedCategory !== 'ALL' && (
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-semibold border border-emerald-200">
                  {categoryConfig[selectedCategory]?.label}
                </span>
              )}
              {statusFilter !== 'ALL' && (
                <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-semibold border border-blue-200">
                  {statusConfig[statusFilter]?.label || statusFilter}
                </span>
              )}
              {search && (
                <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md font-semibold">
                  "{search}"
                </span>
              )}
              <button
                onClick={() => {
                  setSelectedCategory('ALL');
                  setStatusFilter('ALL');
                  setSearch('');
                  setCurrentPage(1);
                  setAvailPage(1);
                }}
                className="text-emerald-600 hover:text-emerald-700 font-bold ml-auto hover:underline"
              >
                ✕ Xóa tất cả bộ lọc
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-rose-50 text-rose-700 rounded-2xl p-4 text-sm font-medium border border-rose-200 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError('')} className="text-rose-400 hover:text-rose-600 text-sm font-bold">✕</button>
          </div>
        )}

        {/* 3. Bảng báo thu hoạch sớm (Collapsible Panel) */}
        <div className="bg-gradient-to-r from-amber-50/80 to-amber-100/40 rounded-2xl border border-amber-200 p-4 transition-all">
          <button
            onClick={() => setShowEarlyPanel(v => !v)}
            className="w-full text-left font-bold text-amber-900 flex items-center justify-between hover:text-amber-950 text-sm"
          >
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-amber-200/60 rounded-lg text-amber-800">
                <Zap className="w-4 h-4" />
              </span>
              <span>Đề xuất Báo Thu Hoạch Sớm (Gửi Location Manager duyệt)</span>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-200/50 text-amber-900">
              {showEarlyPanel ? 'Thu gọn ▲' : 'Mở form ▼'}
            </span>
          </button>

          {showEarlyPanel && (
            <div className="mt-4 pt-4 border-t border-amber-200/60 space-y-3">
              <p className="text-xs text-amber-800 leading-relaxed">
                Chọn chính xác trụ và cây trồng bạn <strong>đã nhận việc phụ trách</strong> để gửi đề xuất thu hoạch sớm lên Location Manager phê duyệt. Sau khi Quản lý duyệt, hệ thống sẽ tự động thông báo để khách hàng lựa chọn hình thức thu hoạch.
              </p>
              {earlyError && <div className="bg-rose-50 text-rose-700 rounded-xl p-3 text-xs font-medium border border-rose-200">{earlyError}</div>}
              {earlySuccess && <div className="bg-emerald-50 text-emerald-700 rounded-xl p-3 text-xs font-medium border border-emerald-200">{earlySuccess}</div>}
              
              {eligibleRentals.length > 0 ? (
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <select
                    className="input text-sm flex-1 bg-white border-amber-300 focus:border-amber-500 rounded-xl"
                    value={selectedEarlyItemKey}
                    onChange={e => setSelectedEarlyItemKey(e.target.value)}
                  >
                    <option value="">-- Chọn trụ / cây trồng cần báo thu hoạch sớm --</option>
                    {eligibleRentals.map((r, idx) => {
                      const key = `${r.rentalId}_${r.pillarId || r.pillarCode || idx}`;
                      const pillarText = r.pillarCode ? ` · Trụ ${r.pillarCode}` : (r.pillarCodes ? ` · Trụ ${r.pillarCodes}` : '');
                      const growthText = r.daysGrown != null ? ` · Đã trồng ${r.daysGrown} ngày` : '';
                      const harvestDaysText = r.harvestDays ? ` (Chu kỳ ${r.harvestDays} ngày)` : '';
                      return (
                        <option key={key} value={key}>
                          Ô {r.slotNumber}{pillarText} · 🌱 {r.treeName}{growthText}{harvestDaysText}
                        </option>
                      );
                    })}
                  </select>
                  <button
                    disabled={!selectedEarlyItemKey || earlyNotifying}
                    onClick={handleNotifyEarlyHarvest}
                    className="btn-primary text-xs py-2 px-5 whitespace-nowrap flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-sm"
                  >
                    {earlyNotifying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sprout className="w-3.5 h-3.5" />}
                    Gửi đề xuất thu hoạch sớm
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-white/80 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                  <span className="text-base">🌱</span>
                  <span>Hiện tại tất cả các trụ / cây trồng tại cơ sở đều đang ở trạng thái bình thường hoặc đã gửi đề xuất thu hoạch sớm.</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 4. Bảng công việc chưa ai nhận (Available Tasks Table) */}
        {availableTasks.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden space-y-0">
            <div className="p-4 sm:p-5 border-b border-gray-100 bg-amber-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Công việc có thể nhận ({filteredAvailableTasks.length})</h3>
                  <p className="text-xs text-gray-500">Các công việc đang chờ nhân viên ca trực nhận việc</p>
                </div>
              </div>
            </div>

            {filteredAvailableTasks.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">
                Không có công việc nào phù hợp với bộ lọc tìm kiếm hiện tại.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-600 font-bold text-xs uppercase tracking-wider border-b border-gray-100">
                      <tr>
                        <th className="py-3.5 px-4">Mã & Tên công việc</th>
                        <th className="py-3.5 px-4">Vị trí</th>
                        <th className="py-3.5 px-4">Cây trồng</th>
                        <th className="py-3.5 px-4">Phân loại</th>
                        <th className="py-3.5 px-4 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                      {paginatedAvailTasks.map(task => {
                        const catKey = getTaskCategory(task);
                        const cat = categoryConfig[catKey];
                        return (
                          <tr key={task.id} className="hover:bg-amber-50/30 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="flex items-start gap-2">
                                <span className="text-xs font-mono font-bold text-gray-400 mt-0.5">#{task.id}</span>
                                <div>
                                  <div className="font-bold text-gray-900 flex items-center gap-1.5 flex-wrap">
                                    <span>{task.taskName}</span>
                                    {(task.isEarlyHarvest || task.taskName?.includes('sớm')) && (
                                      <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                                        ⚡ Thu hoạch sớm
                                      </span>
                                    )}
                                  </div>
                                  {task.description && (
                                    <p className="text-xs text-gray-500 mt-1 line-clamp-2 max-w-md">{task.description}</p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md text-xs">
                                  <MapPin className="w-3 h-3" /> Ô: {task.targetSlotNumber || 'N/A'}
                                </span>
                                <div>
                                  {task.pillarCodes ? (
                                    <span className="inline-flex items-center gap-1 text-teal-800 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded text-[11px]">
                                      <Layers className="w-3 h-3" /> Trụ: {task.pillarCodes}
                                    </span>
                                  ) : (
                                    <span className="text-[11px] text-gray-400">Toàn bộ trụ</span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              {task.treeName ? (
                                <span className="inline-flex items-center gap-1 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-semibold">
                                  <Sprout className="w-3 h-3" /> {task.treeName}
                                </span>
                              ) : (
                                <span className="text-gray-400 text-xs">--</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span className={clsx('inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border', cat.badgeCls)}>
                                {cat.icon} {cat.label}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <button
                                disabled={claimingId === task.id}
                                onClick={() => handleClaim(task.id)}
                                className="btn-primary text-xs py-1.5 px-4 inline-flex items-center gap-1.5 shadow-xs"
                              >
                                {claimingId === task.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                                Nhận việc
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="p-3 border-t border-gray-100 bg-gray-50/50">
                  <Pagination
                    currentPage={availPage}
                    totalPages={availTotalPages}
                    totalItems={filteredAvailableTasks.length}
                    pageSize={availPageSize}
                    onPageChange={setAvailPage}
                    onPageSizeChange={(sz) => {
                      setAvailPageSize(sz);
                      setAvailPage(1);
                    }}
                    pageSizeOptions={[5, 10, 20]}
                    itemName="công việc"
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* 5. Bảng Công việc của tôi (My Tasks Table) */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">Danh sách Công việc của tôi ({filteredMyTasks.length})</h3>
                <p className="text-xs text-gray-500">Các công việc bạn được phân công hoặc đã chủ động nhận</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-2" />
              <p className="text-xs text-gray-500">Đang tải danh sách công việc...</p>
            </div>
          ) : filteredMyTasks.length === 0 ? (
            <div className="text-center py-16 text-gray-400 space-y-2">
              <ClipboardList className="w-12 h-12 mx-auto opacity-30" />
              <p className="font-medium text-sm text-gray-600">Không có công việc nào được tìm thấy</p>
              <p className="text-xs text-gray-400">Hãy thử đổi loại công việc hoặc xóa bộ lọc tìm kiếm.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50/80 text-gray-600 font-bold text-xs uppercase tracking-wider border-b border-gray-100">
                    <tr>
                      <th className="py-3.5 px-4 min-w-[280px]">Mã & Tên công việc</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">Vị trí</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">Cây trồng</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">Loại việc</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">Trạng thái</th>
                      <th className="py-3.5 px-4 text-right min-w-[200px]">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                    {paginatedMyTasks.map(task => {
                      const catKey = getTaskCategory(task);
                      const cat = categoryConfig[catKey];
                      const st = statusConfig[task.status] || { label: task.status, cls: 'bg-gray-50 text-gray-600 border-gray-200', dotCls: 'bg-gray-400' };

                      return (
                        <tr key={task.id} className="hover:bg-gray-50/60 transition-colors">
                          {/* 1. Mã & Tên công việc + Mô tả + Ảnh bằng chứng */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-1.5">
                              <div className="flex items-start gap-2">
                                <span className="text-xs font-mono font-bold text-gray-400 mt-0.5">#{task.id}</span>
                                <div>
                                  <div className="font-bold text-gray-900 text-sm flex items-center gap-1.5 flex-wrap">
                                    <span>{task.taskName}</span>
                                    {(task.isEarlyHarvest || task.taskName?.includes('sớm')) && (
                                      <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                                        ⚡ Thu hoạch sớm
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {task.description && (
                                <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded-lg border border-gray-100 line-clamp-2 max-w-lg">
                                  {task.description}
                                </p>
                              )}

                              {task.status === 'REJECTED' && task.rejectionReason && (
                                <div className="text-xs text-rose-700 bg-rose-50 p-2 border border-rose-200 rounded-lg font-medium">
                                  ⚠️ <strong>Lý do từ chối:</strong> {task.rejectionReason}
                                </div>
                              )}

                              {/* Thumbnail Ảnh Bằng Chứng Đã Nộp */}
                              {task.evidenceImageUrl && (
                                <div className="flex items-center gap-2 pt-1">
                                  <div
                                    onClick={() => setPreviewImage(task.evidenceImageUrl!)}
                                    className="w-10 h-10 rounded-lg overflow-hidden border border-emerald-300 bg-gray-900 cursor-pointer shadow-xs shrink-0 group relative"
                                  >
                                    <img
                                      src={task.evidenceImageUrl}
                                      alt="Bằng chứng"
                                      className="w-full h-full object-cover group-hover:scale-110 transition"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=Ảnh';
                                      }}
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition">
                                      <Eye className="w-3 h-3" />
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setPreviewImage(task.evidenceImageUrl!)}
                                    className="text-emerald-700 hover:text-emerald-800 text-xs font-semibold inline-flex items-center gap-1 hover:underline"
                                  >
                                    <Eye className="w-3 h-3" /> Xem ảnh bằng chứng
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* 2. Vị trí */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md text-xs">
                                <MapPin className="w-3 h-3" /> Ô: {task.targetSlotNumber || 'N/A'}
                              </span>
                              <div>
                                {task.pillarCodes ? (
                                  <span className="inline-flex items-center gap-1 font-semibold text-teal-800 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded text-[11px]">
                                    <Layers className="w-3 h-3" /> Trụ {task.pillarCodes}
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-gray-400">Toàn bộ trụ</span>
                                )}
                              </div>
                              {task.locationName && (
                                <div className="text-[11px] text-gray-400">({task.locationName})</div>
                              )}
                            </div>
                          </td>

                          {/* 3. Cây trồng */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {task.treeName ? (
                              <span className="inline-flex items-center gap-1 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-semibold">
                                <Sprout className="w-3 h-3" /> {task.treeName}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">--</span>
                            )}
                          </td>

                          {/* 4. Phân loại việc */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className={clsx('inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border', cat.badgeCls)}>
                              {cat.icon} {cat.label}
                            </span>
                          </td>

                          {/* 5. Trạng thái */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className={clsx('inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border', st.cls)}>
                              <span className={clsx('w-1.5 h-1.5 rounded-full', st.dotCls)} />
                              {st.label}
                            </span>
                          </td>

                          {/* 6. Thao tác hành động */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              {/* Bắt đầu làm (khi PENDING) */}
                              {task.status === 'PENDING' && (
                                <button
                                  onClick={() => handleStartTask(task.id)}
                                  className="btn-primary text-xs py-1.5 px-3 inline-flex items-center gap-1 shadow-xs"
                                >
                                  <Play className="w-3 h-3" /> Bắt đầu làm
                                </button>
                              )}

                              {/* Báo khách thu hoạch (khi HARVEST và IN_PROGRESS) */}
                              {task.taskType === 'HARVEST' && task.status === 'IN_PROGRESS' && (
                                <button
                                  onClick={() => handleNotifyHarvest(task.id)}
                                  className="btn-secondary text-xs py-1.5 px-2.5 inline-flex items-center gap-1 text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100"
                                >
                                  <Bell className="w-3 h-3 text-amber-600" /> Báo khách thu hoạch
                                </button>
                              )}

                              {/* Hoàn thành & Nộp bằng chứng (khi IN_PROGRESS hoặc REJECTED) */}
                              {(task.status === 'IN_PROGRESS' || task.status === 'REJECTED') && (
                                <button
                                  onClick={() => setCompleteModalTask(task)}
                                  className="btn-primary text-xs py-1.5 px-3 inline-flex items-center gap-1 shadow-xs"
                                >
                                  <CheckCircle className="w-3 h-3" />
                                  {task.status === 'REJECTED' ? 'Nộp lại ảnh' : 'Nộp bằng chứng'}
                                </button>
                              )}

                              {/* Báo sự cố */}
                              {task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && (
                                <button
                                  onClick={() => setIssueModalTask(task)}
                                  className="btn-secondary text-xs py-1.5 px-2.5 inline-flex items-center gap-1 text-rose-700 bg-rose-50 border-rose-200 hover:bg-rose-100"
                                  title="Báo cáo sự cố phát sinh tại ô vườn này"
                                >
                                  <AlertTriangle className="w-3 h-3 text-rose-500" /> Báo sự cố
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Phân trang chuẩn hóa Pagination */}
              <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredMyTasks.length}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={(sz) => {
                    setPageSize(sz);
                    setCurrentPage(1);
                  }}
                  pageSizeOptions={[5, 10, 15, 20]}
                  itemName="công việc"
                />
              </div>
            </>
          )}
        </div>

      </div>

      {/* MODAL 1: Hoàn thành & Tải ảnh bằng chứng */}
      {completeModalTask && (
        <CompleteTaskModal
          task={completeModalTask}
          onClose={() => setCompleteModalTask(null)}
          onSuccess={() => {
            setCompleteModalTask(null);
            fetchTasks();
          }}
        />
      )}

      {/* MODAL 2: Báo cáo sự cố */}
      {issueModalTask && (
        <ReportIssueModal
          task={issueModalTask}
          onClose={() => setIssueModalTask(null)}
          onSuccess={() => {
            setIssueModalTask(null);
            fetchTasks();
          }}
        />
      )}

      {/* MODAL 3: Lightbox Xem ảnh phóng to */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 animate-in fade-in backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] p-2" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setPreviewImage(null)} 
              className="absolute -top-10 right-0 text-white hover:text-gray-300 p-1.5 bg-white/20 hover:bg-white/30 rounded-full transition"
            >
              <X className="w-6 h-6" />
            </button>
            <img 
              src={previewImage} 
              alt="Phóng to bằng chứng" 
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/20 bg-gray-900"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://placehold.co/800x600?text=Lỗi+tải+ảnh';
              }}
            />
            <div className="text-center mt-3">
              <a 
                href={previewImage} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center gap-1.5 text-xs text-white bg-white/20 hover:bg-white/30 px-3.5 py-1.5 rounded-xl transition font-medium"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Mở trong tab mới
              </a>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

// Modal component: Hoàn thành & Nộp ảnh bằng chứng
function CompleteTaskModal({
  task,
  onClose,
  onSuccess
}: {
  task: GardeningTask;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setFile(f);
      if (preview) URL.revokeObjectURL(preview);
      setPreview(URL.createObjectURL(f));
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      setError('Vui lòng chọn hình ảnh bằng chứng công việc.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const imgUrl = await taskApi.uploadEvidenceImage(file);
      await taskApi.updateTaskStatus(task.id, {
        status: 'PENDING_APPROVAL',
        evidenceImageUrl: imgUrl,
      });
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Tải ảnh lên hoặc nộp bằng chứng thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in backdrop-blur-xs" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-gray-100 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base">Hoàn thành & Nộp bằng chứng</h3>
              <p className="text-xs text-gray-500 font-mono">#{task.id} - {task.taskName}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && <div className="bg-rose-50 text-rose-700 p-3 rounded-xl text-xs font-medium border border-rose-200">{error}</div>}

        <div className="space-y-3">
          <label className="block text-xs font-bold text-gray-700">
            Tải lên hình ảnh bằng chứng kết quả công việc <span className="text-rose-500">*</span>
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer border border-gray-200 rounded-xl p-1 bg-white"
          />

          {preview && (
            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
              <img src={preview} alt="Xem trước" className="w-16 h-16 object-cover rounded-lg border border-gray-300 shadow-xs" />
              <div className="text-xs space-y-1">
                <span className="font-bold text-gray-800 block truncate max-w-xs">{file?.name}</span>
                <span className="text-gray-500">{((file?.size || 0) / (1024 * 1024)).toFixed(2)} MB</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2 border-t border-gray-100">
          <button
            onClick={handleSubmit}
            disabled={loading || !file}
            className="btn-primary text-xs py-2.5 px-4 flex-1 flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {loading ? 'Đang gửi duyệt...' : 'Gửi hoàn thành & chờ duyệt'}
          </button>
          <button onClick={onClose} disabled={loading} className="btn-secondary text-xs py-2.5 px-4">Hủy</button>
        </div>
      </div>
    </div>
  );
}

// Modal component: Báo cáo sự cố
function ReportIssueModal({
  task,
  onClose,
  onSuccess
}: {
  task: GardeningTask;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      setError('Vui lòng nhập đầy đủ tiêu đề và mô tả sự cố.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await taskApi.reportIssue(task.id, { issueTitle: title, description });
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gửi báo cáo sự cố thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in backdrop-blur-xs" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-gray-100 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-rose-100 text-rose-700 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base">Báo cáo Sự cố tại Ô vườn</h3>
              <p className="text-xs text-gray-500 font-mono">#{task.id} - {task.taskName}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && <div className="bg-rose-50 text-rose-700 p-3 rounded-xl text-xs font-medium border border-rose-200">{error}</div>}

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Tiêu đề sự cố <span className="text-rose-500">*</span></label>
            <input
              type="text"
              placeholder="VD: Cây bị vàng lá, rò rỉ ống nước, cảm biến lỗi..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="input text-sm w-full bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Mô tả chi tiết <span className="text-rose-500">*</span></label>
            <textarea
              rows={3}
              placeholder="Mô tả cụ thể triệu chứng, mức độ ảnh hưởng..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="input text-sm w-full bg-white resize-none"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-2 border-t border-gray-100">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary bg-rose-600 hover:bg-rose-700 text-white text-xs py-2.5 px-4 flex-1 flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
            {loading ? 'Đang gửi báo cáo...' : 'Gửi báo cáo sự cố'}
          </button>
          <button onClick={onClose} disabled={loading} className="btn-secondary text-xs py-2.5 px-4">Hủy</button>
        </div>
      </div>
    </div>
  );
}