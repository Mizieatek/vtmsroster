import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export default function AdminPanel() {
  const { user } = useAuth();
  const isAdmin = !!user?.is_admin;

  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ users: 0, shifts: 0, pending: 0 });
  const [startDate, setStartDate] = useState<string>(format(startOfMonth(new Date()), 'yyyy-MM-01'));
  const [endDate, setEndDate] = useState<string>(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [shifts, setShifts] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAdmin) {
      init();
    }
  }, [isAdmin]);

  async function init() {
    try {
      setLoading(true);
      setError(null);

      const u = await supabase.from('users').select('*', { count: 'exact', head: true });
      const s = await supabase.from('shifts').select('*', { count: 'exact', head: true });
      const p = await supabase.from('shift_exchanges').select('*', { count: 'exact', head: true }).eq('status', 'pending');
      setStats({
        users: u.count || 0,
        shifts: s.count || 0,
        pending: p.count || 0,
      });

      await loadShifts();
    } catch (e: any) {
      setError(e.message || 'Ralat memuatkan data');
    } finally {
      setLoading(false);
    }
  }

  async function loadShifts() {
    const { data, error } = await supabase
      .from('shifts')
      .select('id, date, shift_code, user_id, users ( id, full_name, username )')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })
      .limit(50);
    if (error) { setError(error.message); return; }
    setShifts(data || []);
  }

  async function runGenerateRoster() {
    try {
      setLoading(true);
      const { error } = await supabase.rpc('generate_roster', { p_start_date: startDate, p_end_date: endDate, p_pattern_id: null });
      if (error) throw error;
      alert('Roster generated');
      await loadShifts();
    } catch (e: any) {
      alert(e.message || 'Gagal generate roster');
    } finally {
      setLoading(false);
    }
  }

  async function updateShiftCode(id: string, newCode: string) {
    try {
      const { error } = await supabase.from('shifts').update({ shift_code: newCode }).eq('id', id);
      if (error) throw error;
      await loadShifts();
    } catch (e: any) {
      alert(e.message || 'Gagal kemaskini shift');
    }
  }

  if (!isAdmin) {
    return (
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow p-6">
        <p className="text-red-600 font-medium">Access denied. Admin only.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow p-6 border border-white/20">
        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-gray-600">Manage roster & shifts</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: 'Users', value: stats.users },
          { title: 'Total Shifts', value: stats.shifts },
          { title: 'Exchanges Pending', value: stats.pending },
        ].map((s) => (
          <div key={s.title} className="bg-white/80 backdrop-blur-lg rounded-2xl shadow p-6 border border-white/20">
            <p className="text-sm text-gray-500">{s.title}</p>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow p-6 border border-white/20">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Generate Roster</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-gray-600">Start Date</label>
            <input type="date" className="w-full border rounded-lg px-3 py-2" value={startDate} onChange={(e)=>setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-gray-600">End Date</label>
            <input type="date" className="w-full border rounded-lg px-3 py-2" value={endDate} onChange={(e)=>setEndDate(e.target.value)} />
          </div>
          <div className="flex items-end">
            <button onClick={runGenerateRoster} className="w-full bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700">Generate</button>
          </div>
        </div>
        {loading && <p className="text-sm text-gray-500 mt-2">Processing...</p>}
      </div>

      <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow p-6 border border-white/20">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Edit Shifts (first 50 in range)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-sm text-gray-600">Start Date</label>
            <input type="date" className="w-full border rounded-lg px-3 py-2" value={startDate} onChange={(e)=>setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-gray-600">End Date</label>
            <input type="date" className="w-full border rounded-lg px-3 py-2" value={endDate} onChange={(e)=>setEndDate(e.target.value)} />
          </div>
          <div className="flex items-end">
            <button onClick={loadShifts} className="w-full border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50">Reload</button>
          </div>
        </div>

        <div className="overflow-auto max-h-[480px] rounded-lg border border-gray-200">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-600">Date</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">User</th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">Shift</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {shifts.map((s) => (
                <tr key={s.id} className="bg-white">
                  <td className="px-3 py-2">{s.date}</td>
                  <td className="px-3 py-2">{s.users?.full_name || s.user_id}</td>
                  <td className="px-3 py-2">
                    <select
                      defaultValue={s.shift_code}
                      onChange={(e)=>updateShiftCode(s.id, e.target.value)}
                      className="border rounded px-2 py-1"
                    >
                      {['N','M','E','O','MOT','NOT','AL','CTR','CG','EL','TR','MT','MC'].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2 text-gray-400 text-xs">id:{s.id.slice(0,8)}</td>
                </tr>
              ))}
              {shifts.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center text-gray-500">No shifts in range.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
