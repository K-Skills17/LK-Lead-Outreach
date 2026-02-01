'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  AlertCircle,
  Shield,
  UserPlus,
  Mail,
  Phone,
  Building2,
  CheckCircle,
  Clock,
  MessageSquare,
  Loader2,
  ArrowRight,
  X,
} from 'lucide-react';

interface SDR {
  id: string;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  stats: {
    totalLeads: number;
    pendingLeads: number;
    sentLeads: number;
    totalCampaigns: number;
  };
}

interface Lead {
  id: string;
  nome: string;
  empresa: string;
  cargo?: string;
  phone: string;
  status: string;
  assigned_sdr_id?: string;
  created_at: string;
  campaigns?: {
    id: string;
    name: string;
  };
}

interface Campaign {
  id: string;
  name: string;
  status: string;
  assigned_sdr_id?: string;
  created_at: string;
}

interface OverviewData {
  sdrs: SDR[];
  campaigns: Campaign[];
  leads: Lead[];
  stats: {
    totalSDRs: number;
    totalCampaigns: number;
    totalLeads: number;
    pendingLeads: number;
    sentLeads: number;
    unassignedLeads: number;
    unreadReplies: number;
  };
}

export default function AdminDashboard() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [data, setData] = useState<OverviewData | null>(null);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'sdrs' | 'leads' | 'campaigns'>('overview');
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [assignSdrId, setAssignSdrId] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);

  useEffect(() => {
    const savedToken = sessionStorage.getItem('admin_token');
    if (savedToken) {
      setAuthToken(savedToken);
      setIsAuthenticated(true);
      loadOverview(savedToken);
    }
  }, []);

  const loadOverview = async (token: string) => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/overview', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        setIsAuthenticated(false);
        sessionStorage.removeItem('admin_token');
        setAuthToken('');
        return;
      }

      const overviewData = await response.json();
      setData(overviewData);
    } catch (err) {
      console.error('Error loading overview:', err);
      setError('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Login failed');
        setIsLoading(false);
        return;
      }

      const token = result.token;
      setAuthToken(token);
      sessionStorage.setItem('admin_token', token);
      setIsAuthenticated(true);
      await loadOverview(token);
    } catch (err) {
      setError('Network error. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignLeads = async () => {
    if (selectedLeads.size === 0 || !assignSdrId) {
      setError('Please select at least one lead and an SDR');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      const response = await fetch('/api/admin/assign-lead', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leadIds: Array.from(selectedLeads),
          sdrId: assignSdrId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign leads');
      }

      const result = await response.json();
      
      // Reload data
      await loadOverview(authToken);
      setSelectedLeads(new Set());
      setShowAssignModal(false);
      setAssignSdrId('');
      
      // Show success message
      alert(`✅ ${result.message || 'Leads assigned successfully!'}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to assign leads';
      setError(errorMessage);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-slate-700 to-blue-600 rounded-full mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">LK Lead Outreach - Internal Tool</p>
          </div>
          
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="admin@example.com"
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
            </div>
            
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-slate-700 to-blue-600 text-white py-3 px-4 rounded-lg hover:shadow-xl transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Logging in...</span>
                </>
              ) : (
                'Login'
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (isLoading && !data) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <button
              onClick={() => {
                sessionStorage.removeItem('admin_token');
                setIsAuthenticated(false);
              }}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-blue-600" />
              <span className="text-3xl font-bold text-gray-900">{data.stats.totalSDRs}</span>
            </div>
            <p className="text-sm text-gray-600">Active SDRs</p>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <MessageSquare className="w-8 h-8 text-slate-700" />
              <span className="text-3xl font-bold text-gray-900">{data.stats.totalLeads}</span>
            </div>
            <p className="text-sm text-gray-600">Total Leads</p>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-yellow-600" />
              <span className="text-3xl font-bold text-gray-900">{data.stats.pendingLeads}</span>
            </div>
            <p className="text-sm text-gray-600">Pending Leads</p>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <AlertCircle className="w-8 h-8 text-orange-600" />
              <span className="text-3xl font-bold text-gray-900">{data.stats.unassignedLeads}</span>
            </div>
            <p className="text-sm text-gray-600">Unassigned Leads</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow mb-6">
          <div className="border-b border-gray-200">
            <div className="flex space-x-1 px-6">
              {(['overview', 'sdrs', 'leads', 'campaigns'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedTab(tab)}
                  className={`px-4 py-3 font-semibold text-sm transition-colors capitalize ${
                    selectedTab === tab
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {selectedTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">SDRs Overview</h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.sdrs.map((sdr) => (
                      <div key={sdr.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-semibold text-gray-900">{sdr.name}</p>
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                            {sdr.role}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{sdr.email}</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-500">Leads:</span>
                            <span className="font-semibold ml-1">{sdr.stats.totalLeads}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Pending:</span>
                            <span className="font-semibold ml-1">{sdr.stats.pendingLeads}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SDRs Tab */}
            {selectedTab === 'sdrs' && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">All SDRs</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-4 font-medium text-gray-700">Name</th>
                        <th className="text-left py-2 px-4 font-medium text-gray-700">Email</th>
                        <th className="text-left py-2 px-4 font-medium text-gray-700">Role</th>
                        <th className="text-left py-2 px-4 font-medium text-gray-700">Total Leads</th>
                        <th className="text-left py-2 px-4 font-medium text-gray-700">Pending</th>
                        <th className="text-left py-2 px-4 font-medium text-gray-700">Campaigns</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.sdrs.map((sdr) => (
                        <tr key={sdr.id} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-4 font-medium">{sdr.name}</td>
                          <td className="py-2 px-4">{sdr.email}</td>
                          <td className="py-2 px-4">
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                              {sdr.role}
                            </span>
                          </td>
                          <td className="py-2 px-4">{sdr.stats.totalLeads}</td>
                          <td className="py-2 px-4">{sdr.stats.pendingLeads}</td>
                          <td className="py-2 px-4">{sdr.stats.totalCampaigns}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Leads Tab */}
            {selectedTab === 'leads' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">All Leads</h3>
                  <div className="flex gap-2">
                    {selectedLeads.size > 0 && (
                      <button
                        onClick={() => setShowAssignModal(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                      >
                        <UserPlus className="w-4 h-4" />
                        Assign {selectedLeads.size} Lead{selectedLeads.size > 1 ? 's' : ''}
                      </button>
                    )}
                    {data.leads.length === 0 && (
                      <p className="text-sm text-gray-500">No leads available. Send leads from your Lead Gen Tool.</p>
                    )}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-4">
                          <input
                            type="checkbox"
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedLeads(new Set(data.leads.map(l => l.id)));
                              } else {
                                setSelectedLeads(new Set());
                              }
                            }}
                            checked={selectedLeads.size === data.leads.length && data.leads.length > 0}
                          />
                        </th>
                        <th className="text-left py-2 px-4 font-medium text-gray-700">Name</th>
                        <th className="text-left py-2 px-4 font-medium text-gray-700">Company</th>
                        <th className="text-left py-2 px-4 font-medium text-gray-700">Phone</th>
                        <th className="text-left py-2 px-4 font-medium text-gray-700">Status</th>
                        <th className="text-left py-2 px-4 font-medium text-gray-700">Assigned To</th>
                        <th className="text-left py-2 px-4 font-medium text-gray-700">Campaign</th>
                        <th className="text-left py-2 px-4 font-medium text-gray-700">Date</th>
                        <th className="text-left py-2 px-4 font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.leads.map((lead) => {
                        const assignedSdr = data.sdrs.find(s => s.id === lead.assigned_sdr_id);
                        return (
                          <tr key={lead.id} className="border-b hover:bg-gray-50">
                            <td className="py-2 px-4">
                              <input
                                type="checkbox"
                                checked={selectedLeads.has(lead.id)}
                                onChange={(e) => {
                                  const newSet = new Set(selectedLeads);
                                  if (e.target.checked) {
                                    newSet.add(lead.id);
                                  } else {
                                    newSet.delete(lead.id);
                                  }
                                  setSelectedLeads(newSet);
                                }}
                              />
                            </td>
                            <td className="py-2 px-4 font-medium">{lead.nome || '-'}</td>
                            <td className="py-2 px-4">{lead.empresa || '-'}</td>
                            <td className="py-2 px-4">{lead.phone}</td>
                            <td className="py-2 px-4">
                              <span className={`px-2 py-1 rounded text-xs ${
                                lead.status === 'sent' ? 'bg-green-100 text-green-700' :
                                lead.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {lead.status}
                              </span>
                            </td>
                            <td className="py-2 px-4">
                              {assignedSdr ? (
                                <span className="text-sm">{assignedSdr.name}</span>
                              ) : (
                                <span className="text-sm text-gray-400">Unassigned</span>
                              )}
                            </td>
                            <td className="py-2 px-4 text-xs text-gray-600">
                              {lead.campaigns?.name || '-'}
                            </td>
                            <td className="py-2 px-4 text-xs text-gray-600">
                              {formatDate(lead.created_at)}
                            </td>
                            <td className="py-2 px-4">
                              <button
                                onClick={() => {
                                  setSelectedLeads(new Set([lead.id]));
                                  setShowAssignModal(true);
                                }}
                                className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 flex items-center gap-1"
                                title="Assign to SDR"
                              >
                                <UserPlus className="w-3 h-3" />
                                Assign
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Campaigns Tab */}
            {selectedTab === 'campaigns' && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">All Campaigns</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-4 font-medium text-gray-700">Name</th>
                        <th className="text-left py-2 px-4 font-medium text-gray-700">Status</th>
                        <th className="text-left py-2 px-4 font-medium text-gray-700">Assigned To</th>
                        <th className="text-left py-2 px-4 font-medium text-gray-700">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.campaigns.map((campaign) => {
                        const assignedSdr = data.sdrs.find(s => s.id === campaign.assigned_sdr_id);
                        return (
                          <tr key={campaign.id} className="border-b hover:bg-gray-50">
                            <td className="py-2 px-4 font-medium">{campaign.name}</td>
                            <td className="py-2 px-4">
                              <span className={`px-2 py-1 rounded text-xs ${
                                campaign.status === 'active' ? 'bg-green-100 text-green-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {campaign.status}
                              </span>
                            </td>
                            <td className="py-2 px-4">
                              {assignedSdr ? (
                                <span className="text-sm">{assignedSdr.name}</span>
                              ) : (
                                <span className="text-sm text-gray-400">Unassigned</span>
                              )}
                            </td>
                            <td className="py-2 px-4 text-xs text-gray-600">
                              {formatDate(campaign.created_at)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Assign Leads to SDR</h3>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setAssignSdrId('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {data.sdrs.length === 0 ? (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ No SDRs available. Create an SDR account first.
                </p>
                <p className="text-xs text-yellow-600 mt-1">
                  Use the create-sdr.ps1 script or see CREATE_SDR_ACCOUNT_GUIDE.md
                </p>
              </div>
            ) : (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select SDR
                </label>
                <select
                  value={assignSdrId}
                  onChange={(e) => setAssignSdrId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose an SDR...</option>
                  {data.sdrs.map((sdr) => (
                    <option key={sdr.id} value={sdr.id}>
                      {sdr.name} ({sdr.email}) - {sdr.stats.totalLeads} leads
                    </option>
                  ))}
                </select>
              </div>
            )}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={handleAssignLeads}
                disabled={!assignSdrId || isLoading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Assign {selectedLeads.size} Lead{selectedLeads.size > 1 ? 's' : ''}
              </button>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setAssignSdrId('');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
