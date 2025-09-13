import React, { useState } from 'react';
import { 
  Cog6ToothIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface StaffMember {
  id: string;
  username: string;
  full_name: string;
  grade: string;
  is_admin: boolean;
}

export default function AdminPanel() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'shifts' | 'exchanges' | 'staff' | 'events' | 'stats' | 'ordering'>('shifts');
  const [staffOrder, setStaffOrder] = useState<StaffMember[]>([]);
  const [allStaff, setAllStaff] = useState<StaffMember[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM format
  const [loading, setLoading] = useState(true);
  const [generateLoading, setGenerateLoading] = useState(false);

  useEffect(() => {
    loadStaffData();
  }, []);

  useEffect(() => {
    loadStaffOrdering();
  }, [selectedMonth]);

  const loadStaffData = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, full_name, grade, is_admin')
        .eq('is_active', true)
        .order('username');

      if (error) throw error;
      setAllStaff(data || []);
    } catch (error) {
      console.error('Error loading staff:', error);
      toast.error('Ralat semasa memuatkan data kakitangan');
    } finally {
      setLoading(false);
    }
  };

  const loadStaffOrdering = async () => {
    try {
      const { data, error } = await supabase
        .from('staff_ordering')
        .select(`
          order_position,
          users (id, username, full_name, grade, is_admin)
        `)
        .eq('month_year', selectedMonth)
        .order('order_position');

      if (error) throw error;

      if (data && data.length > 0) {
        const orderedStaff = data.map(item => item.users).filter(Boolean) as StaffMember[];
        setStaffOrder(orderedStaff);
      } else {
        // If no ordering exists for this month, use default order
        setStaffOrder([...allStaff]);
      }
    } catch (error) {
      console.error('Error loading staff ordering:', error);
      setStaffOrder([...allStaff]);
    }
  };

  if (!user?.is_admin) {
    return (
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-12 text-center">
        <div className="text-red-500 mb-4">
          <Cog6ToothIcon className="h-16 w-16 mx-auto" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Akses Ditolak</h2>
        <p className="text-gray-600">Anda tidak mempunyai kebenaran untuk mengakses panel admin.</p>
      </div>
    );
  }

  const tabs = [
    { id: 'shifts', name: 'Pengurusan Syif', icon: CalendarDaysIcon },
    { id: 'ordering', name: 'Susunan Staf', icon: Bars3Icon },
    { id: 'exchanges', name: 'Pertukaran Syif', icon: CalendarDaysIcon },
    { id: 'staff', name: 'Pengurusan Kakitangan', icon: UserGroupIcon },
    { id: 'events', name: 'Event & Acara', icon: CalendarDaysIcon },
    { id: 'stats', name: 'Statistik & Laporan', icon: ChartBarIcon },
  ];

  const moveStaff = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...staffOrder];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < newOrder.length) {
      [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
      setStaffOrder(newOrder);
    }
  };

  const saveStaffOrder = async () => {
    try {
      // Delete existing ordering for this month
      await supabase
        .from('staff_ordering')
        .delete()
        .eq('month_year', selectedMonth);

      // Insert new ordering
      const orderingData = staffOrder.map((staff, index) => ({
        month_year: selectedMonth,
        user_id: staff.id,
        order_position: index + 1,
        created_by: user.id
      }));

      const { error } = await supabase
        .from('staff_ordering')
        .insert(orderingData);

      if (error) throw error;

      toast.success(`Susunan staf untuk ${selectedMonth} telah disimpan!`);
    } catch (error) {
      console.error('Error saving staff order:', error);
      toast.error('Ralat semasa menyimpan susunan staf');
    }
  };

  const generateRoster = async (startDate: string, endDate: string) => {
    setGenerateLoading(true);
    try {
      const { error } = await supabase.rpc('generate_roster', {
        start_date: startDate,
        end_date: endDate
      });

      if (error) throw error;

      toast.success('Roster telah dijana berjaya!');
    } catch (error) {
      console.error('Error generating roster:', error);
      toast.error('Ralat semasa menjana roster');
    } finally {
      setGenerateLoading(false);
    }
  };

  const generateMonthlyRoster = async (month: string, year: number) => {
    const startDate = `${year}-${month.padStart(2, '0')}-01`;
    const endDate = new Date(year, parseInt(month) - 1 + 1, 0).toISOString().split('T')[0];
    await generateRoster(startDate, endDate);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-6">
        <div className="flex items-center space-x-3">
          <Cog6ToothIcon className="h-8 w-8 text-blue-500" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Panel Admin</h1>
            <p className="text-gray-600 mt-1">Pengurusan sistem roster syif</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 overflow-hidden">
        <div className="border-b border-gray-200/50">
          <nav className="-mb-px flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-6 text-sm font-medium border-b-2 whitespace-nowrap transition duration-200 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'shifts' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Pengurusan Syif</h3>
                <button 
                  disabled={generateLoading}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-200 flex items-center space-x-2 disabled:opacity-50"
                >
                  <PlusIcon className="h-4 w-4" />
                  <span>{generateLoading ? 'Menjana...' : 'Auto Generate'}</span>
                </button>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <h4 className="font-medium text-green-800 mb-2">✅ Sambungan Database</h4>
                <p className="text-sm text-green-700">
                  Sistem telah disambungkan dengan Supabase. Semua data disimpan secara real-time.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="font-medium text-gray-900 mb-4">Generate by Date Range</h4>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const startDate = formData.get('startDate') as string;
                    const endDate = formData.get('endDate') as string;
                    generateRoster(startDate, endDate);
                  }} className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tarikh Mula</label>
                      <input 
                        name="startDate"
                        type="date" 
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tarikh Tamat</label>
                      <input 
                        name="endDate"
                        type="date" 
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
                      />
                    </div>
                    <button 
                      type="submit"
                      disabled={generateLoading}
                      className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition duration-200 disabled:opacity-50"
                    >
                      {generateLoading ? 'Menjana...' : 'Generate Roster'}
                    </button>
                  </form>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="font-medium text-gray-900 mb-4">Generate by Month/Year</h4>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const month = formData.get('month') as string;
                    const year = parseInt(formData.get('year') as string);
                    generateMonthlyRoster(month, year);
                  }} className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bulan</label>
                      <select 
                        name="month"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="1">Januari</option>
                        <option value="2">Februari</option>
                        <option value="3">Mac</option>
                        <option value="4">April</option>
                        <option value="5">Mei</option>
                        <option value="6">Jun</option>
                        <option value="7">Julai</option>
                        <option value="8">Ogos</option>
                        <option value="9">September</option>
                        <option value="10">Oktober</option>
                        <option value="11">November</option>
                        <option value="12">Disember</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tahun</label>
                      <input 
                        name="year"
                        type="number" 
                        defaultValue={new Date().getFullYear()}
                        min="2024"
                        max="2030"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
                      />
                    </div>
                    <button 
                      type="submit"
                      disabled={generateLoading}
                      className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition duration-200 disabled:opacity-50"
                    >
                      {generateLoading ? 'Menjana...' : 'Generate Roster'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ordering' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Susunan Staf</h3>
                <div className="flex items-center space-x-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bulan</label>
                    <input
                      type="month"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={saveStaffOrder}
                      className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-200"
                    >
                      Simpan Susunan
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="font-medium text-blue-800 mb-2">📋 Panduan Susunan Staf</h4>
                <p className="text-sm text-blue-700">
                  Susun nama staf mengikut turutan yang dikehendaki untuk bulan yang dipilih. 
                  Turutan ini akan mempengaruhi pembahagian syif secara automatik.
                </p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                  <h4 className="font-medium text-gray-900">
                    Susunan Staf untuk {new Date(selectedMonth + '-01').toLocaleDateString('ms-MY', { month: 'long', year: 'numeric' })}
                  </h4>
                </div>
                <div className="divide-y divide-gray-200">
                  {staffOrder.map((staff, index) => (
                    <div key={staff.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                      <div className="flex items-center space-x-4">
                        <div className="bg-blue-100 text-blue-800 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{staff.full_name}</div>
                          <div className="text-sm text-gray-500">
                            {staff.grade} • {staff.username}
                            {staff.is_admin && ' • Admin'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => moveStaff(index, 'up')}
                          disabled={index === 0}
                          className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Naik"
                        >
                          <ArrowUpIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => moveStaff(index, 'down')}
                          disabled={index === staffOrder.length - 1}
                          className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Turun"
                        >
                          <ArrowDownIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-medium text-gray-900 mb-3">Pratonton Kesan Susunan</h4>
                <div className="text-sm text-gray-600 space-y-2">
                  <p>• Staf pertama dalam senarai akan mendapat syif pertama dalam pattern</p>
                  <p>• Susunan ini akan digunakan untuk generate roster automatik</p>
                  <p>• Anda boleh menyusun semula mengikut keperluan setiap bulan</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'exchanges' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Pengurusan Pertukaran Syif</h3>
              <div className="bg-gray-50 rounded-xl p-6 text-center">
                <CalendarDaysIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Senarai semua permohonan pertukaran syif akan dipaparkan di sini</p>
              </div>
            </div>
          )}

          {activeTab === 'staff' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Pengurusan Kakitangan</h3>
                <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-200 flex items-center space-x-2">
                  <PlusIcon className="h-4 w-4" />
                  <span>Tambah Kakitangan</span>
                </button>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gred</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {allStaff.map((staff) => (
                      <tr key={staff.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{staff.full_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{staff.username}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{staff.grade}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            {staff.is_admin ? 'Admin' : 'Aktif'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-900">
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'events' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Pengurusan Event & Acara</h3>
                <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-200 flex items-center space-x-2">
                  <PlusIcon className="h-4 w-4" />
                  <span>Tambah Event</span>
                </button>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="font-medium text-gray-900 mb-4">Tambah Event Baharu</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Event</label>
                    <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tarikh</label>
                    <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Jenis</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                      <option>Cuti Umum</option>
                      <option>Latihan</option>
                      <option>Mesyuarat</option>
                      <option>Lain-lain</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-200 w-full">
                      Tambah Event
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Statistik & Laporan</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-xl p-6 text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">120</div>
                  <div className="text-sm text-blue-800">Total Syif Bulan Ini</div>
                </div>
                <div className="bg-green-50 rounded-xl p-6 text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">15</div>
                  <div className="text-sm text-green-800">Pertukaran Diluluskan</div>
                </div>
                <div className="bg-orange-50 rounded-xl p-6 text-center">
                  <div className="text-3xl font-bold text-orange-600 mb-2">5</div>
                  <div className="text-sm text-orange-800">Permohonan Pending</div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="font-medium text-gray-900 mb-4">Filter Statistik</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bulan</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                      <option>Januari 2024</option>
                      <option>Februari 2024</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kakitangan</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                      <option>Semua Kakitangan</option>
                      <option>Hurul Aziella</option>
                      <option>Raja Ahmad</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-200 w-full">
                      Jana Laporan
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}