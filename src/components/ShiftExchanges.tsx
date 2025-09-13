import React, { useEffect, useMemo, useState } from 'react';
import { 
  PlusIcon,
  ArrowsRightLeftIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { SHIFT_INFO, type ShiftCode } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface ExchangeRow {
  id: string;
  requester_id: string;
  target_user_id: string;
  original_shift_id: string;
  target_shift_id: string;
  status: 'pending' | 'approved' | 'rejected';
  reason: string | null;
  created_at: string;
  requester?: { full_name: string; username: string };
  target?: { full_name: string; username: string };
  original?: { date: string; shift_code: ShiftCode };
  targetShift?: { date: string; shift_code: ShiftCode };
}

export default function ShiftExchanges() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'sent' | 'received' | 'new'>('sent');
  const [rows, setRows] = useState<ExchangeRow[]>([]);
  const [users, setUsers] = useState<{id: string; username: string; full_name: string}[]>([]);
  const [newExchange, setNewExchange] = useState({ targetUserId: '', originalDate: '', targetDate: '', reason: '' });
  const isAdmin = !!user?.is_admin;

  const reload = async () => {
    // Load users (for lookup + dropdown)
    const { data: userList } = await supabase.from('users').select('id, username, full_name').eq('is_active', true).order('username');
    setUsers(userList || []);

    // Admin sees all, otherwise relevant to user
    let query = supabase.from('shift_exchanges').select('*').order('created_at', { ascending: false });
    if (!isAdmin) {
      query = query.or(`requester_id.eq.${user!.id},target_user_id.eq.${user!.id}`);
    }
    const { data: ex } = await query;
    const enriched: ExchangeRow[] = [];
    for (const r of (ex || [])) {
      // fetch related data
      const [{ data: reqUser }, { data: tgtUser }, { data: oShift }, { data: tShift }] = await Promise.all([
        supabase.from('users').select('full_name, username').eq('id', r.requester_id).single(),
        supabase.from('users').select('full_name, username').eq('id', r.target_user_id).single(),
        supabase.from('shifts').select('date, shift_code').eq('id', r.original_shift_id).single(),
        supabase.from('shifts').select('date, shift_code').eq('id', r.target_shift_id).single(),
      ]);
      enriched.push({
        ...r,
        requester: reqUser || undefined,
        target: tgtUser || undefined,
        original: oShift ? { date: oShift.date, shift_code: oShift.shift_code as ShiftCode } : undefined,
        targetShift: tShift ? { date: tShift.date, shift_code: tShift.shift_code as ShiftCode } : undefined,
      });
    }
    setRows(enriched);
  };

  useEffect(() => { if (user) reload(); }, [user]);

  const sentRequests = useMemo(() => rows.filter(r => r.requester_id === user?.id), [rows, user]);
  const receivedRequests = useMemo(() => rows.filter(r => r.target_user_id === user?.id), [rows, user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return ClockIcon;
      case 'approved': return CheckCircleIcon;
      case 'rejected': return XCircleIcon;
      default: return ClockIcon;
    }
  };

  const handleApprove = async (id: string) => {
    const { error } = await supabase.from('shift_exchanges').update({ status: 'approved' }).eq('id', id);
    if (error) {
      toast.error('Gagal approve permohonan');
    } else {
      toast.success('Permohonan diluluskan');
      await reload();
    }
  };

  const handleReject = async (id: string) => {
    const { error } = await supabase.from('shift_exchanges').update({ status: 'rejected' }).eq('id', id);
    if (error) {
      toast.error('Gagal tolak permohonan');
    } else {
      toast.success('Permohonan ditolak');
      await reload();
    }
  };

  // helper to fetch a user's shift by date
  const findShiftIdByUserAndDate = async (uid: string, date: string) => {
    const { data, error } = await supabase.from('shifts').select('id').eq('user_id', uid).eq('date', date).single();
    if (error || !data) return null;
    return data.id;
  };

  const handleSubmitExchange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!newExchange.targetUserId || !newExchange.originalDate || !newExchange.targetDate) {
      toast.error('Sila lengkapkan semua maklumat');
      return;
    }
    const originalShiftId = await findShiftIdByUserAndDate(user.id, newExchange.originalDate);
    const targetShiftId = await findShiftIdByUserAndDate(newExchange.targetUserId, newExchange.targetDate);
    if (!originalShiftId || !targetShiftId) {
      toast.error('Shift tidak dijumpai untuk tarikh tersebut');
      return;
    }
    const { error } = await supabase.from('shift_exchanges').insert({
      requester_id: user.id,
      target_user_id: newExchange.targetUserId,
      original_shift_id: originalShiftId,
      target_shift_id: targetShiftId,
      status: 'pending',
      reason: newExchange.reason || null,
    });
    if (error) {
      toast.error('Gagal menghantar permohonan');
    } else {
      toast.success('Permohonan dihantar');
      setNewExchange({ targetUserId: '', originalDate: '', targetDate: '', reason: '' });
      await reload();
    }
  };

  const tabs = [
    { id: 'sent', name: 'Permohonan Dihantar', count: sentRequests.length },
    { id: 'received', name: 'Permohonan Diterima', count: receivedRequests.length },
    { id: 'new', name: 'Buat Permohonan', count: 0 }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-6">
        <div className="flex items-center space-x-3">
          <ArrowsRightLeftIcon className="h-8 w-8 text-blue-500" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pertukaran Syif</h1>
            <p className="text-gray-600 mt-1">Urus permohonan pertukaran syif (live Supabase)</p>
          </div>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 overflow-hidden">
        <div className="border-b border-gray-200/50">
          <nav className="-mb-px flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-4 px-6 text-center text-sm font-medium border-b-2 transition duration-200 ${activeTab === tab.id ? 'border-blue-500 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <span>{tab.name}</span>
                  {tab.count > 0 && <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">{tab.count}</span>}
                </div>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'sent' && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">Permohonan Yang Dihantar</h3>
              {sentRequests.length === 0 ? (
                <div className="text-center py-8">
                  <ArrowsRightLeftIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Tiada permohonan yang dihantar</p>
                </div>
              ) : sentRequests.map((r) => {
                const StatusIcon = getStatusIcon(r.status);
                return (
                  <div key={r.id} className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition duration-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <UserIcon className="h-5 w-5 text-gray-500" />
                        <span className="font-medium text-gray-900">{r.target?.full_name || ''}</span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(r.status)}`}>
                        <div className="flex items-center space-x-1">
                          <StatusIcon className="h-3 w-3" />
                          <span className="capitalize">{r.status}</span>
                        </div>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-sm text-gray-600">Your Shift</p>
                        {r.original && (
                          <div className="flex items-center space-x-2 mt-1">
                            <div className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
                              style={{ backgroundColor: SHIFT_INFO[r.original.shift_code].color, color: SHIFT_INFO[r.original.shift_code].textColor }}>
                              {r.original.shift_code}
                            </div>
                            <span className="text-sm text-gray-900">{format(new Date(r.original.date), 'dd/MM/yyyy')}</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Target Shift</p>
                        {r.targetShift && (
                          <div className="flex items-center space-x-2 mt-1">
                            <div className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
                              style={{ backgroundColor: SHIFT_INFO[r.targetShift.shift_code].color, color: SHIFT_INFO[r.targetShift.shift_code].textColor }}>
                              {r.targetShift.shift_code}
                            </div>
                            <span className="text-sm text-gray-900">{format(new Date(r.targetShift.date), 'dd/MM/yyyy')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'received' && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">Permohonan Yang Diterima</h3>
              {receivedRequests.length === 0 ? (
                <div className="text-center py-8">
                  <ArrowsRightLeftIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Tiada permohonan yang diterima</p>
                </div>
              ) : receivedRequests.map((r) => (
                <div key={r.id} className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition duration-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <UserIcon className="h-5 w-5 text-gray-500" />
                      <span className="font-medium text-gray-900">{r.requester?.full_name || ''}</span>
                    </div>
                    <span className="text-xs text-gray-500">{format(new Date(r.created_at), 'dd/MM/yyyy HH:mm')}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Wants to swap</p>
                      {r.original && (
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
                            style={{ backgroundColor: SHIFT_INFO[r.original.shift_code].color, color: SHIFT_INFO[r.original.shift_code].textColor }}>
                            {r.original.shift_code}
                          </div>
                          <span className="text-sm text-gray-900">{format(new Date(r.original.date), 'dd/MM/yyyy')}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">With your shift</p>
                      {r.targetShift && (
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
                            style={{ backgroundColor: SHIFT_INFO[r.targetShift.shift_code].color, color: SHIFT_INFO[r.targetShift.shift_code].textColor }}>
                            {r.targetShift.shift_code}
                          </div>
                          <span className="text-sm text-gray-900">{format(new Date(r.targetShift.date), 'dd/MM/yyyy')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {r.status === 'pending' && (user?.id === r.target_user_id || user?.is_admin) && (
                    <div className="flex space-x-3">
                      <button onClick={() => handleApprove(r.id)} className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition duration-200 flex items-center justify-center space-x-2">
                        <CheckCircleIcon className="h-4 w-4" />
                        <span>Terima</span>
                      </button>
                      <button onClick={() => handleReject(r.id)} className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition duration-200 flex items-center justify-center space-x-2">
                        <XCircleIcon className="h-4 w-4" />
                        <span>Tolak</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'new' && (
            <div className="max-w-2xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Buat Permohonan Baharu</h3>
              <form onSubmit={handleSubmitExchange} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Rakan Sekerja</label>
                  <select
                    value={newExchange.targetUserId}
                    onChange={(e) => setNewExchange({ ...newExchange, targetUserId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Pilih...</option>
                    {users.filter(u => u.id !== user?.id).map(u => (
                      <option value={u.id} key={u.id}>{u.full_name} ({u.username})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tarikh Syif Anda</label>
                    <input
                      type="date"
                      value={newExchange.originalDate}
                      onChange={(e) => setNewExchange({ ...newExchange, originalDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tarikh Syif Sasaran</label>
                    <input
                      type="date"
                      value={newExchange.targetDate}
                      onChange={(e) => setNewExchange({ ...newExchange, targetDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sebab Pertukaran</label>
                  <textarea
                    value={newExchange.reason}
                    onChange={(e) => setNewExchange({ ...newExchange, reason: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nyatakan sebab pertukaran syif..."
                  />
                </div>

                <button type="submit" className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition duration-200 flex items-center justify-center space-x-2">
                  <PlusIcon className="h-5 w-5" />
                  <span>Hantar Permohonan</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
