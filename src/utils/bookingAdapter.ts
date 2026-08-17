import type { BookingHistory, RentalHistoryDTO } from '../types/api';

function formatDate(iso: string | undefined): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('vi-VN');
}

export function mapRentalHistory(dto: RentalHistoryDTO): BookingHistory {
  const paidTx = dto.transactions?.find(t => t.status === 'SUCCESS' || t.status === 'PAID');
  const latestTx = dto.transactions?.[0];
  
  // Chỉ cộng tổng các giao dịch ĐÃ THANH TOÁN THÀNH CÔNG (SUCCESS/PAID).
  // Nếu hợp đồng mới tạo chưa có giao dịch SUCCESS (ví dụ: PENDING booking), dùng số tiền của giao dịch ban đầu.
  const paidTransactions = dto.transactions?.filter(t => t.status === 'SUCCESS' || t.status === 'PAID') ?? [];
  const totalPrice = paidTransactions.length > 0
    ? paidTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
    : (Number(latestTx?.amount) || 0);

  let computedStatus = dto.rentalStatus;
  if (computedStatus === 'ACTIVE' && dto.endTime) {
    const isExpired = new Date(dto.endTime) < new Date();
    if (isExpired) {
      computedStatus = 'EXPIRED';
    }
  }

  return {
    id: dto.rentalId,
    slotId: dto.slotId,
    slotNumber: dto.slotNumber,
    pillarCode: dto.pillarCode,
    locationName: dto.locationName,
    locationAddress: dto.locationAddress,
    startDate: formatDate(dto.startTime),
    endDate: formatDate(dto.endTime),
    startTime: dto.startTime,
    endTime: dto.endTime,
    totalPrice,
    status: computedStatus,
    paymentStatus: paidTx?.status || latestTx?.status,
    transactions: dto.transactions ?? [],
    treeName: dto.treeName,
    harvestNotifiedAt: dto.harvestNotifiedAt,
    harvestDecision: dto.harvestDecision,
  };
}

export function mapRentalHistoryList(list: RentalHistoryDTO[]): BookingHistory[] {
  return (list ?? []).map(mapRentalHistory);
}
