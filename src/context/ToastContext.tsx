import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
  HelpCircle,
} from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'success' | 'info';
}

export interface AlertOptions {
  title?: string;
  message: string;
  confirmText?: string;
  type?: ToastType;
}

interface ToastContextType {
  toasts: ToastItem[];
  showToast: (toast: Omit<ToastItem, 'id'>) => string;
  removeToast: (id: string) => void;
  success: (message: string, title?: string) => string;
  error: (message: string, title?: string) => string;
  warning: (message: string, title?: string) => string;
  info: (message: string, title?: string) => string;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  alert: (options: AlertOptions | string) => Promise<void>;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // State cho Confirm Dialog Modal
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    type: 'danger' | 'warning' | 'success' | 'info';
    resolve?: (val: boolean) => void;
  }>({
    isOpen: false,
    title: 'Xác nhận',
    message: '',
    confirmText: 'Đồng ý',
    cancelText: 'Hủy',
    type: 'warning',
  });

  // State cho Alert Modal (thay thế window.alert)
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    type: ToastType;
    resolve?: () => void;
  }>({
    isOpen: false,
    title: 'Thông báo',
    message: '',
    confirmText: 'Đã hiểu',
    type: 'info',
  });

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type, title, message, duration = 4500 }: Omit<ToastItem, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9) + Date.now();
      const newToast: ToastItem = { id, type, title, message, duration };

      setToasts(prev => [newToast, ...prev.slice(0, 4)]); // tối đa 5 toast cùng lúc

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [removeToast]
  );

  const success = useCallback(
    (message: string, title?: string) => showToast({ type: 'success', message, title }),
    [showToast]
  );

  const error = useCallback(
    (message: string, title?: string) => showToast({ type: 'error', message, title }),
    [showToast]
  );

  const warning = useCallback(
    (message: string, title?: string) => showToast({ type: 'warning', message, title }),
    [showToast]
  );

  const info = useCallback(
    (message: string, title?: string) => showToast({ type: 'info', message, title }),
    [showToast]
  );

  // Custom confirm dialog (trả về Promise<boolean>)
  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>(resolve => {
      setConfirmDialog({
        isOpen: true,
        title: options.title || 'Xác nhận thao tác',
        message: options.message,
        confirmText: options.confirmText || 'Đồng ý',
        cancelText: options.cancelText || 'Hủy bỏ',
        type: options.type || 'warning',
        resolve,
      });
    });
  }, []);

  // Custom alert modal (thay thế window.alert)
  const customAlert = useCallback((options: AlertOptions | string): Promise<void> => {
    return new Promise<void>(resolve => {
      if (typeof options === 'string') {
        setAlertModal({
          isOpen: true,
          title: 'Thông báo',
          message: options,
          confirmText: 'Đã hiểu',
          type: 'info',
          resolve,
        });
      } else {
        setAlertModal({
          isOpen: true,
          title: options.title || 'Thông báo',
          message: options.message,
          confirmText: options.confirmText || 'Đồng ý',
          type: options.type || 'info',
          resolve,
        });
      }
    });
  }, []);

  const handleConfirmClose = (result: boolean) => {
    if (confirmDialog.resolve) {
      confirmDialog.resolve(result);
    }
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
  };

  const handleAlertClose = () => {
    if (alertModal.resolve) {
      alertModal.resolve();
    }
    setAlertModal(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        removeToast,
        success,
        error,
        warning,
        info,
        confirm,
        alert: customAlert,
      }}
    >
      {children}

      {/* TOAST CONTAINER: góc trên bên phải */}
      <div className="fixed top-5 right-5 z-[99999] flex flex-col gap-3 pointer-events-none max-w-sm sm:max-w-md w-full px-3">
        {toasts.map(toast => {
          let bgClass = 'bg-white border-gray-100 text-gray-800';
          let iconColor = 'text-green-600';
          let IconComponent = CheckCircle2;
          let badgeLabel = 'Thành công';

          if (toast.type === 'success') {
            bgClass = 'bg-emerald-50/95 border-emerald-200 text-emerald-950 shadow-emerald-900/10';
            iconColor = 'text-emerald-600 bg-emerald-100';
            IconComponent = CheckCircle2;
            badgeLabel = toast.title || 'Thành công';
          } else if (toast.type === 'error') {
            bgClass = 'bg-rose-50/95 border-rose-200 text-rose-950 shadow-rose-900/10';
            iconColor = 'text-rose-600 bg-rose-100';
            IconComponent = AlertCircle;
            badgeLabel = toast.title || 'Lỗi xử lý';
          } else if (toast.type === 'warning') {
            bgClass = 'bg-amber-50/95 border-amber-200 text-amber-950 shadow-amber-900/10';
            iconColor = 'text-amber-600 bg-amber-100';
            IconComponent = AlertTriangle;
            badgeLabel = toast.title || 'Cảnh báo';
          } else {
            bgClass = 'bg-blue-50/95 border-blue-200 text-blue-950 shadow-blue-900/10';
            iconColor = 'text-blue-600 bg-blue-100';
            IconComponent = Info;
            badgeLabel = toast.title || 'Thông tin';
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto rounded-2xl border p-4 shadow-xl backdrop-blur-md transition-all duration-300 transform translate-y-0 opacity-100 flex items-start gap-3.5 relative overflow-hidden ${bgClass}`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${iconColor}`}
              >
                <IconComponent className="w-5 h-5" />
              </div>

              <div className="flex-1 min-w-0 pr-6">
                <div className="font-bold text-xs uppercase tracking-wider mb-0.5 opacity-90">
                  {badgeLabel}
                </div>
                <p className="text-sm font-medium leading-snug break-words whitespace-pre-line">
                  {toast.message}
                </p>
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                className="absolute top-3 right-3 p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-black/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* CONFIRMATION DIALOG MODAL */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[999999] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 transform animate-in zoom-in-95 duration-150 relative overflow-hidden">
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                  confirmDialog.type === 'danger'
                    ? 'bg-rose-100 text-rose-600'
                    : confirmDialog.type === 'warning'
                    ? 'bg-amber-100 text-amber-600'
                    : 'bg-emerald-100 text-emerald-600'
                }`}
              >
                {confirmDialog.type === 'danger' ? (
                  <AlertCircle className="w-6 h-6" />
                ) : confirmDialog.type === 'warning' ? (
                  <AlertTriangle className="w-6 h-6" />
                ) : (
                  <HelpCircle className="w-6 h-6" />
                )}
              </div>

              <div className="flex-1 min-w-0 space-y-1.5">
                <h3 className="text-base font-bold text-gray-900">
                  {confirmDialog.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                  {confirmDialog.message}
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={() => handleConfirmClose(false)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold text-xs hover:bg-gray-50 transition-colors"
              >
                {confirmDialog.cancelText}
              </button>
              <button
                type="button"
                onClick={() => handleConfirmClose(true)}
                className={`px-5 py-2.5 rounded-xl text-white font-semibold text-xs shadow-md transition-all ${
                  confirmDialog.type === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                    : confirmDialog.type === 'warning'
                    ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                    : 'bg-green-600 hover:bg-green-700 shadow-green-600/20'
                }`}
              >
                {confirmDialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ALERT DIALOG MODAL */}
      {alertModal.isOpen && (
        <div className="fixed inset-0 z-[999999] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 transform animate-in zoom-in-95 duration-150 relative overflow-hidden">
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                  alertModal.type === 'error'
                    ? 'bg-rose-100 text-rose-600'
                    : alertModal.type === 'warning'
                    ? 'bg-amber-100 text-amber-600'
                    : alertModal.type === 'success'
                    ? 'bg-emerald-100 text-emerald-600'
                    : 'bg-blue-100 text-blue-600'
                }`}
              >
                {alertModal.type === 'error' ? (
                  <AlertCircle className="w-6 h-6" />
                ) : alertModal.type === 'warning' ? (
                  <AlertTriangle className="w-6 h-6" />
                ) : alertModal.type === 'success' ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  <Info className="w-6 h-6" />
                )}
              </div>

              <div className="flex-1 min-w-0 space-y-1.5">
                <h3 className="text-base font-bold text-gray-900">
                  {alertModal.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                  {alertModal.message}
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={handleAlertClose}
                className="px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-xs shadow-md shadow-green-600/20 transition-all"
              >
                {alertModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
