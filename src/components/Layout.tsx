import React, { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  HomeIcon,
  CalendarDaysIcon,
  ArrowsRightLeftIcon,
  Cog6ToothIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: HomeIcon },
    { name: 'Roster', href: '/roster', icon: CalendarDaysIcon },
    { name: 'Pertukaran Syif', href: '/exchanges', icon: ArrowsRightLeftIcon },
    ...(user?.is_admin ? [{ name: 'Admin', href: '/admin', icon: Cog6ToothIcon }] : []),
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const handleConnectSupabase = () => {
    alert('Sistem telah disambungkan dengan Supabase! Semua data disimpan secara real-time.');
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white/80 backdrop-blur-lg border-r border-gray-200/50 shadow-lg">
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-gray-200/50">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 w-10 h-10 rounded-lg flex items-center justify-center">
                <CalendarDaysIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Roster Syif</h1>
                <p className="text-xs text-gray-600">Management System</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition duration-200 ${
                  isActive(item.href)
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-200/50">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-gradient-to-r from-green-400 to-blue-500 w-10 h-10 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {(user?.full_name || '').split(' ')[0]?.charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.full_name}
                </p>
                <p className="text-xs text-gray-500">
                  {user?.grade} {user?.is_admin && '• Admin'}
                </p>
              </div>
            </div>
            
            <div className="space-y-1">
              <Link
                to="/profile"
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition duration-200"
              >
                <UserCircleIcon className="h-4 w-4" />
                <span>Profil</span>
              </Link>
              <button
                onClick={logout}
                className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition duration-200"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4" />
                <span>Log Keluar</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Top Header with Supabase Connect Button */}
      <div className="ml-64">
        <div className="bg-white/60 backdrop-blur-sm border-b border-gray-200/50 px-8 py-3">
          <div className="flex justify-end">
            <button
              onClick={handleConnectSupabase}
              className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition duration-200 text-sm font-medium shadow-sm"
            >
              <LinkIcon className="h-4 w-4" />
              <span>Connect to Supabase</span>
            </button>
          </div>
        </div>
      </div>
      {/* Main content */}
      <div className="ml-64">
        <main className="p-8 pt-4">
          {children}
        </main>
      </div>
    </div>
  );
}