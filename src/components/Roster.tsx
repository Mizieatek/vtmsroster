import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from 'date-fns';
import { ChevronLeftIcon, ChevronRightIcon, PrinterIcon } from '@heroicons/react/24/outline';
import { SHIFT_INFO, type ShiftCode } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type Staff = { id: string; username: string; full_name: string; grade: string; };
type Event = { id: string; title: string; date: string; type: string; };

export default function Roster() {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [staff, setStaff] = useState<Staff[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [roster, setRoster] = useState<Record<string, Record<string, ShiftCode>>>({});
  const [showFullNames, setShowFullNames] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { void loadData(); }, [currentMonth]);

  async function loadData() {
    setLoading(true); setError(null);
    try {
      // Load staff (active)
      const { data: staffData, error: staffErr } = await supabase
        .from('users')
        .select('id, username, full_name, grade')
        .eq('is_active', true)
        .order('username');
      if (staffErr) throw staffErr;
      setStaff(staffData || []);

      const mStart = startOfMonth(currentMonth);
      const mEnd = endOfMonth(currentMonth);

      // Load shifts in month, with explicit FK join
      const { data: shifts, error: shiftsErr } = await supabase
        .from('shifts')
        .select('user_id, date, shift_code')
        .gte('date', format(mStart, 'yyyy-MM-dd'))
        .lte('date', format(mEnd, 'yyyy-MM-dd'));
      if (shiftsErr) throw shiftsErr;

      const map: Record<string, Record<string, ShiftCode>> = {};
      (staffData || []).forEach(s => { map[s.id] = {}; });
      (shifts || []).forEach((row: any) => {
        if (!map[row.user_id]) map[row.user_id] = {};
        map[row.user_id][row.date] = row.shift_code as ShiftCode;
      });
      setRoster(map);

      // Load events
      const { data: eventsData, error: evErr } = await supabase
        .from('events')
        .select('id, title, date, type')
        .gte('date', format(mStart, 'yyyy-MM-dd'))
        .lte('date', format(mEnd, 'yyyy-MM-dd'));
      if (evErr) throw evErr;
      setEvents(eventsData || []);
    } catch (e: any) {
      console.error('Roster load error:', e);
      setError(e.message || 'Gagal memuatkan data');
    } finally {
      setLoading(false);
    }
  }

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  const monthLabel = format(currentMonth, 'MMMM yyyy');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 rounded-lg hover:bg-gray-100">
            <ChevronLeftIcon className="h-5 w-5 text-gray-700" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{monthLabel}</h1>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 rounded-lg hover:bg-gray-100">
            <ChevronRightIcon className="h-5 w-5 text-gray-700" />
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <label className="text-sm text-gray-600">
            <input type="checkbox" className="mr-2" checked={showFullNames} onChange={() => setShowFullNames(!showFullNames)} />
            Tunjuk nama penuh
          </label>
          <button onClick={() => window.print()} className="inline-flex items-center px-3 py-2 rounded-lg bg-white border hover:bg-gray-50 text-sm">
            <PrinterIcon className="h-4 w-4 mr-2" /> Print
          </button>
        </div>
      </div>

      {loading && <div className="text-sm text-gray-600">Memuatkan...</div>}
      {error && <div className="text-sm text-red-600">Ralat: {error}</div>}

      {!loading && !error && (
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow p-4 border">
          <div className="overflow-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr>
                  <th className="px-2 py-2 text-left w-48">Staff</th>
                  {days.map(d => (
                    <th key={d.toISOString()} className="px-1 py-2 text-center whitespace-nowrap">
                      <div className="text-[10px] text-gray-500">{format(d, 'EEE')}</div>
                      <div className="text-sm font-semibold text-gray-800">{format(d, 'd')}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {staff.map(s => (
                  <tr key={s.id}>
                    <td className="px-2 py-2 text-gray-900 font-medium whitespace-nowrap">
                      {showFullNames ? s.full_name : s.username}
                    </td>
                    {days.map(d => {
                      const key = format(d, 'yyyy-MM-dd');
                      const code = roster[s.id]?.[key];
                      const info = code ? SHIFT_INFO[code] : null;
                      return (
                        <td key={key} className="px-1 py-1 text-center">
                          <div
                            className="mx-auto w-10 h-10 rounded-lg flex items-center justify-center text-[10px] font-semibold"
                            style={{ background: info?.color || '#f3f4f6', color: info?.textColor || '#111827' }}
                            title={code || ''}
                          >
                            {code || ''}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {staff.length === 0 && (
                  <tr>
                    <td colSpan={days.length + 1} className="text-center py-10 text-gray-500">
                      Tiada staff aktif ditemui.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Events</h2>
            {events.length === 0 ? (
              <p className="text-sm text-gray-500">Tiada event untuk bulan ini.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {events.map(ev => (
                  <li key={ev.id} className="text-gray-700">
                    {ev.date}: {ev.title} <span className="ml-2 text-xs text-blue-700 bg-blue-100 px-2 py-0.5 rounded">{ev.type}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {staff.length > 0 && Object.values(roster).every(v => Object.keys(v).length === 0) && (
            <div className="mt-6 p-4 border rounded-lg bg-yellow-50 text-yellow-800 text-sm">
              Tiada shift untuk bulan ini. Jika anda admin, sila pergi ke <b>Admin → Generate Roster</b> untuk julat tarikh bulan ini.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
