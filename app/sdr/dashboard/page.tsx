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
  Image as ImageIcon,
  X,
  Play,
  Pause,
  Square,
  Send,
  BarChart3,
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
  landing_page_url?: string;
  analysis_image_url?: string;
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
  const [activeTab, setActiveTab] = useState<'overview' | 'leads' | 'replies' | 'emails' | 'whatsapp' | 'sending'>('overview');
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
  const [generatingLandingPage, setGeneratingLandingPage] = useState<string | null>(null);
  const [showManualUrlModal, setShowManualUrlModal] = useState(false);
  const [manualUrlLead, setManualUrlLead] = useState<Lead | null>(null);
  const [manualUrl, setManualUrl] = useState('');
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsappLead, setWhatsappLead] = useState<Lead | null>(null);
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [includeImagesInWhatsApp, setIncludeImagesInWhatsApp] = useState(true);
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
  const [sendingState, setSendingState] = useState<any>(null);
  const [queueStatus, setQueueStatus] = useState<any>(null);
  const [loadingSending, setLoadingSending] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showLeadDetail, setShowLeadDetail] = useState(false);

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
    loadSendingControl(token);
    loadQueueStatus(token);
    
    // Poll for updates every 10 seconds
    const interval = setInterval(() => {
      if (token) {
        loadSendingControl(token);
        loadQueueStatus(token);
      }
    }, 10000);
    
    return () => clearInterval(interval);
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

  const loadSendingControl = async (token: string) => {
    try {
      const userData = localStorage.getItem('sdr_user');
      if (!userData) return;

      const currentUser = JSON.parse(userData);
      const sdrId = currentUser.id;

      const response = await fetch('/api/sdr/sending/control', {
        headers: {
          'Authorization': `Bearer ${sdrId}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setSendingState(result);
      }
    } catch (err) {
      console.error('Error loading sending control:', err);
    }
  };

  const loadQueueStatus = async (token: string) => {
    try {
      const userData = localStorage.getItem('sdr_user');
      if (!userData) return;

      const currentUser = JSON.parse(userData);
      const sdrId = currentUser.id;

      const response = await fetch('/api/sdr/sending/queue', {
        headers: {
          'Authorization': `Bearer ${sdrId}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setQueueStatus(result);
      }
    } catch (err) {
      console.error('Error loading queue status:', err);
    }
  };

  const handleSendingAction = async (action: 'start' | 'stop' | 'pause' | 'resume') => {
    try {
      setLoadingSending(true);
      const userData = localStorage.getItem('sdr_user');
      if (!userData) {
        alert('❌ Authentication required');
        return;
      }

      const currentUser = JSON.parse(userData);
      const sdrId = currentUser.id;

      const response = await fetch('/api/sdr/sending/control', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sdrId}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        await loadSendingControl(sdrId);
        await loadQueueStatus(sdrId);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to perform action');
      }
    } catch (err) {
      console.error('Error performing sending action:', err);
      alert('Failed to perform action');
    } finally {
      setLoadingSending(false);
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
              <button
                onClick={() => {
                  setActiveTab('sending');
                  const token = localStorage.getItem('sdr_token');
                  if (token) {
                    loadSendingControl(token);
                    loadQueueStatus(token);
                  }
                }}
                className={`px-4 py-3 font-semibold text-sm transition-colors relative ${
                  activeTab === 'sending'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Sending Control
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
                        className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => {
                          setSelectedLead(lead);
                          setShowLeadDetail(true);
                        }}
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
                            {(lead.phone || (lead as any).whatsapp_phone || ((lead as any).potential_whatsapp_numbers?.length > 0)) && (
                              <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => {
                                    setWhatsappLead(lead);
                                    // Pre-fill with personalized message if available, or default
                                    const defaultMessage = (lead as any).personalized_message || 
                                      `Olá ${lead.nome || 'Cliente'}! 👋\n\nVi que você trabalha na ${lead.empresa || 'sua empresa'}.\n\nGostaria de uma conversa rápida para mostrar como podemos ajudar?\n\nAtenciosamente,\n${user?.name || 'Equipe LK Digital'}`;
                                    setWhatsappMessage(defaultMessage);
                                    setIncludeImagesInWhatsApp(true);
                                    setShowWhatsAppModal(true);
                                  }}
                                  className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 font-medium flex items-center gap-1.5"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  Send WhatsApp
                                </button>
                                {((lead as any).analysis_image_url || (lead as any).landing_page_url) && (
                                  <button
                                    onClick={async (e) => {
                                      e.stopPropagation();
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

            {/* Sending Control Tab */}
            {activeTab === 'sending' && (
              <div className="space-y-6">
                {/* Control Panel */}
                <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl shadow-xl border border-green-200/50 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">WhatsApp Sending Control</h3>
                      <p className="text-sm text-gray-600">Manage automated WhatsApp sending for your assigned leads</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {sendingState?.isRunning ? (
                        <>
                          {sendingState.isPaused ? (
                            <button
                              onClick={() => handleSendingAction('resume')}
                              disabled={loadingSending}
                              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 font-semibold disabled:opacity-50"
                            >
                              <Play className="w-5 h-5" />
                              {loadingSending ? 'Resuming...' : 'Resume'}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSendingAction('pause')}
                              disabled={loadingSending}
                              className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center gap-2 font-semibold disabled:opacity-50"
                            >
                              <Pause className="w-5 h-5" />
                              {loadingSending ? 'Pausing...' : 'Pause'}
                            </button>
                          )}
                          <button
                            onClick={() => handleSendingAction('stop')}
                            disabled={loadingSending}
                            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 font-semibold disabled:opacity-50"
                          >
                            <Square className="w-5 h-5" />
                            {loadingSending ? 'Stopping...' : 'Stop'}
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleSendingAction('start')}
                          disabled={loadingSending}
                          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 font-semibold disabled:opacity-50"
                        >
                          <Play className="w-5 h-5" />
                          {loadingSending ? 'Starting...' : 'Start Sending'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Status Display */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Status</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          sendingState?.isRunning
                            ? sendingState.isPaused
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {sendingState?.isRunning
                            ? sendingState.isPaused
                              ? '⏸ Paused'
                              : '▶ Running'
                            : '⏹ Stopped'}
                        </span>
                      </div>
                      {sendingState?.sessionStartedAt && (
                        <p className="text-xs text-gray-500 mt-1">
                          Started: {formatDate(sendingState.sessionStartedAt)}
                        </p>
                      )}
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Today</span>
                        <span className="text-lg font-bold text-gray-900">
                          {sendingState?.messagesSentToday || 0}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Limit: {queueStatus?.dailyLimit || 250}
                      </p>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">This Session</span>
                        <span className="text-lg font-bold text-gray-900">
                          {sendingState?.messagesSentSession || 0}
                        </span>
                      </div>
                      {sendingState?.lastMessageSentAt && (
                        <p className="text-xs text-gray-500">
                          Last: {formatDate(sendingState.lastMessageSentAt)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Queue Status */}
                  {queueStatus && (
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-3">Queue Status</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Ready to Send</p>
                          <p className="text-2xl font-bold text-green-600">{queueStatus.readyToSend || 0}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total Pending</p>
                          <p className="text-2xl font-bold text-gray-900">{queueStatus.totalPending || 0}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Remaining Today</p>
                          <p className="text-2xl font-bold text-blue-600">{queueStatus.remainingDaily || 0}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Skipped</p>
                          <p className="text-lg font-semibold text-orange-600">
                            {queueStatus.skipped?.tooRecent || 0} recent, {queueStatus.skipped?.weekend || 0} weekend
                          </p>
                        </div>
                      </div>
                      {queueStatus.isWeekend && (
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            ⚠️ Weekend detected - Sending is paused until Monday
                          </p>
                        </div>
                      )}
                      {queueStatus.isWorkingHours === false && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-800">
                            ⏰ Outside working hours - Sending will resume at {queueStatus.controlState?.pausedUntil ? formatDate(queueStatus.controlState.pausedUntil) : '10:00'}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Manual Trigger Section */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Manual Trigger</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={async () => {
                        try {
                          setLoadingSending(true);
                          const userData = localStorage.getItem('sdr_user');
                          if (!userData) {
                            alert('❌ Authentication required');
                            return;
                          }

                          const currentUser = JSON.parse(userData);
                          const sdrId = currentUser.id;

                          const response = await fetch('/api/outreach/process', {
                            method: 'POST',
                            headers: {
                              'Authorization': `Bearer ${sdrId}`,
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ maxMessages: 10, sdrId }),
                          });
                          const result = await response.json();
                          if (response.ok) {
                            alert(`Processed ${result.processed} messages. ${result.skipped} skipped.`);
                            await loadQueueStatus(sdrId);
                            await loadSendingControl(sdrId);
                          } else {
                            alert(result.error || 'Failed to process');
                          }
                        } catch (err) {
                          alert('Failed to trigger sending');
                        } finally {
                          setLoadingSending(false);
                        }
                      }}
                      disabled={loadingSending}
                      className="px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 font-semibold disabled:opacity-50"
                    >
                      <Send className="w-5 h-5" />
                      {loadingSending ? 'Processing...' : 'Process Queue Now (10 messages)'}
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          setLoadingSending(true);
                          const userData = localStorage.getItem('sdr_user');
                          if (!userData) {
                            alert('❌ Authentication required');
                            return;
                          }

                          const currentUser = JSON.parse(userData);
                          const sdrId = currentUser.id;

                          const response = await fetch('/api/outreach/process', {
                            method: 'POST',
                            headers: {
                              'Authorization': `Bearer ${sdrId}`,
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ maxMessages: 50, sdrId }),
                          });
                          const result = await response.json();
                          if (response.ok) {
                            alert(`Processed ${result.processed} messages. ${result.skipped} skipped.`);
                            await loadQueueStatus(sdrId);
                            await loadSendingControl(sdrId);
                          } else {
                            alert(result.error || 'Failed to process');
                          }
                        } catch (err) {
                          alert('Failed to trigger sending');
                        } finally {
                          setLoadingSending(false);
                        }
                      }}
                      disabled={loadingSending}
                      className="px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 font-semibold disabled:opacity-50"
                    >
                      <Send className="w-5 h-5" />
                      {loadingSending ? 'Processing...' : 'Process Queue Now (50 messages)'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Lead Detail Modal */}
      {showLeadDetail && selectedLead && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowLeadDetail(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-green-600 to-blue-600 p-6 text-white rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{selectedLead.nome}</h2>
                  <p className="text-green-100 mt-1">{selectedLead.empresa}</p>
                </div>
                <button
                  onClick={() => {
                    setShowLeadDetail(false);
                    setSelectedLead(null);
                  }}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Phone</p>
                  <p className="font-semibold text-gray-900">{selectedLead.phone}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    selectedLead.status === 'sent' ? 'bg-green-100 text-green-700' :
                    selectedLead.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {selectedLead.status}
                  </span>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Campaign</p>
                  <p className="font-semibold text-gray-900">{selectedLead.campaigns?.name || '-'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Created</p>
                  <p className="font-semibold text-gray-900">{formatDate(selectedLead.created_at)}</p>
                </div>
              </div>

              {/* Lead Gen Tool Data - Reports & Analysis */}
              {((selectedLead as any).report_url || (selectedLead as any).pdf_url || (selectedLead as any).drive_url || (selectedLead as any).mockup_url || (selectedLead as any).personalized_message || (selectedLead as any).dor_especifica) && (
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-200/50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Lead Gen Tool Data</h3>
                  </div>

                  {/* Business Analysis / Personalized Message */}
                  {((selectedLead as any).personalized_message || (selectedLead as any).dor_especifica) && (
                    <div className="bg-white/80 rounded-xl p-4 mb-4">
                      <p className="text-xs text-gray-500 mb-2 font-semibold">Business Analysis / Pain Point</p>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {(selectedLead as any).personalized_message || (selectedLead as any).dor_especifica}
                      </p>
                    </div>
                  )}

                  {/* Report URLs */}
                  {((selectedLead as any).report_url || (selectedLead as any).pdf_url || (selectedLead as any).drive_url || (selectedLead as any).mockup_url) && (
                    <div className="bg-white/80 rounded-xl p-4 mb-4">
                      <p className="text-xs text-gray-500 mb-3 font-semibold">📄 Reports & Documents</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {(selectedLead as any).report_url && (
                          <a
                            href={(selectedLead as any).report_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center text-sm font-medium flex items-center justify-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            View Report
                          </a>
                        )}
                        {(selectedLead as any).pdf_url && (
                          <a
                            href={(selectedLead as any).pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-center text-sm font-medium flex items-center justify-center gap-2"
                          >
                            📄 PDF Report
                          </a>
                        )}
                        {(selectedLead as any).drive_url && (
                          <a
                            href={(selectedLead as any).drive_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-center text-sm font-medium flex items-center justify-center gap-2"
                          >
                            📁 Drive Link
                          </a>
                        )}
                        {(selectedLead as any).mockup_url && (
                          <a
                            href={(selectedLead as any).mockup_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-center text-sm font-medium flex items-center justify-center gap-2"
                          >
                            🎨 Mockup
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Business Metrics */}
                  {((selectedLead as any).business_quality_score || (selectedLead as any).seo_score || (selectedLead as any).page_score || (selectedLead as any).rating || (selectedLead as any).reviews) && (
                    <div className="bg-white/80 rounded-xl p-4 mb-4">
                      <p className="text-xs text-gray-500 mb-3 font-semibold">📊 Business Metrics</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {(selectedLead as any).business_quality_score !== null && (selectedLead as any).business_quality_score !== undefined && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Quality Score</p>
                            <p className="text-lg font-bold text-gray-900">{(selectedLead as any).business_quality_score}/100</p>
                          </div>
                        )}
                        {(selectedLead as any).seo_score !== null && (selectedLead as any).seo_score !== undefined && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">SEO Score</p>
                            <p className="text-lg font-bold text-gray-900">{(selectedLead as any).seo_score}/100</p>
                          </div>
                        )}
                        {(selectedLead as any).page_score !== null && (selectedLead as any).page_score !== undefined && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Page Score</p>
                            <p className="text-lg font-bold text-gray-900">{(selectedLead as any).page_score}/100</p>
                          </div>
                        )}
                        {(selectedLead as any).rating && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Google Rating</p>
                            <p className="text-lg font-bold text-gray-900">⭐ {(selectedLead as any).rating}/5</p>
                            {(selectedLead as any).reviews && (
                              <p className="text-xs text-gray-500">({(selectedLead as any).reviews} reviews)</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Opportunities */}
                  {(selectedLead as any).opportunities && Array.isArray((selectedLead as any).opportunities) && (selectedLead as any).opportunities.length > 0 && (
                    <div className="bg-white/80 rounded-xl p-4 mb-4">
                      <p className="text-xs text-gray-500 mb-2 font-semibold">💡 Opportunities</p>
                      <div className="flex flex-wrap gap-2">
                        {(selectedLead as any).opportunities.map((opp: string, idx: number) => (
                          <span key={idx} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            {opp}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Enrichment: has_contact_page, has_booking_system, marketing_tags, potential WhatsApp numbers */}
                  {((selectedLead as any).has_contact_page !== undefined || (selectedLead as any).has_booking_system !== undefined || (selectedLead as any).marketing_tags || (selectedLead as any).potential_whatsapp_numbers?.length) && (
                    <div className="bg-white/80 rounded-xl p-4 mb-4">
                      <p className="text-xs text-gray-500 mb-3 font-semibold">📋 Enrichment (Contact / Booking / Tags)</p>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {(selectedLead as any).has_contact_page !== undefined && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            Has contact page: {(selectedLead as any).has_contact_page ? 'Yes' : 'No'}
                          </span>
                        )}
                        {(selectedLead as any).has_booking_system !== undefined && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            Has booking system: {(selectedLead as any).has_booking_system ? 'Yes' : 'No'}
                          </span>
                        )}
                      </div>
                      {(selectedLead as any).marketing_tags && (
                        <div className="mb-2">
                          <span className="text-gray-600 font-medium text-xs">Marketing tags: </span>
                          <span className="text-gray-700 text-sm">
                            {typeof (selectedLead as any).marketing_tags === 'object' && !Array.isArray((selectedLead as any).marketing_tags)
                              ? Object.entries((selectedLead as any).marketing_tags).filter(([, v]) => v).map(([k]) => k).join(', ')
                              : Array.isArray((selectedLead as any).marketing_tags)
                                ? (selectedLead as any).marketing_tags.join(', ')
                                : String((selectedLead as any).marketing_tags)}
                          </span>
                        </div>
                      )}
                      {(selectedLead as any).potential_whatsapp_numbers && (selectedLead as any).potential_whatsapp_numbers.length > 0 && (
                        <div>
                          <span className="text-gray-600 font-medium text-xs">Potential WhatsApp numbers: </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(selectedLead as any).potential_whatsapp_numbers.map((p: string, i: number) => (
                              <span key={i} className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs">{p}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Audit: rating, review_count, gpb_completeness_score, audit_results */}
                  {((selectedLead as any).gpb_completeness_score != null || (selectedLead as any).audit_results || (selectedLead as any).rating != null || (selectedLead as any).reviews != null) && (
                    <div className="bg-white/80 rounded-xl p-4 mb-4">
                      <p className="text-xs text-gray-500 mb-3 font-semibold">📊 Audit & GPB</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                        {(selectedLead as any).rating != null && (
                          <div>
                            <p className="text-xs text-gray-500 mb-0.5">Rating</p>
                            <p className="text-lg font-bold text-gray-900">⭐ {(selectedLead as any).rating}/5</p>
                          </div>
                        )}
                        {(selectedLead as any).reviews != null && (
                          <div>
                            <p className="text-xs text-gray-500 mb-0.5">Reviews</p>
                            <p className="text-lg font-bold text-gray-900">{(selectedLead as any).reviews}</p>
                          </div>
                        )}
                        {((selectedLead as any).gpb_completeness_score != null || (selectedLead as any).rating != null) && (
                          <div>
                            <p className="text-xs text-gray-500 mb-0.5">GPB completeness</p>
                            <p className="text-lg font-bold text-gray-900">
                              {(selectedLead as any).gpb_completeness_score != null && (selectedLead as any).gpb_completeness_score !== 25
                                ? `${(selectedLead as any).gpb_completeness_score}/100`
                                : (selectedLead as any).rating != null && ((selectedLead as any).reviews > 0 || (selectedLead as any).rating > 0)
                                  ? `${Math.round(Math.min(100, (selectedLead as any).rating / 5 * 40 + Math.min(60, ((selectedLead as any).reviews || 0) / 6.5)))}/100 (computed)`
                                  : (selectedLead as any).gpb_completeness_score != null ? `${(selectedLead as any).gpb_completeness_score}/100` : '-'}
                            </p>
                          </div>
                        )}
                      </div>
                      {(selectedLead as any).audit_results && Object.keys((selectedLead as any).audit_results).length > 0 && (
                        <div>
                          <p className="text-xs text-gray-500 mb-2 font-semibold">Audit results</p>
                          <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto max-h-40 overflow-y-auto">
                            {JSON.stringify((selectedLead as any).audit_results, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Enrichment Data */}
                  {((selectedLead as any).all_emails || (selectedLead as any).contact_names || (selectedLead as any).whatsapp_phone || (selectedLead as any).site) && (
                    <div className="bg-white/80 rounded-xl p-4">
                      <p className="text-xs text-gray-500 mb-3 font-semibold">🔗 Additional Information</p>
                      <div className="space-y-2 text-sm">
                        {(selectedLead as any).site && (
                          <div>
                            <span className="text-gray-600 font-medium">Website: </span>
                            <a href={(selectedLead as any).site} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              {(selectedLead as any).site}
                            </a>
                          </div>
                        )}
                        {(selectedLead as any).all_emails && Array.isArray((selectedLead as any).all_emails) && (selectedLead as any).all_emails.length > 0 && (
                          <div>
                            <span className="text-gray-600 font-medium">All Emails: </span>
                            <span className="text-gray-700">{(selectedLead as any).all_emails.join(', ')}</span>
                          </div>
                        )}
                        {(selectedLead as any).contact_names && Array.isArray((selectedLead as any).contact_names) && (selectedLead as any).contact_names.length > 0 && (
                          <div>
                            <span className="text-gray-600 font-medium">Contact Names: </span>
                            <span className="text-gray-700">{(selectedLead as any).contact_names.join(', ')}</span>
                          </div>
                        )}
                        {(selectedLead as any).whatsapp_phone && (
                          <div>
                            <span className="text-gray-600 font-medium">WhatsApp: </span>
                            <span className="text-gray-700">{(selectedLead as any).whatsapp_phone}</span>
                          </div>
                        )}
                        {(selectedLead as any).competitor_count !== null && (selectedLead as any).competitor_count !== undefined && (
                          <div>
                            <span className="text-gray-600 font-medium">Competitors Found: </span>
                            <span className="text-gray-700">{(selectedLead as any).competitor_count}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Visual Assets */}
              {((selectedLead as any).analysis_image_url || (selectedLead as any).landing_page_url) && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200/50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Visual Assets</h3>
                  </div>
                  
                  {(selectedLead as any).analysis_image_url && (
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-gray-700 mb-2">📊 Analysis Image</p>
                      <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <img 
                          src={(selectedLead as any).analysis_image_url} 
                          alt={`Analysis - ${selectedLead.empresa || selectedLead.nome}`}
                          className="w-full h-auto rounded-lg mb-3 max-h-96 object-contain"
                        />
                        <a
                          href={(selectedLead as any).analysis_image_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center text-sm font-medium"
                        >
                          Ver Imagem Completa
                        </a>
                      </div>
                    </div>
                  )}

                  {(selectedLead as any).landing_page_url && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">🎨 Landing Page Mockup</p>
                      <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <img 
                          src={(selectedLead as any).landing_page_url} 
                          alt={`Landing Page - ${selectedLead.empresa || selectedLead.nome}`}
                          className="w-full h-auto rounded-lg mb-3 max-h-96 object-contain"
                        />
                        <a
                          href={(selectedLead as any).landing_page_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-center text-sm font-medium"
                        >
                          Ver Landing Page Completa
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                {(selectedLead.phone || (selectedLead as any).whatsapp_phone || ((selectedLead as any).potential_whatsapp_numbers?.length > 0)) && (
                  <button
                    onClick={() => {
                      setShowLeadDetail(false);
                      setWhatsappLead(selectedLead);
                      const defaultMessage = (selectedLead as any).personalized_message || 
                        `Olá ${selectedLead.nome || 'Cliente'}! 👋\n\nVi que você trabalha na ${selectedLead.empresa || 'sua empresa'}.\n\nGostaria de uma conversa rápida para mostrar como podemos ajudar?\n\nAtenciosamente,\n${user?.name || 'Equipe LK Digital'}`;
                      setWhatsappMessage(defaultMessage);
                      setIncludeImagesInWhatsApp(true);
                      setShowWhatsAppModal(true);
                    }}
                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-5 h-5" />
                    Send WhatsApp
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowLeadDetail(false);
                    setSelectedLead(null);
                  }}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Landing Page URL Modal */}
      {showManualUrlModal && manualUrlLead && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {(manualUrlLead as any).landing_page_url ? 'Edit' : 'Add'} Landing Page URL
              </h3>
              <button
                onClick={() => {
                  setShowManualUrlModal(false);
                  setManualUrlLead(null);
                  setManualUrl('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Lead: <strong>{manualUrlLead.nome}</strong> ({manualUrlLead.empresa})
              </p>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Landing Page URL
              </label>
              <input
                type="url"
                value={manualUrl}
                onChange={(e) => setManualUrl(e.target.value)}
                placeholder="https://example.com/landing-page"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter a direct URL to the landing page image or mockup
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={async () => {
                  if (!manualUrl.trim()) {
                    alert('Please enter a valid URL');
                    return;
                  }

                  try {
                    const userData = localStorage.getItem('sdr_user');
                    if (!userData) {
                      alert('❌ Authentication required');
                      return;
                    }

                    const currentUser = JSON.parse(userData);
                    const sdrId = currentUser.id;

                    const response = await fetch('/api/sdr/leads/generate-landing-page', {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${sdrId}`,
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        contactId: manualUrlLead.id,
                        manualUrl: manualUrl.trim(),
                      }),
                    });

                    const result = await response.json();

                    if (response.ok && result.success) {
                      alert('✅ Landing page URL saved successfully!');
                      setShowManualUrlModal(false);
                      setManualUrlLead(null);
                      setManualUrl('');
                      // Reload dashboard
                      const token = sdrToken || localStorage.getItem('sdr_token');
                      if (token) {
                        loadDashboardData(token);
                      }
                    } else {
                      alert(`❌ ${result.error || 'Failed to save URL'}`);
                    }
                  } catch (err) {
                    alert('❌ Failed to save landing page URL');
                    console.error(err);
                  }
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setShowManualUrlModal(false);
                  setManualUrlLead(null);
                  setManualUrl('');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Message Crafting Modal */}
      {showWhatsAppModal && whatsappLead && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Craft WhatsApp Message</h3>
              <button
                onClick={() => {
                  setShowWhatsAppModal(false);
                  setWhatsappLead(null);
                  setWhatsappMessage('');
                  setIncludeImagesInWhatsApp(true);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>To:</strong> {whatsappLead.nome} ({whatsappLead.empresa}) - {whatsappLead.phone}
              </p>
              <p className="text-xs text-green-700 mt-1">
                💬 Human-like manual sending - This message will be sent immediately
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message Text
                </label>
                <textarea
                  value={whatsappMessage}
                  onChange={(e) => setWhatsappMessage(e.target.value)}
                  placeholder="Write your WhatsApp message here..."
                  rows={12}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Craft your personalized message. This is a manual, human-like send - no automation delays.
                </p>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <input
                  type="checkbox"
                  id="includeImagesSdr"
                  checked={includeImagesInWhatsApp}
                  onChange={(e) => setIncludeImagesInWhatsApp(e.target.checked)}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <label htmlFor="includeImagesSdr" className="text-sm text-gray-700 cursor-pointer">
                  Include analysis images and landing pages in message
                </label>
              </div>

              {((whatsappLead as any).analysis_image_url || (whatsappLead as any).landing_page_url) && includeImagesInWhatsApp && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-800 font-medium mb-2">Images that will be included:</p>
                  <ul className="text-xs text-blue-700 space-y-1">
                    {(whatsappLead as any).analysis_image_url && (
                      <li>• Analysis Image: {(whatsappLead as any).analysis_image_url}</li>
                    )}
                    {(whatsappLead as any).landing_page_url && (
                      <li>• Landing Page: {(whatsappLead as any).landing_page_url}</li>
                    )}
                  </ul>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={async () => {
                    if (!whatsappMessage.trim()) {
                      alert('Please enter a message');
                      return;
                    }

                    const userData = localStorage.getItem('sdr_user');
                    if (!userData) {
                      alert('❌ Authentication required');
                      router.push('/sdr/login');
                      return;
                    }

                    const currentUser = JSON.parse(userData);
                    const sdrId = currentUser.id;

                    try {
                      setSendingWhatsApp(true);
                      const response = await fetch('/api/whatsapp/send', {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${sdrId}`,
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          contactId: whatsappLead.id,
                          messageText: whatsappMessage,
                          skipChecks: true, // Manual send - skip all checks for human-like sending
                          includeImages: includeImagesInWhatsApp,
                        }),
                      });

                      const result = await response.json();

                      if (response.ok && result.success) {
                        alert('✅ WhatsApp message sent successfully!');
                        setShowWhatsAppModal(false);
                        setWhatsappLead(null);
                        setWhatsappMessage('');
                        setIncludeImagesInWhatsApp(true);
                        // Reload dashboard
                        const token = sdrToken || localStorage.getItem('sdr_token');
                        if (token) {
                          loadDashboardData(token);
                        }
                      } else {
                        alert(`❌ ${result.error || result.reason || 'Failed to send WhatsApp message'}`);
                      }
                    } catch (err) {
                      alert('❌ Failed to send WhatsApp message');
                      console.error(err);
                    } finally {
                      setSendingWhatsApp(false);
                    }
                  }}
                  disabled={sendingWhatsApp || !whatsappMessage.trim()}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2"
                >
                  {sendingWhatsApp ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-4 h-4" />
                      Send WhatsApp
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowWhatsAppModal(false);
                    setWhatsappLead(null);
                    setWhatsappMessage('');
                    setIncludeImagesInWhatsApp(true);
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
