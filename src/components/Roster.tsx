import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from 'date-fns';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  PrinterIcon,
  AdjustmentsHorizontalIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { SHIFT_INFO, DEFAULT_PATTERN, type ShiftCode } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface StaffMember {
  id: string;
  username: string;
  full_name: string;
  grade: string;
}

interface Event {
  id: string;
  title: string;
  date: string;
  type: string;
}

export default function Roster() {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showFullNames, setShowFullNames] = useState(false);
  const [rosterData, setRosterData] = useState<Record<string, Record<string, ShiftCode>>>({});
  const [staffData, setStaffData] = useState<StaffMember[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [currentMonth]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load staff data
      const { data: staff, error: staffError } = await supabase
        .from('users')
        .select('id, username, full_name, grade')
        .eq('is_active', true)
        .order('username');

      if (staffError) throw staffError;
      setStaffData(staff || []);

      // Load shifts for current month
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);
      
      const { data: shifts, error: shiftsError } = await supabase
        .from('shifts')
        .select('user_id, date, shift_code')
        .gte('date', format(monthStart, 'yyyy-MM-dd'))
        .lte('date', format(monthEnd, 'yyyy-MM-dd'));

      if (shiftsError) throw shiftsError;

      // Convert shifts to roster data format
      const rosterMap: Record<string, Record<string, ShiftCode>> = {};
      staff?.forEach(staffMember => {
        rosterMap[staffMember.id] = {};
      });

      shifts?.forEach(shift => {
        if (!rosterMap[shift.user_id]) {
          rosterMap[shift.user_id] = {};
        }
        rosterMap[shift.user_id][shift.date] = shift.shift_code as ShiftCode;
      });

      setRosterData(rosterMap);

      // Load events for current month
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('id, title, date, type')
        .gte('date', format(monthStart, 'yyyy-MM-dd'))
        .lte('date', format(monthEnd, 'yyyy-MM-dd'));

      if (eventsError) throw eventsError;
      setEvents(eventsData || []);

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Ralat semasa memuatkan data');
    } finally {
      setLoading(false);
    }
  };

  const generateRosterData = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    const data: Record<string, Record<string, ShiftCode>> = {};
    
    staffData.forEach((staff, staffIndex) => {
      data[staff.id] = {};
      days.forEach((day, dayIndex) => {
        const patternIndex = (staffIndex * 3 + dayIndex) % DEFAULT_PATTERN.length;
        data[staff.id][format(day, 'yyyy-MM-dd')] = DEFAULT_PATTERN[patternIndex];
      });
    });
    
    setRosterData(data);
  };

  const getDaysInMonth = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    return eachDayOfInterval({ start: monthStart, end: monthEnd });
  };

  const previousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const printRoster = () => {
    window.print();
  };

  const getEventsForDate = (date: string) => {
    return events.filter(event => event.date === date);
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
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
          <h4 className="font-medium text-green-800 mb-2">✅ Status Database</h4>
          <p className="text-sm text-green-700">
            Sistem telah disambungkan dengan Supabase. Semua data disimpan secara real-time.
          </p>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Roster Syif</h1>
            <p className="text-gray-600 mt-1">Jadual kerja kakitangan department</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setShowFullNames(false)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition duration-200 ${
                  !showFullNames ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Nama Pendek
              </button>
              <button
                onClick={() => setShowFullNames(true)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition duration-200 ${
                  showFullNames ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Nama Panjang
              </button>
            </div>
            
            <button
              onClick={printRoster}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-200"
            >
              <PrinterIcon className="h-4 w-4" />
              <span>Cetak</span>
            </button>
          </div>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-6">
        <div className="flex items-center justify-between">
          <button
            onClick={previousMonth}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition duration-200"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            <span>Bulan Sebelum</span>
          </button>
          
          <div className="flex items-center space-x-3">
            <CalendarIcon className="h-5 w-5 text-gray-500" />
            <h2 className="text-xl font-bold text-gray-900">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
          </div>
          
          <button
            onClick={nextMonth}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition duration-200"
          >
            <span>Bulan Seterusnya</span>
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Roster Table */}
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 sticky left-0 bg-gray-50/80 min-w-[200px]">
                  Kakitangan
                </th>
                {getDaysInMonth().map((day) => (
                  <th
                    key={format(day, 'yyyy-MM-dd')}
                    className="px-2 py-3 text-center text-xs font-medium text-gray-900 min-w-[50px]"
                  >
                    <div>{format(day, 'd')}</div>
                    <div className="text-[10px] text-gray-500">
                      {format(day, 'EEE')}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {staffData.map((staff) => (
                <tr key={staff.id} className="hover:bg-gray-50/50 transition duration-200">
                  <td className="px-4 py-3 sticky left-0 bg-white/80 backdrop-blur-sm border-r border-gray-200">
                    <div>
                      <div className="font-medium text-gray-900">
                        {showFullNames ? staff.full_name : staff.username}
                      </div>
                      <div className="text-sm text-gray-500">{staff.grade}</div>
                    </div>
                  </td>
                  {getDaysInMonth().map((day) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const shift = rosterData[staff.id]?.[dateStr];
                    const shiftInfo = shift ? SHIFT_INFO[shift] : null;
                    const events = getEventsForDate(dateStr);
                    
                    return (
                      <td key={dateStr} className="px-2 py-3 text-center relative">
                        {shift && (
                          <div
                            className="w-full h-8 rounded-md flex items-center justify-center text-xs font-bold cursor-pointer hover:scale-105 transition duration-200"
                            style={{
                              backgroundColor: shiftInfo?.color,
                              color: shiftInfo?.textColor
                            }}
                            title={`${staff.username}: ${shiftInfo?.label}`}
                          >
                            {shift}
                          </div>
                        )}
                        {events.length > 0 && (
                          <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" 
                               title={events.map(e => e.title).join(', ')} />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Kod Syif & Event</h3>
        
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Kod Syif:</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
              {Object.entries(SHIFT_INFO).map(([code, info]) => (
                <div key={code} className="flex items-center space-x-2">
                  <div
                    className="w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold"
                    style={{ backgroundColor: info.color, color: info.textColor }}
                  >
                    {code}
                  </div>
                  <span className="text-sm text-gray-700">{info.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Event Bulan Ini:</h4>
            <div className="space-y-2">
              {events.map((event) => (
                <div key={event.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-red-500 rounded-full" />
                  <span className="text-sm font-medium">{format(new Date(event.date), 'd MMM')}</span>
                  <span className="text-sm text-gray-600">{event.title}</span>
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full capitalize">
                    {event.type}
                  </span>
                </div>
              ))}
              {events.length === 0 && (
                <p className="text-sm text-gray-500 italic">Tiada event untuk bulan ini</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}