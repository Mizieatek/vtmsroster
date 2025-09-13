import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  CalendarDaysIcon, 
  ClockIcon,
  UserGroupIcon,
  BellIcon,
  ChartBarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { SHIFT_INFO, DEFAULT_PATTERN, type ShiftCode } from '../types';
import { supabase } from '../lib/supabase';

export default function Dashboard() {
  const { user } = useAuth();
  const [currentMonth] = useState(new Date());
  const [userShifts, setUserShifts] = useState<Record<string, ShiftCode>>({});
  const [exchangeRequests, setExchangeRequests] = useState({ sent: { pending: 0, approved: 0, rejected: 0 }, received: { pending: 0 } });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    // Load shifts for current user
    const { data: shifts } = await supabase
      .from('shifts')
      .select('date, shift_code')
      .eq('user_id', user!.id)
      .gte('date', format(monthStart, 'yyyy-MM-dd'))
      .lte('date', format(monthEnd, 'yyyy-MM-dd'));

    const map: Record<string, ShiftCode> = {};
    (shifts || []).forEach(s => { map[s.date] = s.shift_code as ShiftCode; });
    setUserShifts(map);

    // Load exchange counts
    const { data: sent } = await supabase
      .from('shift_exchanges')
      .select('status')
      .eq('requester_id', user!.id);
    const { data: received } = await supabase
      .from('shift_exchanges')
      .select('status')
      .eq('target_user_id', user!.id);

    const counts = { sent: { pending: 0, approved: 0, rejected: 0 }, received: { pending: 0 } };
    (sent || []).forEach(r => { counts.sent[r.status] = (counts.sent[r.status] || 0) + 1; });
    (received || []).forEach(r => { if (r.status === 'pending') counts.received.pending += 1; });
    setExchangeRequests(counts);
  };

  const getDaysInMonth = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    return eachDayOfInterval({ start: monthStart, end: monthEnd });
  };

  const stats = [
    { title: 'Permohonan Dihantar', value: exchangeRequests.sent.pending + exchangeRequests.sent.approved + exchangeRequests.sent.rejected, icon: ClockIcon, color: 'bg-blue-500' },
    { title: 'Permohonan Diterima', value: exchangeRequests.received.pending, icon: BellIcon, color: 'bg-orange-500', urgent: exchangeRequests.received.pending > 0 },
    { title: 'Syif Bulan Ini', value: Object.keys(userShifts).length, icon: CalendarDaysIcon, color: 'bg-green-500' },
    { title: 'Hari Berkerja', value: Object.values(userShifts).filter(shift => shift !== 'O').length, icon: UserGroupIcon, color: 'bg-purple-500' }
  ];

  return (
    <div className="space-y-8">
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Selamat datang, {(user?.full_name || '').split(' ')[0]}!</h1>
            <p className="text-gray-600 mt-1">Paparan syif untuk bulan {format(currentMonth, 'MMMM yyyy')}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Gred</p>
            <p className="text-lg font-semibold text-gray-900">{user?.grade}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className={`bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-6 ${stat.urgent ? 'ring-2 ring-orange-300 animate-pulse' : ''}`}>
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.color} rounded-lg p-3`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              {stat.urgent && <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />}
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-600">{stat.title}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Kalendar Syif - {format(currentMonth, 'MMMM yyyy')}</h2>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-4">
          {['Ahd', 'Isn', 'Sel', 'Rab', 'Kha', 'Jum', 'Sab'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">{day}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {getDaysInMonth().map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const shift = userShifts[dateStr];
            const shiftInfo = shift ? SHIFT_INFO[shift] : null;
            return (
              <div key={dateStr} className="min-h-[60px] p-2 rounded-lg border border-gray-200 hover:shadow-md transition duration-200"
                style={{ backgroundColor: shiftInfo?.color || '#f9fafb', color: shiftInfo?.textColor || '#374151' }}>
                <div className="text-sm font-medium">{format(day, 'd')}</div>
                {shift && <div className="text-xs mt-1 font-medium">{shift}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
