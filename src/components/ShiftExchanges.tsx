import React, { useState } from 'react';
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

interface ExchangeRequest {
  id: string;
  requester: string;
  requesterName: string;
  targetUser: string;
  targetUserName: string;
  originalDate: string;
  originalShift: ShiftCode;
  targetDate: string;
  targetShift: ShiftCode;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  createdAt: string;
}

const SAMPLE_REQUESTS: ExchangeRequest[] = [
  {
    id: '1',
    requester: 'hurul',
    requesterName: 'Hurul Aziella',
    targetUser: 'raja',
    targetUserName: 'Raja Ahmad',
    originalDate: '2024-01-15',
    originalShift: 'N',
    targetDate: '2024-01-16',
    targetShift: 'M',
    status: 'pending',
    reason: 'Urusan peribadi',
    createdAt: '2024-01-10T10:00:00Z'
  },
  {
    id: '2',
    requester: 'faeez',
    requesterName: 'Khairul Faeez',
    targetUser: 'hurul',
    targetUserName: 'Hurul Aziella',
    originalDate: '2024-01-20',
    originalShift: 'E',
    targetDate: '2024-01-21',
    targetShift: 'M',
    status: 'approved',
    reason: 'Appointment dengan doktor',
    createdAt: '2024-01-12T14:30:00Z'
  }
];

