import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  UserCircleIcon, 
  KeyIcon,
  PhoneIcon,
  IdentificationIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, updatePassword } = useAuth();
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Password baharu tidak sepadan');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password baharu mesti sekurang-kurangnya 6 aksara');
      return;
    }

    const success = await updatePassword(passwordData.newPassword);
    if (success) {
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setIsEditingPassword(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-6">
        <div className="flex items-center space-x-4">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 w-16 h-16 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-xl">
              {user.full_name.split(' ')[0]?.charAt(0)}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Profil Pengguna</h1>
            <p className="text-gray-600 mt-1">Urus maklumat peribadi dan kata laluan</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Information */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center space-x-2">
            <IdentificationIcon className="h-5 w-5 text-blue-500" />
            <span>Maklumat Peribadi</span>
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center p-4 bg-gray-50 rounded-xl">
              <UserCircleIcon className="h-8 w-8 text-gray-400 mr-4" />
              <div className="flex-1">
                <p className="text-sm text-gray-600">Nama Penuh</p>
                <p className="font-medium text-gray-900">{user.full_name}</p>
              </div>
            </div>

            <div className="flex items-center p-4 bg-gray-50 rounded-xl">
              <IdentificationIcon className="h-8 w-8 text-gray-400 mr-4" />
              <div className="flex-1">
                <p className="text-sm text-gray-600">Username</p>
                <p className="font-medium text-gray-900">{user.username}</p>
              </div>
            </div>

            <div className="flex items-center p-4 bg-gray-50 rounded-xl">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <span className="text-blue-600 font-bold text-sm">{user.grade}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600">Gred</p>
                <p className="font-medium text-gray-900">{user.grade}</p>
              </div>
            </div>

            {user.phone && (
              <div className="flex items-center p-4 bg-gray-50 rounded-xl">
                <PhoneIcon className="h-8 w-8 text-gray-400 mr-4" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600">No. Telefon</p>
                  <p className="font-medium text-gray-900">{user.phone}</p>
                </div>
              </div>
            )}

            <div className="flex items-center p-4 bg-gray-50 rounded-xl">
              <div className={`w-8 h-8 ${user.is_admin ? 'bg-green-100' : 'bg-gray-100'} rounded-lg flex items-center justify-center mr-4`}>
                <CheckIcon className={`h-5 w-5 ${user.is_admin ? 'text-green-600' : 'text-gray-400'}`} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600">Status</p>
                <p className="font-medium text-gray-900">
                  {user.is_admin ? 'Admin' : 'Kakitangan'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Password Management */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center space-x-2">
            <KeyIcon className="h-5 w-5 text-blue-500" />
            <span>Kemaskini Kata Laluan</span>
          </h2>

          {!isEditingPassword ? (
            <div className="text-center py-8">
              <KeyIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Keselamatan kata laluan adalah penting</p>
              <button
                onClick={() => setIsEditingPassword(true)}
                className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition duration-200"
              >
                Tukar Kata Laluan
              </button>
            </div>
          ) : (
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kata Laluan Semasa
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kata Laluan Baharu
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  minLength={6}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sahkan Kata Laluan Baharu
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  minLength={6}
                  required
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-200"
                >
                  Kemaskini
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingPassword(false);
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  }}
                  className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition duration-200"
                >
                  Batal
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Additional Info */}
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Maklumat Akaun</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 rounded-xl">
            <p className="text-sm text-blue-600 font-medium">Tarikh Daftar</p>
            <p className="text-blue-900 font-semibold">
              {new Date(user.created_at).toLocaleDateString('ms-MY')}
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded-xl">
            <p className="text-sm text-green-600 font-medium">Status Akaun</p>
            <p className="text-green-900 font-semibold">Aktif</p>
          </div>
        </div>
      </div>
    </div>
  );
}