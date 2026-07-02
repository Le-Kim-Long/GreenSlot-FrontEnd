import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Receipt, ArrowLeft, Home } from 'lucide-react';
import { bookingApi } from '../../api/bookingApi';

export default function PaymentResultPage() {
  const [searchParams] = useSearchParams();

  const responseCode = searchParams.get('vnp_ResponseCode');
  const transactionStatus = searchParams.get('vnp_TransactionStatus');
  const amount = searchParams.get('vnp_Amount');
  const txnRef = searchParams.get('vnp_TxnRef');
  const orderInfo = searchParams.get('vnp_OrderInfo');
  const payDate = searchParams.get('vnp_PayDate');

  const success =
    responseCode === '00' &&
    (transactionStatus === '00' || transactionStatus === null);

  useEffect(() => {
    if (responseCode) {
      const query = window.location.search;
      bookingApi.notifyVnPayResult(query).catch(err => {
        console.error('Failed to notify VNPay result to backend:', err);
      });
    }
  }, [responseCode]);

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