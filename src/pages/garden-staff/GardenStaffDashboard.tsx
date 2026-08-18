import { useState, useEffect } from 'react';
import {
  ClipboardList, Wifi, CheckCircle, AlertTriangle,
  Loader2, ShieldAlert, Upload, Calendar, Bell, Eye,
  Image as ImageIcon, X, ExternalLink, Sprout, Zap, History, Wrench, Camera
} from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
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

const statusConfig: Record<string, { label: string; cls: string }> = {
  PENDING: { label: 'Chờ xử lý', cls: 'bg-yellow-100 text-yellow-700' },
  IN_PROGRESS: { label: 'Đang làm', cls: 'bg-blue-100 text-blue-700' },
  PENDING_APPROVAL: { label: 'Chờ duyệt', cls: 'bg-purple-100 text-purple-700' },
  REJECTED: { label: 'Bị từ chối (Làm lại)', cls: 'bg-red-100 text-red-700' },
  COMPLETED: { label: 'Hoàn thành', cls: 'bg-green-100 text-green-700' },
  CANCELLED: { label: 'Đã hủy (khách tự thu hoạch)', cls: 'bg-gray-100 text-gray-600' },
};

// Phân loại công việc để hiển thị theo từng nhóm thay vì gộp chung 1 danh sách dài
type TaskCategoryKey = 'ISSUE' | 'NEW_PLANTING' | 'HARVEST' | 'SERVICE_REQUEST' | 'MAINTENANCE';

const categoryConfig: Record<TaskCategoryKey, { label: string; icon: JSX.Element; badgeCls: string; cardCls: string }> = {
  ISSUE: { label: 'Báo cáo sự cố', icon: <AlertTriangle className="w-4 h-4" />, badgeCls: 'bg-red-100 text-red-700', cardCls: 'border-red-200 bg-red-50/50' },
  NEW_PLANTING: { label: 'Cây mới trồng', icon: <Sprout className="w-4 h-4" />, badgeCls: 'bg-green-100 text-green-700', cardCls: 'border-green-200 bg-green-50/50' },
  HARVEST: { label: 'Thu hoạch', icon: <Zap className="w-4 h-4" />, badgeCls: 'bg-amber-100 text-amber-700', cardCls: 'border-amber-200 bg-amber-50/50' },
  SERVICE_REQUEST: { label: 'Dịch vụ khách yêu cầu', icon: <ClipboardList className="w-4 h-4" />, badgeCls: 'bg-indigo-100 text-indigo-700', cardCls: 'border-indigo-200 bg-indigo-50/50' },
  MAINTENANCE: { label: 'Bảo trì & vệ sinh', icon: <Wrench className="w-4 h-4" />, badgeCls: 'bg-gray-100 text-gray-700', cardCls: 'border-gray-200 bg-gray-50/50' },
};

const CATEGORY_ORDER: TaskCategoryKey[] = ['ISSUE', 'NEW_PLANTING', 'HARVEST', 'SERVICE_REQUEST', 'MAINTENANCE'];

function getTaskCategory(task: GardeningTask): TaskCategoryKey {
  if (task.taskType === 'HARVEST') return 'HARVEST';
  if (task.taskType === 'SERVICE_REQUEST') return 'SERVICE_REQUEST';
  if (task.taskName?.startsWith('ISSUE REPORT:')) return 'ISSUE';
  if (task.taskName?.startsWith('Kiểm tra & chăm sóc cây mới trồng')) return 'NEW_PLANTING';
  return 'MAINTENANCE';
}

function groupTasksByCategory(tasks: GardeningTask[]): { key: TaskCategoryKey; items: GardeningTask[] }[] {
  return CATEGORY_ORDER
    .map(key => ({ key, items: tasks.filter(t => getTaskCategory(t) === key) }))
    .filter(group => group.items.length > 0);
}

