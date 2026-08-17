import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, X } from 'lucide-react';
import clsx from 'clsx';

export type ToastType = 'success' | 'error' | 'warning';

export interface ToastData {
  type: ToastType;
  title: string;
  detail?: string;
}

const STYLES: Record<ToastType, { icon: any; border: string; iconBg: string; iconColor: string }> = {
  success: { icon: CheckCircle2, border: 'border-green-100', iconBg: 'bg-green-100', iconColor: 'text-green-600' },
  error: { icon: XCircle, border: 'border-red-100', iconBg: 'bg-red-100', iconColor: 'text-red-600' },
  warning: { icon: AlertTriangle, border: 'border-amber-100', iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
};

export function Toast({ toast, onClose }: { toast: ToastData; onClose: () => void }) {
  const [visible, setVisible] = useState(false);
  const { icon: Icon, border, iconBg, iconColor } = STYLES[toast.type];

  useEffect(() => {
    const showTimer = setTimeout(() => setVisible(true), 10);
    const hideTimer = setTimeout(() => setVisible(false), 4200);
    const closeTimer = setTimeout(onClose, 4500);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
      clearTimeout(closeTimer);
    };
  }, [toast, onClose]);

  return (
    <div
      className={clsx(
        'fixed top-6 right-6 z-[100] w-full max-w-sm bg-white rounded-2xl shadow-2xl border p-4 flex gap-3 transition-all duration-300 ease-out',
        border,
        visible ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
      )}
    >
      <div className={clsx('w-8 h-8 rounded-full flex items-center justify-center shrink-0', iconBg)}>
        <Icon className={clsx('w-5 h-5', iconColor)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm">{toast.title}</p>
        {toast.detail && (
          <p className="text-xs text-gray-500 mt-1 whitespace-pre-line break-words">{toast.detail}</p>
        )}
      </div>
      <button
        onClick={() => setVisible(false)}
        className="text-gray-300 hover:text-gray-500 transition shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
