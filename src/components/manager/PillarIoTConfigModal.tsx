import { useMemo, useState } from 'react';
import { Cpu, Loader2, Plus, Trash2, X, Package, PackagePlus } from 'lucide-react';
import clsx from 'clsx';
import { equipmentApi, Equipment, PillarEquipmentBinding } from '../../api/equipmentApi';

interface PillarIoTConfigModalProps {
  pillar: { id: number; pillarCode: string; locationId: number };
  equipments: Equipment[];
  onClose: () => void;
  onSaved: () => void;
}

type RowMode = 'stock' | 'new';

interface DeviceRow {
  key: number;
  mode: RowMode;
  equipmentId?: number;
  newEquipmentName: string;
  newSerialNumber: string;
  quantity: number;
}

const createRow = (key: number, mode: RowMode): DeviceRow => ({
  key,
  mode,
  equipmentId: undefined,
  newEquipmentName: '',
  newSerialNumber: '',
  quantity: 1,
});

export default function PillarIoTConfigModal({ pillar, equipments, onClose, onSaved }: PillarIoTConfigModalProps) {
  const installedDevices = useMemo(
    () => equipments.filter(eq => eq.pillarId === pillar.id),
    [equipments, pillar.id]
  );

  // Kho sẵn sàng: thiết bị AVAILABLE, còn hàng, chưa gắn trụ,
  // thuộc đúng cơ sở của trụ hoặc kho chung "Tất cả cơ sở" (không gắn cơ sở)
  const stockItems = useMemo(
    () => equipments.filter(eq =>
      !eq.pillarId &&
      (!eq.status || eq.status.toUpperCase() === 'AVAILABLE') &&
      (eq.quantity == null || eq.quantity > 0) &&
      (eq.locationId == null || eq.locationId === pillar.locationId)
    ),
    [equipments, pillar.locationId]
  );

  const [rows, setRows] = useState<DeviceRow[]>([createRow(1, 'stock')]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const updateRow = (key: number, patch: Partial<DeviceRow>) =>
    setRows(prev => prev.map(r => (r.key === key ? { ...r, ...patch } : r)));

  const addRow = () =>
    setRows(prev => [...prev, createRow(Date.now(), 'stock')]);

  const removeRow = (key: number) => setRows(prev => prev.filter(r => r.key !== key));

  const getStock = (equipmentId?: number) => {
    const item = stockItems.find(s => s.id === equipmentId);
    return item ? (item.quantity ?? 1) : 0;
  };

  const validate = (): string | null => {
    if (rows.length === 0) return 'Vui lòng thêm ít nhất 1 thiết bị.';
    const takenByStockId = new Map<number, number>();
    for (const row of rows) {
      if (row.quantity < 1) return 'Số lượng mỗi thiết bị phải từ 1 trở lên.';
      if (row.mode === 'stock') {
        if (!row.equipmentId) return 'Vui lòng chọn thiết bị từ kho cho tất cả các dòng.';
        takenByStockId.set(row.equipmentId, (takenByStockId.get(row.equipmentId) ?? 0) + row.quantity);
        continue;
      }
      if (!row.newSerialNumber.trim()) return 'Thiết bị khai báo mới bắt buộc phải có Mã Serial.';
    }
    for (const [equipmentId, taken] of takenByStockId) {
      const stock = getStock(equipmentId);
      if (taken > stock) {
        const name = stockItems.find(s => s.id === equipmentId)?.equipmentName;
        return `Thiết bị "${name}" trong kho chỉ còn ${stock} cái, bạn đang lấy ${taken} cái.`;
      }
    }
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    const payload: PillarEquipmentBinding[] = rows.map(row =>
      row.mode === 'stock'
        ? { equipmentId: row.equipmentId, quantity: row.quantity }
        : { newEquipmentName: row.newEquipmentName.trim(), newSerialNumber: row.newSerialNumber.trim(), quantity: row.quantity }
    );
    setError('');
    setSubmitting(true);
    try {
      await equipmentApi.bindToPillar(pillar.id, payload);
      onSaved();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Gắn thiết bị IoT thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg">
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-indigo-600" /> Cấu hình IoT cho trụ {pillar.pillarCode}
        </h2>
        <p className="text-xs text-gray-500 mb-4">
          Gắn trọn bộ thiết bị IoT (Mạch ESP32, cảm biến độ ẩm, pH, rơ-le bơm...) vào trụ. Có thể lấy từ kho hoặc khai báo thiết bị mới nếu kho chưa có.
        </p>

        {/* Thiết bị đã gắn */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-4">
          <div className="text-xs font-semibold text-gray-700 mb-2">
            Thiết bị đang gắn trên trụ ({installedDevices.length}):
          </div>
          {installedDevices.length === 0 ? (
            <div className="text-[11px] text-rose-600 font-medium">⚠️ Trụ này chưa gắn thiết bị IoT nào.</div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {installedDevices.map(eq => (
                <span key={eq.id} className="text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full font-medium">
                  {eq.equipmentName} · {eq.serialNumber || 'N/A'} · x{eq.quantity ?? 1}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Danh sách thiết bị cần gắn thêm */}
        <div className="space-y-3">
          {rows.map((row, idx) => (
            <div key={row.key} className="border border-gray-200 rounded-xl p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-800">Thiết bị #{idx + 1}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => updateRow(row.key, { mode: 'stock' })}
                    className={clsx(
                      'text-[11px] px-2 py-1 rounded-lg font-semibold flex items-center gap-1 border transition',
                      row.mode === 'stock' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-white text-gray-500 border-gray-200'
                    )}
                  >
                    <Package className="w-3.5 h-3.5" /> Lấy từ kho
                  </button>
                  <button
                    type="button"
                    onClick={() => updateRow(row.key, { mode: 'new' })}
                    className={clsx(
                      'text-[11px] px-2 py-1 rounded-lg font-semibold flex items-center gap-1 border transition',
                      row.mode === 'new' ? 'bg-amber-50 text-amber-700 border-amber-300' : 'bg-white text-gray-500 border-gray-200'
                    )}
                  >
                    <PackagePlus className="w-3.5 h-3.5" /> Khai báo mới
                  </button>
                  {rows.length > 1 && (
                    <button type="button" onClick={() => removeRow(row.key)} className="p-1 text-gray-400 hover:text-red-600" title="Bỏ dòng này">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {row.mode === 'stock' ? (
                stockItems.length === 0 ? (
                  <div className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
                    Kho hiện không có thiết bị trống. Vui lòng bấm <strong>"Khai báo mới"</strong> để nhập mã Serial thiết bị.
                  </div>
                ) : (
                  <div className="space-y-2">
                    <select
                      value={row.equipmentId ?? ''}
                      onChange={e => updateRow(row.key, { equipmentId: e.target.value ? Number(e.target.value) : undefined, quantity: 1 })}
                      className="w-full text-xs border border-gray-300 rounded-lg p-2 bg-white outline-none focus:border-emerald-500"
                    >
                      <option value="">-- Chọn thiết bị IoT từ kho --</option>
                      {stockItems.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.equipmentName} (Tồn kho: {s.quantity ?? 1} cái/bộ) (SN: {s.serialNumber || 'N/A'}) {s.locationId == null ? '- 🌐 Tất cả cơ sở' : s.locationName ? `- ${s.locationName}` : ''}
                        </option>
                      ))}
                    </select>

                    {row.equipmentId && (() => {
                      const stock = getStock(row.equipmentId);
                      return (
                        <div className="p-2 bg-emerald-50/70 border border-emerald-200 rounded-lg flex items-center gap-2 flex-wrap">
                          <label className="text-[11px] font-bold text-gray-700 whitespace-nowrap">
                            Số lượng lấy: <span className="text-rose-500">*</span>
                          </label>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => updateRow(row.key, { quantity: Math.max(1, row.quantity - 1) })}
                              disabled={row.quantity <= 1}
                              className="w-7 h-7 bg-white hover:bg-gray-100 disabled:opacity-40 border border-gray-300 rounded-md font-bold text-sm flex items-center justify-center"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min={1}
                              max={stock}
                              value={row.quantity}
                              onChange={e => updateRow(row.key, { quantity: Math.min(stock, Math.max(1, parseInt(e.target.value) || 1)) })}
                              className="w-14 text-xs font-bold text-center border border-gray-300 rounded-md p-1.5 outline-none focus:border-emerald-500 bg-white"
                            />
                            <button
                              type="button"
                              onClick={() => updateRow(row.key, { quantity: Math.min(stock, row.quantity + 1) })}
                              disabled={row.quantity >= stock}
                              className="w-7 h-7 bg-white hover:bg-gray-100 disabled:opacity-40 border border-gray-300 rounded-md font-bold text-sm flex items-center justify-center"
                            >
                              +
                            </button>
                          </div>
                          <span className="text-[11px] text-gray-600 font-medium">
                            (Tối đa trong kho: <strong className="text-emerald-800">{stock}</strong> cái/bộ)
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                )
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_110px] gap-2">
                  <input
                    type="text"
                    value={row.newEquipmentName}
                    onChange={e => updateRow(row.key, { newEquipmentName: e.target.value })}
                    placeholder="Tên: Cảm biến độ ẩm đất"
                    className="w-full text-xs border border-gray-300 rounded-lg p-2 outline-none focus:border-amber-500"
                  />
                  <input
                    type="text"
                    value={row.newSerialNumber}
                    onChange={e => updateRow(row.key, { newSerialNumber: e.target.value })}
                    placeholder="Serial *: ESP32-P01"
                    className="w-full text-xs border border-gray-300 rounded-lg p-2 font-mono uppercase outline-none focus:border-amber-500"
                  />
                  <input
                    type="number"
                    min={1}
                    value={row.quantity}
                    onChange={e => updateRow(row.key, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                    className="w-full text-xs border border-gray-300 rounded-lg p-2 text-center outline-none focus:border-amber-500"
                    placeholder="SL"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addRow}
          className="w-full mt-3 py-2 border-2 border-dashed border-gray-300 hover:border-indigo-500 hover:bg-indigo-50/50 rounded-xl text-xs font-semibold text-gray-600 hover:text-indigo-700 transition flex items-center justify-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" /> Thêm thiết bị khác cho trụ {pillar.pillarCode} (Cảm biến, Mạch, Rơ-le...)
        </button>

        {error && (
          <div className="mt-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5">⚠️ {error}</div>
        )}

        <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-gray-100">
          <button type="button" onClick={onClose} disabled={submitting} className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium text-sm">
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm flex items-center gap-2 disabled:opacity-50"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Gắn {rows.length} thiết bị vào trụ
          </button>
        </div>
      </div>
    </div>
  );
}