export default function GardenStaffDashboard() {
  const [tasks, setTasks] = useState<GardeningTask[]>([]);
  const [availableTasks, setAvailableTasks] = useState<GardeningTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [claimingId, setClaimingId] = useState<number | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Báo thu hoạch sớm (trước khi đủ số ngày sinh trưởng)
  const [eligibleRentals, setEligibleRentals] = useState<EligibleHarvestRental[]>([]);
  const [showEarlyPanel, setShowEarlyPanel] = useState(false);
  const [selectedEarlyRentalId, setSelectedEarlyRentalId] = useState('');
  const [earlyNotifying, setEarlyNotifying] = useState(false);
  const [earlyError, setEarlyError] = useState('');
  const [earlySuccess, setEarlySuccess] = useState('');

  const fetchTasks = () => {
    setLoading(true);
    Promise.all([taskApi.getMyTasks(), taskApi.getAvailableTasks(), taskApi.getEligibleEarlyHarvestRentals()])
      .then(([mine, available, eligible]) => {
        setTasks(mine);
        setAvailableTasks(available);
        setEligibleRentals(eligible);
      })
      .catch(() => setError('Không thể tải danh sách công việc'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTasks(); }, []);

  const handleNotifyEarlyHarvest = async () => {
    if (!selectedEarlyRentalId) return;
    setEarlyNotifying(true);
    setEarlyError('');
    setEarlySuccess('');
    try {
      await taskApi.notifyEarlyHarvest(Number(selectedEarlyRentalId));
      setEarlySuccess('Đã báo khách hàng thành công!');
      setSelectedEarlyRentalId('');
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
    } catch {
      setError('Nhận việc thất bại, có thể staff khác đã nhận trước.');
    } finally {
      setClaimingId(null);
    }
  };

  const pending = tasks.filter(t => t.status === 'PENDING');
  const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS');

  return (
    <DashboardLayout navItems={navItems} title="Nhân viên vườn">
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card"><div className="text-2xl font-black">{tasks.length}</div><div className="text-sm text-gray-500">Tổng công việc</div></div>
        <div className="card"><div className="text-2xl font-black text-yellow-600">{pending.length}</div><div className="text-sm text-gray-500">Chờ xử lý</div></div>
        <div className="card"><div className="text-2xl font-black text-blue-600">{inProgress.length}</div><div className="text-sm text-gray-500">Đang làm</div></div>
      </div>

      {error && <div className="bg-red-50 text-red-600 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>}

      {eligibleRentals.length > 0 && (
        <div className="mb-6">
          <button
            onClick={() => setShowEarlyPanel(v => !v)}
            className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1.5 hover:text-green-700"
          >
            <Zap className="w-4 h-4 text-amber-500" /> Báo thu hoạch sớm {showEarlyPanel ? '▲' : '▼'}
          </button>

          {showEarlyPanel && (
            <div className="card border-amber-200 bg-amber-50/50 space-y-3">
              <p className="text-xs text-gray-600">
                Chọn ô đất đang có cây tại cơ sở của bạn để báo khách hàng biết cây đã sẵn sàng thu hoạch, kể cả khi chưa đủ số ngày sinh trưởng dự kiến.
              </p>
              {earlyError && <div className="bg-red-50 text-red-600 rounded-lg px-3 py-2 text-xs">{earlyError}</div>}
              {earlySuccess && <div className="bg-green-50 text-green-700 rounded-lg px-3 py-2 text-xs">{earlySuccess}</div>}
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  className="input text-sm flex-1"
                  value={selectedEarlyRentalId}
                  onChange={e => setSelectedEarlyRentalId(e.target.value)}
                >
                  <option value="">-- Chọn ô đất --</option>
                  {eligibleRentals.map(r => (
                    <option key={r.rentalId} value={r.rentalId}>
                      Ô {r.slotNumber} · {r.treeName}
                    </option>
                  ))}
                </select>
                <button
                  disabled={!selectedEarlyRentalId || earlyNotifying}
                  onClick={handleNotifyEarlyHarvest}
                  className="btn-primary text-xs py-2 px-4 whitespace-nowrap flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {earlyNotifying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sprout className="w-3.5 h-3.5" />}
                  Báo thu hoạch sớm
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {availableTasks.length > 0 && (
        <div className="mb-6 space-y-4">
          <h3 className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
            <Bell className="w-4 h-4 text-amber-500" /> Công việc chưa ai nhận ({availableTasks.length})
          </h3>
          {groupTasksByCategory(availableTasks).map(group => {
            const cat = categoryConfig[group.key];
            return (
              <div key={group.key}>
                <div className={clsx('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold mb-2', cat.badgeCls)}>
                  {cat.icon} {cat.label} ({group.items.length})
                </div>
                <div className="space-y-2">
                  {group.items.map(task => (
                    <div key={task.id} className={clsx('card flex items-center justify-between gap-3', cat.cardCls)}>
                      <div>
                        <div className="font-bold text-gray-900">{task.taskName}</div>
                        <div className="text-sm text-gray-500">{task.targetSlotNumber}</div>
                      </div>
                      <button
                        disabled={claimingId === task.id}
                        onClick={() => handleClaim(task.id)}
                        className="btn-primary text-xs py-1.5 px-3 whitespace-nowrap"
                      >
                        {claimingId === task.id ? <Loader2 className="w-3 h-3 animate-spin inline mr-1" /> : null}
                        Nhận việc
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16"><Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto" /></div>
      ) : tasks.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Chưa có công việc được phân công</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupTasksByCategory(tasks).map(group => {
            const cat = categoryConfig[group.key];
            return (
              <div key={group.key}>
                <div className={clsx('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold mb-2', cat.badgeCls)}>
                  {cat.icon} {cat.label} ({group.items.length})
                </div>
                <div className="space-y-3">
                  {group.items.map(task => {
            const st = statusConfig[task.status] || { label: task.status, cls: 'badge-gray' };
            return (
              <div key={task.id} className="card shadow-sm border border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-gray-400">#{task.id}</span>
                      <div className="font-bold text-gray-900 text-base">{task.taskName}</div>
                    </div>
                    <div className="text-xs font-medium text-green-700 mt-0.5">
                      Ô vườn: {task.targetSlotNumber || 'N/A'}
                    </div>
                    {task.description && (
                      <div className="text-xs text-gray-600 mt-2 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                        {task.description}
                      </div>
                    )}
                    
                    {task.status === 'REJECTED' && task.rejectionReason && (
                      <div className="text-xs text-red-600 mt-2 font-medium bg-red-50 p-2.5 border border-red-200 rounded-lg">
                        ⚠️ <strong>Lý do từ chối:</strong> {task.rejectionReason}
                      </div>
                    )}

                    {/* Hiển thị Ảnh Bằng Chứng Đã Nộp */}
                    {task.evidenceImageUrl && (
                      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-3">
                        <div 
                          onClick={() => setPreviewImage(task.evidenceImageUrl!)}
                          className="group relative w-16 h-16 rounded-lg overflow-hidden border border-green-300 bg-gray-900 cursor-pointer shadow-sm flex-shrink-0"
                        >
                          <img 
                            src={task.evidenceImageUrl} 
                            alt="Ảnh bằng chứng" 
                            className="w-full h-full object-cover group-hover:scale-105 transition"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=Ảnh';
                            }}
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-white">
                            <Eye className="w-4 h-4" />
                          </div>
                        </div>
                        <div className="text-xs">
                          <span className="font-semibold text-gray-700 block">Ảnh bằng chứng đã nộp</span>
                          <button 
                            type="button" 
                            onClick={() => setPreviewImage(task.evidenceImageUrl!)}
                            className="text-green-600 hover:text-green-700 font-medium inline-flex items-center gap-1 mt-0.5"
                          >
                            <Eye className="w-3 h-3" /> Bấm để xem ảnh lớn
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <span className={clsx(st.cls, 'px-3 py-1 rounded-full text-xs font-semibold w-fit self-start')}>
                    {st.label}
                  </span>
                </div>

                {(task.status !== 'COMPLETED' && task.status !== 'PENDING_APPROVAL' && task.status !== 'CANCELLED') && (
                  <TaskActions task={task} onUpdated={fetchTasks} />
                )}
              </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Phóng To Ảnh */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-in fade-in backdrop-blur-sm"
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
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl border border-white/20 bg-gray-900"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://placehold.co/800x600?text=Lỗi+tải+ảnh';
              }}
            />
            <div className="text-center mt-3">
              <a 
                href={previewImage} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center gap-1.5 text-xs text-white bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition"
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

function TaskActions({ 
  task, 
  onUpdated 
}: { 
  task: GardeningTask; 
  onUpdated: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidencePreview, setEvidencePreview] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');
  const [issue, setIssue] = useState({ issueTitle: '', description: '' });
  const [notified, setNotified] = useState(false);

  const handleNotifyHarvest = async () => {
    setActionError('');
    setBusy(true);
    try {
      await taskApi.notifyHarvestChoice(task.id);
      setNotified(true);
    } catch {
      setActionError('Báo khách hàng thất bại.');
    } finally {
      setBusy(false);
    }
  };

  const updateStatus = async (status: string) => {
    setActionError('');
    setBusy(true);
    try {
      await taskApi.updateTaskStatus(task.id, { status });
      setShowComplete(false);
      onUpdated();
    } catch {
      setActionError('Cập nhật trạng thái công việc thất bại.');
    } finally {
      setBusy(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setEvidenceFile(file);
      const url = URL.createObjectURL(file);
      setEvidencePreview(url);
    }
  };

  const handleCompleteWithUpload = async () => {
    if (!evidenceFile) {
      setActionError('Bắt buộc phải chọn hình ảnh bằng chứng trước khi hoàn thành công việc.');
      return;
    }
    
    setActionError('');
    setBusy(true);
    
    try {
      const imgUrl = await taskApi.uploadEvidenceImage(evidenceFile); 
      await taskApi.updateTaskStatus(task.id, { status: 'PENDING_APPROVAL', evidenceImageUrl: imgUrl });
      
      setShowComplete(false);
      setEvidenceFile(null);
      setEvidencePreview(null);
      onUpdated();
    } catch (error) {
      console.error(error);
      setActionError('Lỗi khi tải ảnh lên hoặc cập nhật trạng thái công việc. Vui lòng thử lại.');
    } finally {
      setBusy(false);
    }
  };

  const submitReport = async () => {
    if (!issue.issueTitle?.trim() || !issue.description?.trim()) {
      setActionError('Vui lòng nhập đầy đủ Tiêu đề và Mô tả chi tiết sự cố.');
      return;
    }
    setActionError('');
    setBusy(true);
    try {
      await taskApi.reportIssue(task.id, issue);
      setShowReport(false);
      onUpdated();
    } catch {
      setActionError('Gửi báo cáo sự cố thất bại.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-2">
      {actionError && <div className="w-full bg-red-50 text-red-600 rounded-lg p-2.5 text-xs mb-2 font-medium border border-red-200">{actionError}</div>}

      {task.taskType === 'HARVEST' && (task.status === 'PENDING' || task.status === 'IN_PROGRESS') && (
        notified ? (
          <span className="text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5 inline-flex items-center gap-1">
            <Bell className="w-3 h-3" /> Đã báo khách hàng
          </span>
        ) : (
          <button disabled={busy} onClick={handleNotifyHarvest} className="btn-secondary text-xs py-1.5 px-3">
            <Bell className="w-3 h-3 inline mr-1" /> Báo khách hàng
          </button>
        )
      )}

      {task.status === 'PENDING' && (
        <button disabled={busy} onClick={() => updateStatus('IN_PROGRESS')} className="btn-primary text-xs py-1.5 px-3">
          Bắt đầu làm
        </button>
      )}
      
      {(task.status === 'IN_PROGRESS' || task.status === 'REJECTED') && (
        <button disabled={busy} onClick={() => { setShowComplete(!showComplete); setShowReport(false); setActionError(''); setEvidenceFile(null); setEvidencePreview(null); }} className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1">
          <CheckCircle className="w-3.5 h-3.5 inline" /> {task.status === 'REJECTED' ? 'Nộp lại bằng chứng' : 'Hoàn thành công việc'}
        </button>
      )}
      
      <button disabled={busy} onClick={() => { setShowReport(!showReport); setShowComplete(false); setActionError(''); }} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
        <AlertTriangle className="w-3.5 h-3.5 inline text-orange-500" /> Báo sự cố
      </button>
      
      {showComplete && (
        <div className="w-full mt-2 p-4 bg-green-50/80 rounded-xl border border-green-200 space-y-3">
          <label className="block text-xs font-bold text-gray-800 flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4 text-green-700" />
            Tải lên hình ảnh bằng chứng (Bắt buộc) *
          </label>
          
          <div className="flex items-center gap-3">
            <input 
              type="file" 
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-xs text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-xl file:border-0
                file:text-xs file:font-semibold
                file:bg-green-600 file:text-white
                hover:file:bg-green-700 cursor-pointer border border-green-200 rounded-xl p-1 bg-white"
            />
          </div>
          
          {evidencePreview && (
            <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-green-200">
              <img src={evidencePreview} alt="Preview" className="w-14 h-14 object-cover rounded-lg border border-gray-200 shadow-sm" />
              <div className="flex-1 text-xs">
                <span className="font-semibold text-gray-800 block truncate">{evidenceFile?.name}</span>
                <span className="text-gray-500 text-[11px]">{((evidenceFile?.size || 0) / (1024 * 1024)).toFixed(2)} MB</span>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button onClick={handleCompleteWithUpload} disabled={busy || !evidenceFile} className="btn-primary text-xs py-2 px-4 flex-1 disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm">
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin inline" /> : <Upload className="w-3.5 h-3.5 inline" />}
              {busy ? 'Đang tải lên & gửi duyệt...' : 'Gửi hoàn thành & chờ duyệt'}
            </button>
            <button onClick={() => setShowComplete(false)} disabled={busy} className="btn-secondary text-xs py-2 px-3">Hủy</button>
          </div>
        </div>
      )}

      {showReport && (
        <div className="w-full mt-2 p-3 bg-orange-50 rounded-xl border border-orange-200 space-y-2">
          <input className="input text-sm bg-white" placeholder="Tiêu đề sự cố *" value={issue.issueTitle} onChange={e => setIssue(p => ({ ...p, issueTitle: e.target.value }))} />
          <textarea className="input text-sm resize-none bg-white" rows={2} placeholder="Mô tả chi tiết sự cố *" value={issue.description} onChange={e => setIssue(p => ({ ...p, description: e.target.value }))} />
          <div className="flex gap-2">
            <button onClick={submitReport} disabled={busy} className="btn-primary text-xs py-1.5 px-3 flex-1">Gửi báo cáo</button>
            <button onClick={() => setShowReport(false)} disabled={busy} className="btn-secondary text-xs py-1.5 px-3">Hủy</button>
          </div>
        </div>
      )}
    </div>
  );
}