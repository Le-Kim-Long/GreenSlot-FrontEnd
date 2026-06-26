import { useState, useEffect } from 'react';
import { ClipboardList, Wifi, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { taskApi } from '../../api/taskApi';
import type { GardeningTask } from '../../types/api';
import clsx from 'clsx';

const navItems = [
  { label: 'Công việc', path: '/dashboard/garden-staff', icon: <ClipboardList className="w-full h-full" /> },
  { label: 'Giám sát IoT', path: '/dashboard/garden-staff/monitoring', icon: <Wifi className="w-full h-full" /> },
];

const statusConfig: Record<string, { label: string; cls: string }> = {
  PENDING: { label: 'Chờ xử lý', cls: 'badge-yellow' },
  IN_PROGRESS: { label: 'Đang làm', cls: 'badge-blue' },
  COMPLETED: { label: 'Hoàn thành', cls: 'badge-green' },
};

export default function GardenStaffDashboard() {
  const [tasks, setTasks] = useState<GardeningTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTasks = () => {
    setLoading(true);
    taskApi.getMyTasks()
      .then(setTasks)
      .catch(() => setError('Không thể tải danh sách công việc'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTasks(); }, []);

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
                  </div>
                  <span className={clsx(st.cls, 'w-fit')}>{st.label}</span>
                </div>
                {task.status !== 'COMPLETED' && (
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
  const [issue, setIssue] = useState({ issueTitle: '', description: '' });

  const updateStatus = async (status: string, evidenceImageUrl?: string) => {
    setBusy(true);
    try {
      await taskApi.updateTaskStatus(task.id, { status, evidenceImageUrl });
      onUpdated();
    } finally {
      setBusy(false);
    }
  };

  const submitReport = async () => {
    if (!issue.issueTitle || !issue.description) return;
    setBusy(true);
    try {
      await taskApi.reportIssue(task.id, issue);
      setShowReport(false);
      onUpdated();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-2">
      {task.status === 'PENDING' && (
        <button disabled={busy} onClick={() => updateStatus('IN_PROGRESS')} className="btn-primary text-xs py-1.5 px-3">
          Bắt đầu làm
        </button>
      )}
      {task.status === 'IN_PROGRESS' && (
        <button disabled={busy} onClick={() => updateStatus('COMPLETED', 'https://placeholder.evidence/photo.jpg')} className="btn-primary text-xs py-1.5 px-3">
          <CheckCircle className="w-3 h-3 inline mr-1" /> Hoàn thành
        </button>
      )}
      <button disabled={busy} onClick={() => setShowReport(!showReport)} className="btn-secondary text-xs py-1.5 px-3">
        <AlertTriangle className="w-3 h-3 inline mr-1" /> Báo sự cố
      </button>
      {showReport && (
        <div className="w-full mt-2 space-y-2">
          <input className="input text-sm" placeholder="Tiêu đề sự cố" value={issue.issueTitle} onChange={e => setIssue(p => ({ ...p, issueTitle: e.target.value }))} />
          <textarea className="input text-sm resize-none" rows={2} placeholder="Mô tả" value={issue.description} onChange={e => setIssue(p => ({ ...p, description: e.target.value }))} />
          <button onClick={submitReport} disabled={busy} className="btn-primary text-xs">Gửi báo cáo</button>
        </div>
      )}
    </div>
  );
}
