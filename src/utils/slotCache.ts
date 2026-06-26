const SLOT_CACHE_KEY = 'greenslot_slot_id_cache';

type SlotCache = Record<string, number>;

function readCache(): SlotCache {
  try {
    return JSON.parse(localStorage.getItem(SLOT_CACHE_KEY) || '{}');
  } catch {
    return {};
  }
}

/** Lưu mapping slotNumber → slotId khi user đặt thuê (BE history không trả slotId). */
export function cacheSlotId(slotNumber: string, slotId: number) {
  const cache = readCache();
  cache[slotNumber] = slotId;
  localStorage.setItem(SLOT_CACHE_KEY, JSON.stringify(cache));
}

export function getCachedSlotId(slotNumber: string): number | undefined {
  return readCache()[slotNumber];
}

export function resolveSlotId(slotNumber: string, rentalId?: number): number | undefined {
  const cached = getCachedSlotId(slotNumber);
  if (cached) return cached;
  if (rentalId) {
    const byRental = readCache()[`rental:${rentalId}`];
    if (byRental) return byRental;
  }
  return undefined;
}

export function cacheSlotForRental(rentalId: number, slotId: number) {
  const cache = readCache();
  cache[`rental:${rentalId}`] = slotId;
  localStorage.setItem(SLOT_CACHE_KEY, JSON.stringify(cache));
}
