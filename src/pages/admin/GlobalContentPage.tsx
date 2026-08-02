import { useState, useEffect } from 'react';
import { FileText, Users, ShieldCheck, TrendingUp, Loader2, Plus, Pencil } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { adminApi } from '../../api/adminApi';
import type { GlobalContent } from '../../types/api';

const navItems = [
  { label: 'Tổng quan', path: '/dashboard/admin', icon: <TrendingUp className="w-full h-full" /> },
  { label: 'Người dùng', path: '/dashboard/admin/users', icon: <Users className="w-full h-full" /> },
  { label: 'Audit logs', path: '/dashboard/admin/audit', icon: <ShieldCheck className="w-full h-full" /> },
  { label: 'Nội dung', path: '/dashboard/admin/content', icon: <FileText className="w-full h-full" /> },
  { label: 'Camera IoT', path: '/dashboard/admin/cameras', icon: <ShieldCheck className="w-full h-full" /> },
];

const typeLabels: Record<GlobalContent['contentType'], string> = {
  ANNOUNCEMENT: 'Thông báo',
  CONFIG: 'Cấu hình',
};

const emptyForm: GlobalContent = {
  title: '',
  content: '',
  contentType: 'ANNOUNCEMENT',
  active: true,
};

export default function GlobalContentPage() {
  const [items, setItems] = useState<GlobalContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<GlobalContent | null>(null);
  const [form, setForm] = useState<GlobalContent>(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchItems = () => {
    setLoading(true);
    setError('');
    adminApi.getGlobalContent()
      .then(data => setItems(Array.isArray(data) ? data : []))
      .catch(() => setError('Không thể tải danh sách nội dung'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchItems(); }, []);

  const [formOpen, setFormOpen] = useState(false);

  const handleCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const handleEdit = (item: GlobalContent) => {
    setEditing(item);
    setForm(item);
    setFormOpen(true);
  };

  const handleClose = () => {
    setFormOpen(false);
    setEditing(null);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      setError('Vui lòng nhập đầy đủ tiêu đề và nội dung');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editing?.id) {
        await adminApi.updateGlobalContent(editing.id, form);
      } else {
        await adminApi.createGlobalContent(form);
      }
      handleClose();
      fetchItems();
    } catch {
      setError('Lưu nội dung thất bại');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (item: GlobalContent) => {
    if (!item.id) return;
    try {
      await adminApi.updateGlobalContent(item.id, { ...item, active: !item.active });
      fetchItems();
    } catch {
      setError('Cập nhật trạng thái thất bại');
    }
  };

  return (
    <DashboardLayout navItems={navItems} title="Quản lý nội dung">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Nội dung toàn cục</h2>
          <p className="text-gray-500 text-sm mt-1">Quản lý thông báo và cấu hình hiển thị toàn hệ thống</p>
        </div>
        <button onClick={handleCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Thêm nội dung
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-600 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>}

      {loading ? (
        <div className="text-center py-16"><Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto" /></div>
      ) : items.length === 0 ? (
        <div className="card text-center py-16">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-200" />
          <p className="text-gray-400">Chưa có nội dung nào</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map(item => (
            <div key={item.id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">{item.title}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700">
                      {typeLabels[item.contentType]}
                    </span>
                    <span className={item.active ? 'badge-green' : 'badge-red'}>
                      {item.active ? 'Đang hiển thị' : 'Đã ẩn'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 whitespace-pre-wrap">{item.content}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => handleEdit(item)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => toggleActive(item)} className="text-xs text-green-600 hover:underline whitespace-nowrap">
                    {item.active ? 'Ẩn' : 'Hiện'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {formOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full">
            <h3 className="font-bold text-lg mb-4">{editing ? 'Sửa nội dung' : 'Thêm nội dung'}</h3>
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Tiêu đề</label>
                <input
                  className="input w-full"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Loại</label>
                <select
                  className="input w-full"
                  value={form.contentType}
                  onChange={e => setForm({ ...form, contentType: e.target.value as GlobalContent['contentType'] })}
                >
                  <option value="ANNOUNCEMENT">Thông báo</option>
                  <option value="CONFIG">Cấu hình</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Nội dung</label>
                <textarea
                  className="input w-full min-h-[120px]"
                  value={form.content}
                  onChange={e => setForm({ ...form, content: e.target.value })}
                />
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.active ?? true}
                  onChange={e => setForm({ ...form, active: e.target.checked })}
                />
                Hiển thị ngay
              </label>
            </div>
            <div className="flex gap-2">
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
                {saving ? 'Đang lưu...' : 'Lưu'}
              </button>
              <button onClick={handleClose} className="btn-secondary flex-1">Hủy</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
