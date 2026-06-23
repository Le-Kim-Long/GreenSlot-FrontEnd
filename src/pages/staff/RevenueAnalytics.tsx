import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import DashboardLayout from '../../components/common/DashboardLayout';
import { managerApi } from '../../api/managerApi';
import { staffNavItems } from './staffNav';

interface RevenueData {
  totalRevenue: number;
  dailyBreakdown: { date: string; revenue: number }[];
  transactions: { id: number; amount: number; date: string; description?: string }[];
}

export default function RevenueAnalytics() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const now = new Date();
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(now.getFullYear(), now.getMonth(), 1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => now.toISOString().split('T')[0]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await managerApi.getRevenue(startDate, endDate);
      setData(result);
    } catch {
      setError('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [startDate, endDate]);

  return (
    <DashboardLayout navItems={staffNavItems} title="Phân tích Doanh thu">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <input type="date" className="input" value={startDate} onChange={e => setStartDate(e.target.value)} />
          <span className="text-gray-400">—</span>
          <input type="date" className="input" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-600 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Đang tải...</div>
      ) : data ? (
        <>
          {/* Total */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Tổng doanh thu</div>
                  <div className="text-2xl font-black text-gray-900">{data.totalRevenue.toLocaleString('vi-VN')}đ</div>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Số giao dịch</div>
                  <div className="text-2xl font-black text-gray-900">{data.transactions.length}</div>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Ngày có doanh thu</div>
                  <div className="text-2xl font-black text-gray-900">{data.dailyBreakdown.length}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Chart */}
          {data.dailyBreakdown.length > 0 ? (
            <div className="card mb-6">
              <h3 className="font-bold text-gray-900 text-lg mb-4">Doanh thu theo ngày</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.dailyBreakdown} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => [`${v.toLocaleString('vi-VN')}đ`, 'Doanh thu']} />
                  <Bar dataKey="revenue" fill="#16a34a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="card mb-6 text-center py-12 text-gray-400">
              <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Chưa có doanh thu trong khoảng thời gian này</p>
            </div>
          )}

          {/* Transactions */}
          {data.transactions.length > 0 && (
            <div className="card">
              <h3 className="font-bold text-gray-900 text-lg mb-4">Giao dịch</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-gray-100 text-xs uppercase tracking-wider">
                      <th className="pb-3 font-medium">ID</th>
                      <th className="pb-3 font-medium">Ngày</th>
                      <th className="pb-3 font-medium">Mô tả</th>
                      <th className="pb-3 font-medium text-right">Số tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.transactions.map(t => (
                      <tr key={t.id} className="hover:bg-gray-50">
                        <td className="py-3 font-medium">#{t.id}</td>
                        <td className="py-3 text-gray-600">{t.date}</td>
                        <td className="py-3 text-gray-600">{t.description || '-'}</td>
                        <td className="py-3 text-right font-semibold text-green-600">{t.amount.toLocaleString('vi-VN')}đ</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : null}
    </DashboardLayout>
  );
}
