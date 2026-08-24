import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Receipt, ArrowLeft, Home } from 'lucide-react';

export default function PaymentResultPage() {
  const [searchParams] = useSearchParams();

  const responseCode = searchParams.get('vnp_ResponseCode');
  const transactionStatus = searchParams.get('vnp_TransactionStatus');
  const amount = searchParams.get('vnp_Amount');
  const txnRef = searchParams.get('vnp_TxnRef');
  const orderInfo = searchParams.get('vnp_OrderInfo');
  const payDate = searchParams.get('vnp_PayDate');

  const isMobileClient =
    searchParams.get('client') === 'mobile' ||
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  useEffect(() => {
    // If opened from mobile, automatically and immediately redirect back to the native app
    if (isMobileClient) {
      const search = window.location.search;
      const appUrl = `greenslot://payment-result${search}`;
      try {
        window.location.replace(appUrl);
      } catch {
        window.location.href = appUrl;
      }
    }
  }, [isMobileClient, searchParams]);

  const success =
    responseCode === '00' &&
    (transactionStatus === '00' || transactionStatus === null);

  const formatAmount = () => {
    if (!amount) return '--';

    return (Number(amount) / 100).toLocaleString('vi-VN') + 'đ';
  };

  const formatDate = () => {
    if (!payDate || payDate.length !== 14) return '--';

    return `${payDate.slice(6, 8)}/${payDate.slice(4, 6)}/${payDate.slice(
      0,
      4
    )} ${payDate.slice(8, 10)}:${payDate.slice(
      10,
      12
    )}:${payDate.slice(12, 14)}`;
  };

  const handleOpenApp = () => {
    const search = window.location.search;
    const isAndroid = /Android/i.test(navigator.userAgent);
    const standardDeepLink = `greenslot://payment-result${search}`;
    const androidIntent = `intent://payment-result${search}#Intent;scheme=greenslot;package=com.greenslot.mobile;end`;
    const expoIntent = `intent://#Intent;package=host.exp.exponent;end`;

    if (isAndroid) {
      window.location.href = standardDeepLink;
      setTimeout(() => {
        window.location.href = androidIntent;
      }, 300);
      setTimeout(() => {
        window.location.href = expoIntent;
      }, 700);
    } else {
      window.location.href = standardDeepLink;
    }
  };

  // Dedicated Mobile Bridge View: Fast, clean, auto-returning to the Native App
  if (isMobileClient) {
    return (
      <div className="min-h-screen bg-emerald-50/50 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-sm w-full flex flex-col items-center border border-emerald-100">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-5 text-emerald-600">
            {success ? <CheckCircle2 className="w-12 h-12" /> : <XCircle className="w-12 h-12 text-red-500" />}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {success ? 'Thanh toán thành công!' : 'Thanh toán chưa hoàn tất'}
          </h2>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            Đang tự động chuyển bạn quay lại ứng dụng <strong>GreenSlot Mobile</strong>...
          </p>
          <button
            type="button"
            onClick={handleOpenApp}
            className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold py-4 px-6 rounded-2xl shadow-lg transition-all text-center block text-base cursor-pointer"
          >
            📱 Mở ứng dụng GreenSlot
          </button>
          <p className="text-xs text-gray-400 mt-4 leading-relaxed">
            Hoặc bạn có thể vuốt chuyển tab quay lại <strong>Expo Go / GreenSlot App</strong> để xem ô đất đã được cập nhật thành công.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-xl max-w-xl w-full p-8">

        <div className="flex justify-center mb-6">
          {success ? (
            <CheckCircle2 className="w-24 h-24 text-green-500" />
          ) : (
            <XCircle className="w-24 h-24 text-red-500" />
          )}
        </div>

        <h1 className="text-3xl font-bold text-center">
          {success
            ? 'Thanh toán thành công'
            : 'Thanh toán không thành công'}
        </h1>

        <p className="text-center text-gray-500 mt-3">
          {success
            ? 'Gia hạn thuê vườn của bạn đã được ghi nhận.'
            : 'Giao dịch chưa hoàn tất hoặc đã bị hủy.'}
        </p>

        <div className="mt-8 rounded-2xl border border-gray-200 divide-y">

          <div className="flex justify-between px-5 py-4">
            <span className="text-gray-500">Mã giao dịch</span>
            <span className="font-semibold">{txnRef ?? '--'}</span>
          </div>

          <div className="flex justify-between px-5 py-4">
            <span className="text-gray-500">Số tiền</span>
            <span className="font-semibold text-green-600">
              {formatAmount()}
            </span>
          </div>

          <div className="flex justify-between px-5 py-4">
            <span className="text-gray-500">Nội dung</span>
            <span className="font-semibold text-right">
              {orderInfo ?? '--'}
            </span>
          </div>

          <div className="flex justify-between px-5 py-4">
            <span className="text-gray-500">Thời gian</span>
            <span>{formatDate()}</span>
          </div>

          <div className="flex justify-between px-5 py-4">
            <span className="text-gray-500">Mã phản hồi</span>
            <span>{responseCode ?? '--'}</span>
          </div>

        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">

          {isMobileClient && (
            <a
              href={`greenslot://payment-result${window.location.search}`}
              className="btn-primary flex items-center justify-center gap-2 col-span-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md transition-all text-center"
            >
              📱 Mở ứng dụng GreenSlot Mobile
            </a>
          )}

          <Link
            to="/dashboard/customer/rentals"
            className="btn-primary flex items-center justify-center gap-2"
          >
            <Receipt className="w-4 h-4" />
            Vườn đang thuê
          </Link>

          <Link
            to="/"
            className="btn-outline-green flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Trang chủ
          </Link>

        </div>

        <div className="mt-5 text-center">

          <Link
            to="/dashboard/customer/payments"
            className="inline-flex items-center gap-2 text-green-600 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Xem lịch sử thanh toán
          </Link>

        </div>

      </div>
    </div>
  );
}