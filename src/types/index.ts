export type ShiftCode = 'N' | 'M' | 'E' | 'O' | 'MOT' | 'NOT' | 'AL' | 'CTR' | 'CG' | 'EL' | 'TR' | 'MT' | 'MC';
export interface User {
  id: string;
  username: string;
  email?: string;
  full_name: string;
  grade: 'PP4' | 'PP6' | string;
  phone?: string | null;
  is_admin: boolean;
  is_active?: boolean;
  created_at?: string;
}
export const SHIFT_INFO: Record<ShiftCode, { label: string; color: string; textColor: string }> = {
  N:   { label: 'Night',        color: '#1f2937', textColor: '#f3f4f6' },
  M:   { label: 'Morning',      color: '#dbeafe', textColor: '#1e3a8a' },
  E:   { label: 'Evening',      color: '#fee2e2', textColor: '#991b1b' },
  O:   { label: 'Off',          color: '#f3f4f6', textColor: '#374151' },
  MOT: { label: 'Morning OT',   color: '#e0f2fe', textColor: '#075985' },
  NOT: { label: 'Night OT',     color: '#111827', textColor: '#f9fafb' },
  AL:  { label: 'Annual Leave', color: '#fef9c3', textColor: '#92400e' },
  CTR: { label: 'Control Room', color: '#ede9fe', textColor: '#5b21b6' },
  CG:  { label: 'Call G',       color: '#dcfce7', textColor: '#065f46' },
  EL:  { label: 'Emergency Lv', color: '#ffe4e6', textColor: '#9f1239' },
  TR:  { label: 'Training',     color: '#cffafe', textColor: '#155e75' },
  MT:  { label: 'Meeting',      color: '#fae8ff', textColor: '#86198f' },
  MC:  { label: 'Medical',      color: '#fee2e2', textColor: '#7f1d1d' },
};
export const DEFAULT_PATTERN: ShiftCode[] = ['N','N','N','O','O','E','E','E','O','O','M','M','M','O','O'];
