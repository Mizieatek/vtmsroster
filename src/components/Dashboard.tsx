import React, { useEffect, useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { SHIFT_INFO, type ShiftCode } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [days, setDays] = useState<Date[]>([]);
  const [shiftMap, setShiftMap] = useState<Record<string, ShiftCode>>({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const start = startOfMonth(new Date());
    const end = endOfMonth(new Date());
    setDays(eachDayOfInterval({ start, end }));
  }, []);

  useEffect(() => {
    if (!user) return;
    void loadShifts();
    async function loadShifts() {
      try {
        setLoading(true); setErr(null);
        const start = format(startOfMonth(new Date()), 'yyyy-MM-dd');
        const end = format(endOfMonth(new Date()), 'yyyy-MM-dd');
        const { data, error } = await supabase
          .from('shifts')
          .select('date, shift_code')
          .eq('user_id', user.id)
          .gte('date', start)
          .lte('date', end)
          .order('date', { ascending: true });
        if (error) throw error;
        const m: Record<string, ShiftCode> = {};
        (data || []).forEach((r: any) => { m[r.date] = r.shift_code as ShiftCode; });
        setShiftMap(m);
      } catch (e: any) {
        setErr(e.message || 'Gagal memuatkan syif');
      } finally {
        setLoading(false);
      }
    }
  }, [user]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Syif bulan {format(new Date(), 'MMMM yyyy')}</p>
      </div>

      {loading && <p className="text-sm text-gray-600">Memuatkan...</p>}
      {err && <p className="text-sm text-red-600">Ralat: {err}</p>}

      {!loading && !err && (
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow p-4 border">
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="px-2 py-2 text-left">Tarikh</th>
                  <th className="px-2 py-2 text-left">Syif</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {days.map((d) => {
                  const key = format(d, 'yyyy-MM-dd');
                  const code = shiftMap[key];
                  const info = code ? SHIFT_INFO[code] : undefined;
                  return (
                    <tr key={key}>
                      <td className="px-2 py-2">{key}</td>
                      <td className="px-2 py-2">
                        <span
                          className="inline-flex items-center justify-center px-2 py-1 rounded text-xs font-semibold"
                          style={{ background: info?.color || '#f3f4f6', color: info?.textColor || '#111827' }}
                          title={code || ''}
                        >
                          {code || '-'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {Object.keys(shiftMap).length === 0 && (
              <div className="mt-4 text-sm text-yellow-800 bg-yellow-50 border border-yellow-200 rounded p-3">
                Tiada syif untuk bulan ini. Jika anda admin, sila gunakan <b>Admin → Generate Roster</b> bagi julat tarikh bulan ini.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
