import { useState, useEffect } from 'react';
import { ClipboardList, Wifi, CheckCircle, AlertTriangle, Loader2, ShieldAlert, Upload, Calendar, Bell } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { taskApi } from '../../api/taskApi';
import type { GardeningTask } from '../../types/api';
import clsx from 'clsx';

const navItems = [
  { label: 'Công việc', path: '/dashboard/garden-staff', icon: <ClipboardList className="w-full h-full" /> },
  { label: 'Lịch trực', path: '/dashboard/garden-staff/schedules', icon: <Calendar className="w-full h-full" /> },
  { label: 'Giám sát IoT', path: '/dashboard/garden-staff/monitoring', icon: <Wifi className="w-full h-full" /> },
  { label: 'Cảnh báo IoT', path: '/dashboard/garden-staff/alerts', icon: <ShieldAlert className="w-full h-full" /> },
  { label: 'Điều khiển máy bơm', path: '/dashboard/garden-staff/pump-control', icon: <CheckCircle className="w-full h-full" /> }
];

const statusConfig: Record<string, { label: string; cls: string }> = {
  PENDING: { label: 'Chờ xử lý', cls: 'bg-yellow-100 text-yellow-700' },
  IN_PROGRESS: { label: 'Đang làm', cls: 'bg-blue-100 text-blue-700' },
  PENDING_APPROVAL: { label: 'Chờ duyệt', cls: 'bg-purple-100 text-purple-700' },
  REJECTED: { label: 'Bị từ chối', cls: 'bg-red-100 text-red-700' },
  COMPLETED: { label: 'Hoàn thành', cls: 'bg-green-100 text-green-700' },
  CANCELLED: { label: 'Đã hủy (khách tự thu hoạch)', cls: 'bg-gray-100 text-gray-600' },
};

export default function GardenStaffDashboard() {
  const [tasks, setTasks] = useState<GardeningTask[]>([]);
  const [availableTasks, setAvailableTasks] = useState<GardeningTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [claimingId, setClaimingId] = useState<number | null>(null);

  const fetchTasks = () => {
    setLoading(true);
    Promise.all([taskApi.getMyTasks(), taskApi.getAvailableTasks()])
      .then(([mine, available]) => {
        setTasks(mine);
        setAvailableTasks(available);
      })
      .catch(() => setError('Không thể tải danh sách công việc'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTasks(); }, []);

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

      {availableTasks.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1.5">
            <Bell className="w-4 h-4 text-amber-500" /> Công việc chưa ai nhận ({availableTasks.length})
          </h3>
          <div className="space-y-2">
            {availableTasks.map(task => (
              <div key={task.id} className="card border-amber-200 bg-amber-50/50 flex items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-gray-900">{task.taskName}</div>
                  <div className="text-sm text-gray-500">{task.targetSlotNumber} · {task.taskType}</div>
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
      )}

      {loading ? (
        <div className="text-center py-16"><Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto" /></div>
      ) : tasks.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Chưa có công việc được phân công</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map(task => {
            const st = statusConfig[task.status] || { label: task.status, cls: 'badge-gray' };
            return (
              <div key={task.id} className="card">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-gray-900">{task.taskName}</div>
                    <div className="text-sm text-gray-500">{task.targetSlotNumber} · {task.taskType}</div>
                    {task.description && <div className="text-xs text-gray-400 mt-1">{task.description}</div>}
                    {task.status === 'REJECTED' && task.rejectionReason && (
                      <div className="text-xs text-red-600 mt-2 font-medium bg-red-50 p-2 border border-red-100 rounded-md">
                        Lý do từ chối: {task.rejectionReason}
                      </div>
                    )}
                  </div>
                  <span className={clsx(st.cls, 'px-2.5 py-1 rounded-full text-xs font-semibold w-fit')}>{st.label}</span>
                </div>
                {(task.status !== 'COMPLETED' && task.status !== 'PENDING_APPROVAL' && task.status !== 'CANCELLED') && (
                  <TaskActions task={task} onUpdated={fetchTasks} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}

function TaskActions({ task, onUpdated }: { task: GardeningTask; onUpdated: () => void }) {
  const [busy, setBusy] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
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
      onUpdated();
    } catch (error) {
      console.error(error);
      setActionError('Lỗi khi tải ảnh lên hoặc cập nhật trạng thái công việc.');
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
      {actionError && <div className="w-full bg-red-50 text-red-600 rounded-lg p-2 text-xs mb-2 font-medium">{actionError}</div>}

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
        <button disabled={busy} onClick={() => { setShowComplete(!showComplete); setShowReport(false); setActionError(''); setEvidenceFile(null); }} className="btn-primary text-xs py-1.5 px-3">
          <CheckCircle className="w-3 h-3 inline mr-1" /> {task.status === 'REJECTED' ? 'Nộp lại bằng chứng' : 'Hoàn thành công việc'}
        </button>
      )}
      
      <button disabled={busy} onClick={() => { setShowReport(!showReport); setShowComplete(false); setActionError(''); }} className="btn-secondary text-xs py-1.5 px-3">
        <AlertTriangle className="w-3 h-3 inline mr-1" /> Báo sự cố
      </button>
      
      {showComplete && (
        <div className="w-full mt-2 p-3 bg-green-50 rounded-xl border border-green-200 space-y-3">
          <label className="block text-xs font-bold text-gray-700">Tải lên hình ảnh bằng chứng (Bắt buộc) *</label>
          
          <div className="flex items-center gap-3">
            <input 
              type="file" 
              accept="image/*"
              onChange={e => {
                if (e.target.files && e.target.files.length > 0) {
                  setEvidenceFile(e.target.files[0]);
                }
              }}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-xs file:font-semibold
                file:bg-green-100 file:text-green-700
                hover:file:bg-green-200 cursor-pointer"
            />
          </div>
          
          {evidenceFile && (
             <div className="text-xs text-gray-600 truncate">
               Đã chọn: {evidenceFile.name}
             </div>
          )}

          <div className="flex gap-2 pt-2">
            <button onClick={handleCompleteWithUpload} disabled={busy || !evidenceFile} className="btn-primary text-xs py-1.5 px-3 flex-1 disabled:opacity-50">
              {busy ? <Loader2 className="w-3 h-3 animate-spin inline mr-1" /> : <Upload className="w-3 h-3 inline mr-1" />}
              {busy ? 'Đang tải lên...' : 'Xác nhận hoàn thành'}
            </button>
            <button onClick={() => setShowComplete(false)} disabled={busy} className="btn-secondary text-xs py-1.5 px-3">Hủy</button>
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