export default function ShiftExchanges() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'sent' | 'received' | 'new'>('sent');
  const [requests] = useState<ExchangeRequest[]>(SAMPLE_REQUESTS);

  const [newExchange, setNewExchange] = useState({
    targetUser: '',
    originalDate: '',
    targetDate: '',
    reason: ''
  });

  const sentRequests = requests.filter(req => req.requester === user?.username);
  const receivedRequests = requests.filter(req => req.targetUser === user?.username);

  const handleApprove = (requestId: string) => {
    // In real implementation, this would update the database
    console.log('Approved request:', requestId);
  };

  const handleReject = (requestId: string) => {
    // In real implementation, this would update the database
    console.log('Rejected request:', requestId);
  };

  const handleSubmitExchange = (e: React.FormEvent) => {
    e.preventDefault();
    // In real implementation, this would create a new exchange request
    console.log('New exchange request:', newExchange);
    setNewExchange({ targetUser: '', originalDate: '', targetDate: '', reason: '' });
  };

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

  const tabs = [
    { id: 'sent', name: 'Permohonan Dihantar', count: sentRequests.length },
    { id: 'received', name: 'Permohonan Diterima', count: receivedRequests.length },
    { id: 'new', name: 'Buat Permohonan', count: 0 }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-6">
        <div className="flex items-center space-x-3">
          <ArrowsRightLeftIcon className="h-8 w-8 text-blue-500" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pertukaran Syif</h1>
            <p className="text-gray-600 mt-1">Urus permohonan pertukaran syif dengan rakan sekerja</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 overflow-hidden">
        <div className="border-b border-gray-200/50">
          <nav className="-mb-px flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-4 px-6 text-center text-sm font-medium border-b-2 transition duration-200 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <span>{tab.name}</span>
                  {tab.count > 0 && (
                    <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                      {tab.count}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'sent' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Permohonan Yang Dihantar</h3>
              {sentRequests.length === 0 ? (
                <div className="text-center py-8">
                  <ArrowsRightLeftIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Tiada permohonan yang dihantar</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sentRequests.map((request) => {
                    const StatusIcon = getStatusIcon(request.status);
                    return (
                      <div key={request.id} className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition duration-200">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <UserIcon className="h-5 w-5 text-gray-500" />
                            <span className="font-medium text-gray-900">{request.targetUserName}</span>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                            <div className="flex items-center space-x-1">
                              <StatusIcon className="h-3 w-3" />
                              <span className="capitalize">{request.status}</span>
                            </div>
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <p className="text-sm text-gray-600">Syif Asal</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <div
                                className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
                                style={{
                                  backgroundColor: SHIFT_INFO[request.originalShift].color,
                                  color: SHIFT_INFO[request.originalShift].textColor
                                }}
                              >
                                {request.originalShift}
                              </div>
                              <span className="text-sm text-gray-900">
                                {format(new Date(request.originalDate), 'dd/MM/yyyy')}
                              </span>
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-sm text-gray-600">Syif Sasaran</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <div
                                className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
                                style={{
                                  backgroundColor: SHIFT_INFO[request.targetShift].color,
                                  color: SHIFT_INFO[request.targetShift].textColor
                                }}
                              >
                                {request.targetShift}
                              </div>
                              <span className="text-sm text-gray-900">
                                {format(new Date(request.targetDate), 'dd/MM/yyyy')}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {request.reason && (
                          <div>
                            <p className="text-sm text-gray-600">Sebab:</p>
                            <p className="text-sm text-gray-900 mt-1">{request.reason}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'received' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Permohonan Yang Diterima</h3>
              {receivedRequests.length === 0 ? (
                <div className="text-center py-8">
                  <ArrowsRightLeftIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Tiada permohonan yang diterima</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {receivedRequests.map((request) => (
                    <div key={request.id} className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition duration-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <UserIcon className="h-5 w-5 text-gray-500" />
                          <span className="font-medium text-gray-900">{request.requesterName}</span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {format(new Date(request.createdAt), 'dd/MM/yyyy HH:mm')}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600">Ingin Tukar</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <div
                              className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
                              style={{
                                backgroundColor: SHIFT_INFO[request.originalShift].color,
                                color: SHIFT_INFO[request.originalShift].textColor
                              }}
                            >
                              {request.originalShift}
                            </div>
                            <span className="text-sm text-gray-900">
                              {format(new Date(request.originalDate), 'dd/MM/yyyy')}
                            </span>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-600">Dengan Syif Anda</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <div
                              className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
                              style={{
                                backgroundColor: SHIFT_INFO[request.targetShift].color,
                                color: SHIFT_INFO[request.targetShift].textColor
                              }}
                            >
                              {request.targetShift}
                            </div>
                            <span className="text-sm text-gray-900">
                              {format(new Date(request.targetDate), 'dd/MM/yyyy')}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {request.reason && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-600">Sebab:</p>
                          <p className="text-sm text-gray-900 mt-1">{request.reason}</p>
                        </div>
                      )}
                      
                      {request.status === 'pending' && (
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleApprove(request.id)}
                            className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition duration-200 flex items-center justify-center space-x-2"
                          >
                            <CheckCircleIcon className="h-4 w-4" />
                            <span>Terima</span>
                          </button>
                          <button
                            onClick={() => handleReject(request.id)}
                            className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition duration-200 flex items-center justify-center space-x-2"
                          >
                            <XCircleIcon className="h-4 w-4" />
                            <span>Tolak</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'new' && (
            <div className="max-w-2xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Buat Permohonan Baharu</h3>
              <form onSubmit={handleSubmitExchange} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pilih Rakan Sekerja
                  </label>
                  <select
                    value={newExchange.targetUser}
                    onChange={(e) => setNewExchange({...newExchange, targetUser: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Pilih...</option>
                    <option value="raja">Raja Ahmad</option>
                    <option value="faeez">Khairul Faeez</option>
                    <option value="farid">Mohamad Farid</option>
                    <option value="tarmizie">Muhammad Tarmizie</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tarikh Syif Anda
                    </label>
                    <input
                      type="date"
                      value={newExchange.originalDate}
                      onChange={(e) => setNewExchange({...newExchange, originalDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tarikh Syif Sasaran
                    </label>
                    <input
                      type="date"
                      value={newExchange.targetDate}
                      onChange={(e) => setNewExchange({...newExchange, targetDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sebab Pertukaran
                  </label>
                  <textarea
                    value={newExchange.reason}
                    onChange={(e) => setNewExchange({...newExchange, reason: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nyatakan sebab pertukaran syif..."
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition duration-200 flex items-center justify-center space-x-2"
                >
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