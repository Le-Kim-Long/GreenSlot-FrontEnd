import { useState, useEffect } from 'react';
import { Plus, Edit2, X, Tag, Layers } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { managerApi } from '../../api/managerApi';
import { staffNavItems } from './staffNav';
import clsx from 'clsx';

interface ServiceCategory {
  id: number;
  name: string;
  categoryName?: string;
  description?: string;
}

interface ServiceType {
  id: number;
  name: string;
  serviceName?: string;
  description?: string;
  price?: number;
  serviceCategoryId?: number;
  categoryId?: number;
}

export default function ServiceManagement() {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [types, setTypes] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'categories' | 'types'>('categories');
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingCat, setEditingCat] = useState<ServiceCategory | null>(null);
  const [editingType, setEditingType] = useState<ServiceType | null>(null);
  const [catForm, setCatForm] = useState({ name: '', description: '' });
  const [typeForm, setTypeForm] = useState({ name: '', description: '', price: 0, serviceCategoryId: categories[0]?.id || 0 });

  const fetchData = async () => {
    try {
      const [c, t] = await Promise.all([managerApi.getServiceCategories(), managerApi.getServiceTypes()]);
      setCategories(c);
      setTypes(t);
    } catch {
      setError('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreateCat = () => {
    setEditingCat(null);
    setCatForm({ name: '', description: '' });
    setShowForm(true);
  };

  const openEditCat = (c: ServiceCategory) => {
    setEditingCat(c);
    setCatForm({ name: c.name, description: c.description || '' });
    setShowForm(true);
  };

  const openCreateType = () => {
    setEditingType(null);
    setFormError('');
    setTypeForm({ name: '', description: '', price: 0, serviceCategoryId: categories[0]?.id || 0 });
    setShowForm(true);
  };

  const openEditType = (t: ServiceType) => {
    setEditingType(t);
    setFormError('');
    setTypeForm({
      name: t.name || t.serviceName || '',
      description: t.description || '',
      price: t.price || 0,
      serviceCategoryId: t.serviceCategoryId || t.categoryId || categories[0]?.id || 0,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingCat(null);
    setEditingType(null);
    setFormError('');
  };

  const handleSubmitCat = async () => {
    if (!catForm.name) return;
    setSaving(true);
    try {
      if (editingCat) {
        await managerApi.updateServiceCategory(editingCat.id, catForm);
      } else {
        await managerApi.createServiceCategory(catForm);
      }
      closeForm();
      fetchData();
    } catch {
      setError('Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitType = async () => {
    if (!typeForm.name?.trim() || !typeForm.serviceCategoryId || typeForm.serviceCategoryId === 0) {
      setFormError('Vui lòng nhập tên dịch vụ và chọn danh mục.');
      return;
    }

    setSaving(true);
    try {
      if (editingType) {
        await managerApi.updateServiceType(editingType.id, typeForm);
      } else {
        await managerApi.createServiceType(typeForm);
      }
      closeForm();
      fetchData();
    } catch {
      setError('Lưu thất bại. Vui lòng kiểm tra dữ liệu và thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const getCatName = (id?: number) => categories.find(c => c.id === id)?.name || categories.find(c => c.id === id)?.categoryName || '';

  return (
    <DashboardLayout navItems={staffNavItems} title="Quản lý Dịch vụ">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          <button onClick={() => setActiveTab('categories')} className={clsx('px-4 py-2 rounded-md text-sm font-medium transition-all', activeTab === 'categories' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500')}>
            <Layers className="w-4 h-4 inline mr-1.5" />Danh mục ({categories.length})
          </button>
          <button onClick={() => setActiveTab('types')} className={clsx('px-4 py-2 rounded-md text-sm font-medium transition-all', activeTab === 'types' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500')}>
            <Tag className="w-4 h-4 inline mr-1.5" />Loại DV ({types.length})
          </button>
        </div>
        <button onClick={activeTab === 'categories' ? openCreateCat : openCreateType} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Thêm {activeTab === 'categories' ? 'danh mục' : 'loại DV'}
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-600 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Đang tải...</div>
      ) : activeTab === 'categories' ? (
        categories.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Layers className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Chưa có danh mục dịch vụ</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(c => (
              <div key={c.id} className="card hover:border-green-200 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Layers className="w-5 h-5 text-orange-600" />
                  </div>
                  <button onClick={() => openEditCat(c)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-green-600">
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="font-bold text-gray-900 mb-1">{c.name || c.categoryName}</h3>
                {c.description && <p className="text-sm text-gray-500">{c.description}</p>}
                <p className="text-xs text-gray-400 mt-2">{types.filter(t => t.serviceCategoryId === c.id).length} loại dịch vụ</p>
              </div>
            ))}
          </div>
        )
      ) : (
        types.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Tag className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Chưa có loại dịch vụ</p>
          </div>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100 text-xs uppercase tracking-wider">
                  <th className="pb-3 font-medium">Tên</th>
                  <th className="pb-3 font-medium">Danh mục</th>
                  <th className="pb-3 font-medium">Giá</th>
                  <th className="pb-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {types.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="py-3">
                      <div className="font-semibold text-gray-900">{t.name || t.serviceName}</div>
                      {t.description && <div className="text-xs text-gray-400 mt-0.5">{t.description}</div>}
                    </td>
                    <td className="py-3 text-gray-600">{getCatName(t.serviceCategoryId)}</td>
                    <td className="py-3 font-semibold text-green-600">{t.price?.toLocaleString('vi-VN')}đ</td>
                    <td className="py-3">
                      <button onClick={() => openEditType(t)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-green-600">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Category form */}
      {showForm && activeTab === 'categories' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">{editingCat ? 'Sửa danh mục' : 'Thêm danh mục'}</h2>
              <button onClick={closeForm} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Tên danh mục *</label>
                <input className="input" value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} placeholder="VD: Chăm sóc cây" />
              </div>
              <div>
                <label className="label">Mô tả</label>
                <textarea className="input" rows={3} value={catForm.description} onChange={e => setCatForm(f => ({ ...f, description: e.target.value }))} placeholder="Mô tả danh mục" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleSubmitCat} disabled={saving} className="btn-primary flex-1 py-2.5">
                  {saving ? 'Đang lưu...' : editingCat ? 'Cập nhật' : 'Tạo mới'}
                </button>
                <button onClick={closeForm} className="btn-secondary px-4">Hủy</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Type form */}
      {showForm && activeTab === 'types' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">{editingType ? 'Sửa loại DV' : 'Thêm loại DV'}</h2>
              <button onClick={closeForm} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Tên *</label>
                <input className="input" value={typeForm.name} onChange={e => setTypeForm(f => ({ ...f, name: e.target.value }))} placeholder="VD: Tưới cây tự động" />
              </div>
              <div>
                <label className="label">Danh mục *</label>
                <select className="input" value={typeForm.serviceCategoryId} onChange={e => setTypeForm(f => ({ ...f, serviceCategoryId: Number(e.target.value) }))}>
                  {categories.length > 0 ? (
                    <>
                      <option value={0} disabled>Chọn danh mục</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name || c.categoryName}</option>)}
                    </>
                  ) : (
                    <option value={0} disabled>Chưa có danh mục</option>
                  )}
                </select>
              </div>
              <div>
                <label className="label">Giá (VNĐ)</label>
                <input type="number" className="input" value={typeForm.price} onChange={e => setTypeForm(f => ({ ...f, price: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="label">Mô tả</label>
                <textarea className="input" rows={3} value={typeForm.description} onChange={e => setTypeForm(f => ({ ...f, description: e.target.value }))} placeholder="Mô tả dịch vụ" />
              </div>
              {formError && <div className="text-sm text-red-600 mb-2">{formError}</div>}
              <div className="flex gap-3 pt-2">
                <button onClick={handleSubmitType} disabled={saving} className="btn-primary flex-1 py-2.5">
                  {saving ? 'Đang lưu...' : editingType ? 'Cập nhật' : 'Tạo mới'}
                </button>
                <button onClick={closeForm} className="btn-secondary px-4">Hủy</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
