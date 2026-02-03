'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  LogOut,
  Mail,
  MessageSquare,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Building2,
  Phone,
  Calendar,
  Smartphone,
  QrCode,
  Wifi,
  WifiOff,
  Eye,
  MousePointerClick,
} from 'lucide-react';
import { SimpleNavbar } from '@/components/ui/navbar';

interface SDRUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface DashboardStats {
  totalCampaigns: number;
  totalLeads: number;
  pendingLeads: number;
  sentLeads: number;
  unreadReplies: number;
}

interface Campaign {
  id: string;
  name: string;
  status: string;
  created_at: string;
}

interface Lead {
  id: string;
  nome: string;
  empresa: string;
  cargo?: string;
  phone: string;
  status: string;
  created_at: string;
  campaigns?: {
    id: string;
    name: string;
  };
}

interface Reply {
  id: string;
  message: string;
  received_at: string;
  is_read: boolean;
  campaign_contacts?: {
    id: string;
    nome: string;
    empresa: string;
    phone: string;
    campaigns?: {
      id: string;
      name: string;
    };
  };
}

export default function SDRDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<SDRUser | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'leads' | 'replies' | 'emails' | 'whatsapp'>('overview');
  const [emails, setEmails] = useState<any[]>([]);
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [whatsappSends, setWhatsappSends] = useState<any[]>([]);
  const [loadingWhatsappSends, setLoadingWhatsappSends] = useState(false);
  const [whatsappStatus, setWhatsappStatus] = useState<{
    connected: boolean;
    phone: string | null;
    connectedAt: string | null;
    lastSeen: string | null;
  } | null>(null);
  const [connectingWhatsapp, setConnectingWhatsapp] = useState(false);
  const [sdrToken, setSdrToken] = useState<string | null>(null);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('sdr_token');
    const userData = localStorage.getItem('sdr_user');

    if (!token || !userData) {
      router.push('/sdr/login');
      return;
    }

    setSdrToken(token);
    setUser(JSON.parse(userData));
    loadDashboardData(token);
    loadWhatsappStatus(token);
    loadEmails(token);
    loadWhatsappSends(token);
  }, [router]);

  const loadDashboardData = async (token: string) => {
    try {
      // Get SDR ID from user data
      const userData = localStorage.getItem('sdr_user');
      if (!userData) {
        router.push('/sdr/login');
        return;
      }

      const currentUser = JSON.parse(userData);
      const sdrId = currentUser.id;

      const response = await fetch('/api/sdr/dashboard', {
        headers: {
          'Authorization': `Bearer ${sdrId}`,
        },
      });

      if (response.status === 401) {
        // Token invalid, redirect to login
        localStorage.removeItem('sdr_token');
        localStorage.removeItem('sdr_user');
        router.push('/sdr/login');
        return;
      }

      const data = await response.json();

      if (data.sdr) {
        setUser(data.sdr);
        localStorage.setItem('sdr_user', JSON.stringify(data.sdr));
      }

      if (data.stats) {
        setStats(data.stats);
      }

      if (data.campaigns) {
        setCampaigns(data.campaigns);
      }

      if (data.recentLeads) {
        setLeads(data.recentLeads);
      }

      if (data.unreadReplies) {
        setReplies(data.unreadReplies);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadWhatsappStatus = async (token: string) => {
    try {
      const userData = localStorage.getItem('sdr_user');
      if (!userData) return;

      const currentUser = JSON.parse(userData);
      const sdrId = currentUser.id;

      const response = await fetch('/api/sdr/whatsapp/status', {
        headers: {
          'Authorization': `Bearer ${sdrId}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setWhatsappStatus({
          connected: data.connected,
          phone: data.phone,
          connectedAt: data.connectedAt,
          lastSeen: data.lastSeen,
        });
      }
    } catch (error) {
      console.error('Error loading WhatsApp status:', error);
    }
  };

  const handleConnectWhatsapp = async () => {
    try {
      setConnectingWhatsapp(true);
      const userData = localStorage.getItem('sdr_user');
      if (!userData) return;

      const currentUser = JSON.parse(userData);
      const sdrId = currentUser.id;

      const response = await fetch('/api/sdr/whatsapp/connect', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sdrId}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        // Open WhatsApp Web in a new window
        const whatsappWindow = window.open(
          'https://web.whatsapp.com',
          'whatsapp-web',
          'width=1200,height=800,scrollbars=yes,resizable=yes'
        );
        
        if (whatsappWindow) {
          // Show instructions
          alert(`WhatsApp Web is opening in a new window.\n\n1. Scan the QR code with your WhatsApp mobile app\n2. Keep the WhatsApp Web window open for sending messages\n3. Click "I've Connected" below once you've scanned the code`);
        } else {
          alert('Please allow pop-ups for this site, then try again.');
        }
        
        // Refresh status after a delay
        setTimeout(() => {
          loadWhatsappStatus(sdrId);
        }, 2000);
      } else {
        const error = await response.json();
        alert(`Failed to connect: ${error.error}`);
      }
    } catch (error) {
      console.error('Error connecting WhatsApp:', error);
      alert('Failed to initiate WhatsApp connection');
    } finally {
      setConnectingWhatsapp(false);
    }
  };

  const handleConfirmConnection = async () => {
    try {
      const userData = localStorage.getItem('sdr_user');
      if (!userData) return;

      const currentUser = JSON.parse(userData);
      const sdrId = currentUser.id;

      // Get phone number from user (optional, can be detected later)
      const phone = prompt('Enter your WhatsApp phone number (optional, e.g., +5511999999999):');
      
      const response = await fetch('/api/sdr/whatsapp/connect', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${sdrId}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          connected: true,
          phone: phone || null,
        }),
      });

      if (response.ok) {
        alert('WhatsApp connection confirmed! You can now send messages manually through WhatsApp Web.');
        loadWhatsappStatus(sdrId);
      } else {
        const error = await response.json();
        alert(`Failed to confirm connection: ${error.error}`);
      }
    } catch (error) {
      console.error('Error confirming connection:', error);
      alert('Failed to confirm WhatsApp connection');
    }
  };

  const handleDisconnectWhatsapp = async () => {
    if (!confirm('Are you sure you want to disconnect your WhatsApp?')) {
      return;
    }

    try {
      const userData = localStorage.getItem('sdr_user');
      if (!userData) return;

      const currentUser = JSON.parse(userData);
      const sdrId = currentUser.id;

      const response = await fetch('/api/sdr/whatsapp/connect', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${sdrId}`,
        },
      });

      if (response.ok) {
        await loadWhatsappStatus(sdrId);
        alert('WhatsApp disconnected successfully');
      } else {
        const error = await response.json();
        alert(`Failed to disconnect: ${error.error}`);
      }
    } catch (error) {
      console.error('Error disconnecting WhatsApp:', error);
      alert('Failed to disconnect WhatsApp');
    }
  };

  const loadWhatsappSends = async (token: string) => {
    try {
      setLoadingWhatsappSends(true);
      const userData = localStorage.getItem('sdr_user');
      if (!userData) return;

      const currentUser = JSON.parse(userData);
      const sdrId = currentUser.id;

      const response = await fetch(`/api/whatsapp/history?sdrId=${sdrId}&limit=50`, {
        headers: {
          'Authorization': `Bearer ${sdrId}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setWhatsappSends(result.history || []);
      }
    } catch (err) {
      console.error('Error loading WhatsApp sends:', err);
    } finally {
      setLoadingWhatsappSends(false);
    }
  };

  const loadEmails = async (token: string) => {
    try {
      setLoadingEmails(true);
      const userData = localStorage.getItem('sdr_user');
      if (!userData) return;

      const currentUser = JSON.parse(userData);
      const sdrId = currentUser.id;

      const response = await fetch('/api/sdr/emails', {
        headers: {
          'Authorization': `Bearer ${sdrId}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEmails(data.emails || []);
      }
    } catch (error) {
      console.error('Error loading emails:', error);
    } finally {
      setLoadingEmails(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('sdr_token');
    localStorage.removeItem('sdr_user');
    router.push('/sdr/login');
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <SimpleNavbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back, {user?.name}!
              </h1>
              <p className="text-gray-600">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>

          {/* WhatsApp Connection Status */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {whatsappStatus?.connected ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <Wifi className="w-5 h-5" />
                    <div>
                      <p className="font-semibold">WhatsApp Connected</p>
                      {whatsappStatus.phone && (
                        <p className="text-sm text-gray-600">{whatsappStatus.phone}</p>
                      )}
                      {whatsappStatus.connectedAt && (
                        <p className="text-xs text-gray-500">
                          Connected: {formatDate(whatsappStatus.connectedAt)}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-gray-500">
                    <WifiOff className="w-5 h-5" />
                    <div>
                      <p className="font-semibold">WhatsApp Not Connected</p>
                      <p className="text-sm text-gray-500">Connect your WhatsApp to send messages</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {whatsappStatus?.connected ? (
                  <button
                    onClick={handleDisconnectWhatsapp}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-2"
                  >
                    <WifiOff className="w-4 h-4" />
                    <span>Disconnect</span>
                  </button>
                ) : (
                  <button
                    onClick={handleConnectWhatsapp}
                    disabled={connectingWhatsapp}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {connectingWhatsapp ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Connecting...</span>
                      </>
                    ) : (
                      <>
                        <QrCode className="w-4 h-4" />
                        <span>Connect WhatsApp</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
            {!whatsappStatus?.connected && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                <p className="text-sm text-blue-800">
                  <strong>How to connect:</strong> Click "Connect WhatsApp" above to open WhatsApp Web in a new window. Scan the QR code with your WhatsApp mobile app, then click "I've Connected" below.
                </p>
                <button
                  onClick={handleConfirmConnection}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  I've Connected ✓
                </button>
              </div>
            )}
            {whatsappStatus?.connected && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>✓ Connected!</strong> Keep WhatsApp Web open in your browser to send messages manually. You can see your assigned leads in the queue below.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <Building2 className="w-8 h-8 text-blue-600" />
                <span className="text-2xl font-bold text-gray-900">{stats.totalCampaigns}</span>
              </div>
              <p className="text-sm text-gray-600">Campaigns</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 text-slate-700" />
                <span className="text-2xl font-bold text-gray-900">{stats.totalLeads}</span>
              </div>
              <p className="text-sm text-gray-600">Total Leads</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-8 h-8 text-yellow-600" />
                <span className="text-2xl font-bold text-gray-900">{stats.pendingLeads}</span>
              </div>
              <p className="text-sm text-gray-600">Pending</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <span className="text-2xl font-bold text-gray-900">{stats.sentLeads}</span>
              </div>
              <p className="text-sm text-gray-600">Sent</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <MessageSquare className="w-8 h-8 text-purple-600" />
                <span className="text-2xl font-bold text-gray-900">{stats.unreadReplies}</span>
              </div>
              <p className="text-sm text-gray-600">Unread Replies</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-xl mb-6">
          <div className="border-b border-gray-200">
            <div className="flex space-x-1 px-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-3 font-semibold text-sm transition-colors ${
                  activeTab === 'overview'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('leads')}
                className={`px-4 py-3 font-semibold text-sm transition-colors ${
                  activeTab === 'leads'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Leads ({leads.length})
              </button>
              <button
                onClick={() => setActiveTab('replies')}
                className={`px-4 py-3 font-semibold text-sm transition-colors relative ${
                  activeTab === 'replies'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Replies
                {stats && stats.unreadReplies > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                    {stats.unreadReplies}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('emails')}
                className={`px-4 py-3 font-semibold text-sm transition-colors relative ${
                  activeTab === 'emails'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Emails ({emails.length})
              </button>
              <button
                onClick={() => {
                  setActiveTab('whatsapp');
                  const token = localStorage.getItem('sdr_token');
                  if (token) loadWhatsappSends(token);
                }}
                className={`px-4 py-3 font-semibold text-sm transition-colors relative ${
                  activeTab === 'whatsapp'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                WhatsApp ({whatsappSends.length})
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Recent Campaigns */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Campaigns</h3>
                  {campaigns.length === 0 ? (
                    <p className="text-gray-500">No campaigns assigned yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {campaigns.slice(0, 5).map((campaign) => (
                        <div
                          key={campaign.id}
                          className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-gray-900">{campaign.name}</p>
                              <p className="text-sm text-gray-500">
                                {formatDate(campaign.created_at)}
                              </p>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                campaign.status === 'active'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {campaign.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Leads */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Leads</h3>
                  {leads.length === 0 ? (
                    <p className="text-gray-500">No leads assigned yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {leads.slice(0, 5).map((lead) => (
                        <div
                          key={lead.id}
                          className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-gray-900">{lead.nome}</p>
                              <p className="text-sm text-gray-600">{lead.empresa}</p>
                              {lead.cargo && (
                                <p className="text-xs text-gray-500">{lead.cargo}</p>
                              )}
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                lead.status === 'sent'
                                  ? 'bg-green-100 text-green-700'
                                  : lead.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {lead.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Leads Tab */}
            {activeTab === 'leads' && (
              <div>
                {leads.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No leads assigned yet.</p>
                ) : (
                  <div className="space-y-3">
                    {leads.map((lead) => (
                      <div
                        key={lead.id}
                        className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <p className="font-semibold text-gray-900">{lead.nome}</p>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  lead.status === 'sent'
                                    ? 'bg-green-100 text-green-700'
                                    : lead.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {lead.status}
                              </span>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-gray-700 flex items-center gap-2">
                                <Building2 className="w-4 h-4" />
                                {lead.empresa}
                              </p>
                              {lead.cargo && (
                                <p className="text-sm text-gray-600">{lead.cargo}</p>
                              )}
                              <p className="text-sm text-gray-600 flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                {lead.phone}
                              </p>
                              {lead.campaigns && (
                                <p className="text-xs text-gray-500">
                                  Campaign: {lead.campaigns.name}
                                </p>
                              )}
                              {(lead as any).lastEmailSentAt && (
                                <p className="text-xs text-green-600 font-medium mt-1">
                                  📧 Email sent: {formatDate((lead as any).lastEmailSentAt)}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500 mb-2">
                              {formatDate(lead.created_at)}
                            </p>
                            {lead.status === 'pending' && lead.phone && (
                              <div className="flex flex-col gap-2">
                                <button
                                  onClick={async () => {
                                    if (!confirm(`Send WhatsApp message to ${lead.nome}?`)) return;
                                    
                                    const userData = localStorage.getItem('sdr_user');
                                    if (!userData) {
                                      alert('❌ Authentication required');
                                      router.push('/sdr/login');
                                      return;
                                    }
                                    
                                    const currentUser = JSON.parse(userData);
                                    const sdrId = currentUser.id;
                                    
                                    try {
                                      const response = await fetch('/api/whatsapp/send', {
                                        method: 'POST',
                                        headers: {
                                          'Authorization': `Bearer ${sdrId}`,
                                          'Content-Type': 'application/json',
                                        },
                                        body: JSON.stringify({
                                          contactId: lead.id,
                                          skipChecks: true, // Allow manual send
                                          includeImages: true, // Include images
                                        }),
                                      });
                                      
                                      const result = await response.json();
                                      
                                      if (response.ok && result.success) {
                                        alert('✅ WhatsApp message sent!');
                                        // Reload dashboard
                                        const token = sdrToken || localStorage.getItem('sdr_token');
                                        if (token) {
                                          loadDashboardData(token);
                                        }
                                      } else {
                                        alert(`❌ ${result.error || result.reason || 'Failed to send message'}`);
                                      }
                                    } catch (err) {
                                      alert('❌ Failed to send WhatsApp message');
                                      console.error(err);
                                    }
                                  }}
                                  className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 font-medium flex items-center gap-1.5"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  Send WhatsApp
                                </button>
                                {((lead as any).analysis_image_url || (lead as any).landing_page_url) && (
                                  <button
                                    onClick={async () => {
                                      if (!confirm(`Send photo/image to ${lead.nome} via WhatsApp?`)) return;
                                      
                                      const userData = localStorage.getItem('sdr_user');
                                      if (!userData) {
                                        alert('❌ Authentication required');
                                        router.push('/sdr/login');
                                        return;
                                      }
                                      
                                      const currentUser = JSON.parse(userData);
                                      const sdrId = currentUser.id;
                                      
                                      // Build message with image links
                                      const imageUrl = (lead as any).analysis_image_url || (lead as any).landing_page_url;
                                      const imageType = (lead as any).analysis_image_url ? 'Análise Visual' : 'Landing Page';
                                      
                                      try {
                                        const response = await fetch('/api/whatsapp/send', {
                                          method: 'POST',
                                          headers: {
                                            'Authorization': `Bearer ${sdrId}`,
                                            'Content-Type': 'application/json',
                                          },
                                          body: JSON.stringify({
                                            contactId: lead.id,
                                            messageText: `📸 ${imageType} para ${lead.empresa || lead.nome}:\n\n${imageUrl}`,
                                            skipChecks: true,
                                            includeImages: false, // Already including in messageText
                                          }),
                                        });
                                        
                                        const result = await response.json();
                                        
                                        if (response.ok && result.success) {
                                          alert('✅ Photo sent via WhatsApp!');
                                          const token = sdrToken || localStorage.getItem('sdr_token');
                                          if (token) {
                                            loadDashboardData(token);
                                          }
                                        } else {
                                          alert(`❌ ${result.error || result.reason || 'Failed to send photo'}`);
                                        }
                                      } catch (err) {
                                        alert('❌ Failed to send photo');
                                        console.error(err);
                                      }
                                    }}
                                    className="px-3 py-1.5 bg-orange-600 text-white text-xs rounded-lg hover:bg-orange-700 font-medium flex items-center gap-1.5"
                                  >
                                    <ImageIcon className="w-3.5 h-3.5" />
                                    Send Photo
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Replies Tab */}
            {activeTab === 'replies' && (
              <div>
                {replies.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No unread replies.</p>
                ) : (
                  <div className="space-y-3">
                    {replies.map((reply) => (
                      <div
                        key={reply.id}
                        className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-semibold text-gray-900">
                              {reply.campaign_contacts?.nome || 'Unknown'}
                            </p>
                            <p className="text-sm text-gray-600">
                              {reply.campaign_contacts?.empresa}
                            </p>
                            <p className="text-xs text-gray-500">
                              {reply.campaign_contacts?.phone}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">
                              {formatDate(reply.received_at)}
                            </p>
                            {!reply.is_read && (
                              <span className="inline-block mt-1 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                                New
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="p-3 bg-white rounded-lg border border-gray-200">
                          <p className="text-sm text-gray-700">{reply.message}</p>
                        </div>
                        {reply.campaign_contacts?.campaigns && (
                          <p className="text-xs text-gray-500 mt-2">
                            Campaign: {reply.campaign_contacts.campaigns.name}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Emails Tab */}
            {activeTab === 'emails' && (
              <div>
                {loadingEmails ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                    <p className="text-gray-600">Loading emails...</p>
                  </div>
                ) : emails.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No emails sent to your leads yet.</p>
                ) : (
                  <div className="space-y-4">
                    {emails.map((email) => (
                      <div
                        key={email.id}
                        className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <p className="font-semibold text-gray-900">{email.subject}</p>
                              <div className="flex items-center gap-2">
                                {email.is_opened && (
                                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
                                    <Eye className="w-3 h-3" />
                                    Opened
                                  </span>
                                )}
                                {email.is_clicked && (
                                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center gap-1">
                                    <MousePointerClick className="w-3 h-3" />
                                    Clicked
                                  </span>
                                )}
                                {!email.is_opened && (
                                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                                    Not Opened
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              To: <span className="font-medium">{email.lead_email}</span>
                            </p>
                            {email.campaign_contacts && (
                              <p className="text-sm text-gray-600">
                                Lead: <span className="font-medium">{email.campaign_contacts.nome} - {email.campaign_contacts.empresa}</span>
                              </p>
                            )}
                            {email.campaigns && (
                              <p className="text-xs text-gray-500 mt-1">
                                Campaign: {email.campaigns.name}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">
                              {formatDate(email.sent_at)}
                            </p>
                            {email.open_count > 0 && (
                              <p className="text-xs text-gray-600 mt-1">
                                Opened {email.open_count}x
                              </p>
                            )}
                            {email.click_count > 0 && (
                              <p className="text-xs text-gray-600">
                                Clicked {email.click_count}x
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                          <p className="text-xs text-gray-500 mb-2">Email Content:</p>
                          <div 
                            className="text-sm text-gray-700 prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: email.html_content || email.text_content || 'No content' }}
                          />
                        </div>
                        {email.clicked_urls && email.clicked_urls.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-500 mb-1">Clicked URLs:</p>
                            <div className="flex flex-wrap gap-2">
                              {email.clicked_urls.map((url: string, idx: number) => (
                                <a
                                  key={idx}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline"
                                >
                                  {url}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* WhatsApp Tab */}
            {activeTab === 'whatsapp' && (
              <div>
                {loadingWhatsappSends ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                    <p className="text-gray-600">Loading WhatsApp sends...</p>
                  </div>
                ) : whatsappSends.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No WhatsApp messages sent yet.</p>
                ) : (
                  <div className="space-y-4">
                    {whatsappSends.map((send: any) => (
                      <div
                        key={send.id}
                        className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <p className="font-semibold text-gray-900">{send.lead_name} - {send.lead_company}</p>
                              <div className="flex items-center gap-2">
                                {send.is_delivered && (
                                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" />
                                    Delivered
                                  </span>
                                )}
                                {send.is_read && (
                                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center gap-1">
                                    <Eye className="w-3 h-3" />
                                    Read
                                  </span>
                                )}
                                {send.is_failed && (
                                  <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                                    Failed
                                  </span>
                                )}
                                {send.sent_by_system && (
                                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                                    Auto
                                  </span>
                                )}
                                {!send.sent_by_system && (
                                  <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full">
                                    Manual
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              To: <span className="font-medium">{send.lead_phone}</span>
                            </p>
                            <p className="text-sm text-gray-700 mt-2 bg-white p-3 rounded border border-gray-200">
                              {send.message_text || send.personalized_message}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                              Sent: {formatDate(send.sent_at)}
                              {send.delay_seconds && ` • Delay: ${send.delay_seconds}s`}
                              {send.break_type && ` • After ${send.break_type} break`}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">
                              {formatDate(send.sent_at)}
                            </p>
                            {send.sent_by_system && (
                              <p className="text-xs text-purple-600 mt-1">
                                Automatic
                              </p>
                            )}
                            {!send.sent_by_system && (
                              <p className="text-xs text-gray-600 mt-1">
                                Manual
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
