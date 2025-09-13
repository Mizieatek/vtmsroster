import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  CalendarDaysIcon, 
  ClockIcon,
  UserGroupIcon,
  BellIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { SHIFT_INFO, DEFAULT_PATTERN, type ShiftCode } from '../types';

export default function Dashboard() {
  const { user } = useAuth();
  const [currentMonth] = useState(new Date());
  
  // Mock data for demonstration
  const [userShifts, setUserShifts] = useState<Record<string, ShiftCode>>({});
  const [exchangeRequests] = useState({
    sent: { pending: 2, approved: 5, rejected: 1 },
    received: { pending: 1 }
  });

  useEffect(() => {
    generateUserShifts();
  }, []);

  const generateUserShifts = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    const shifts: Record<string, ShiftCode> = {};
    days.forEach((day, index) => {
      const patternIndex = index % DEFAULT_PATTERN.length;
      shifts[format(day, 'yyyy-MM-dd')] = DEFAULT_PATTERN[patternIndex];
    });
    
    setUserShifts(shifts);
  };

  const getDaysInMonth = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    return eachDayOfInterval({ start: monthStart, end: monthEnd });
  };

  const getShiftStats = () => {
    const shifts = Object.values(userShifts);
    const stats: Record<string, number> = {};
    
    shifts.forEach(shift => {
      stats[shift] = (stats[shift] || 0) + 1;
    });
    
    return stats;
  };

  const stats = [
    {
      title: 'Permohonan Dihantar',
      value: exchangeRequests.sent.pending + exchangeRequests.sent.approved + exchangeRequests.sent.rejected,
      icon: ClockIcon,
      color: 'bg-blue-500',
      details: [
        { label: 'Pending', value: exchangeRequests.sent.pending, color: 'text-yellow-600' },
        { label: 'Diterima', value: exchangeRequests.sent.approved, color: 'text-green-600' },
        { label: 'Ditolak', value: exchangeRequests.sent.rejected, color: 'text-red-600' }
      ]
    },
    {
      title: 'Permohonan Diterima',
      value: exchangeRequests.received.pending,
      icon: BellIcon,
      color: 'bg-orange-500',
      urgent: exchangeRequests.received.pending > 0
    },
    {
      title: 'Syif Bulan Ini',
      value: Object.keys(userShifts).length,
      icon: CalendarDaysIcon,
      color: 'bg-green-500'
    },
    {
      title: 'Hari Berkerja',
      value: Object.values(userShifts).filter(shift => shift !== 'O').length,
      icon: UserGroupIcon,
      color: 'bg-purple-500'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Selamat datang, {(user?.full_name || '').split(' ')[0]}!
            </h1>
            <p className="text-gray-600 mt-1">
              Paparan syif untuk bulan {format(currentMonth, 'MMMM yyyy')}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Gred</p>
            <p className="text-lg font-semibold text-gray-900">{user?.grade}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-6 ${
              stat.urgent ? 'ring-2 ring-orange-300 animate-pulse' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.color} rounded-lg p-3`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              {stat.urgent && (
                <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />
              )}
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-600">{stat.title}</p>
              {stat.details && (
                <div className="mt-2 space-y-1">
                  {stat.details.map((detail, idx) => (
                    <div key={idx} className="flex justify-between text-xs">
                      <span className="text-gray-500">{detail.label}:</span>
                      <span className={`font-medium ${detail.color}`}>{detail.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Monthly Calendar */}
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Kalendar Syif - {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <div className="flex items-center space-x-4">
            <ChartBarIcon className="h-5 w-5 text-gray-500" />
            <span className="text-sm text-gray-600">Statistik Syif</span>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {['Ahd', 'Isn', 'Sel', 'Rab', 'Kha', 'Jum', 'Sab'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {getDaysInMonth().map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const shift = userShifts[dateStr];
            const shiftInfo = shift ? SHIFT_INFO[shift] : null;
            
            return (
              <div
                key={dateStr}
                className="min-h-[60px] p-2 rounded-lg border border-gray-200 hover:shadow-md transition duration-200"
                style={{
                  backgroundColor: shiftInfo?.color || '#f9fafb',
                  color: shiftInfo?.textColor || '#374151'
                }}
              >
                <div className="text-sm font-medium">
                  {format(day, 'd')}
                </div>
                {shift && (
                  <div className="text-xs mt-1 font-medium">
                    {shift}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 p-4 bg-gray-50 rounded-xl">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Kod Syif:</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {Object.entries(SHIFT_INFO).map(([code, info]) => (
              <div
                key={code}
                className="flex items-center space-x-2 p-2 rounded-lg text-xs"
                style={{ backgroundColor: info.color, color: info.textColor }}
              >
                <span className="font-bold">{code}</span>
                <span className="truncate">{info.label.split(' ').slice(1).join(' ')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Shift Statistics */}
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Statistik Syif Bulan Ini</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Object.entries(getShiftStats()).map(([shift, count]) => {
            const shiftInfo = SHIFT_INFO[shift as ShiftCode];
            return (
              <div key={shift} className="text-center">
                <div
                  className="w-12 h-12 rounded-lg mx-auto mb-2 flex items-center justify-center font-bold text-sm"
                  style={{ backgroundColor: shiftInfo.color, color: shiftInfo.textColor }}
                >
                  {shift}
                </div>
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-xs text-gray-600">hari</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}