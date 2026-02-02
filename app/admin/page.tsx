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
  Sparkles,
  TrendingUp,
  Zap,
  Eye,
  Calendar,
  BarChart3,
  MousePointerClick,
  Play,
  Pause,
  Square,
  Settings,
  Send,
  Trash2,
  Image as ImageIcon,
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
  email?: string;
  status: string;
  assigned_sdr_id?: string;
  created_at: string;
  campaigns?: {
    id: string;
    name: string;
  };
  personalization?: {
    score: number;
    tier: 'VIP' | 'HOT' | 'WARM' | 'COLD';
    intro?: string;
    painPoints?: string[];
    ctaText?: string;
    ctaType?: string;
  } | null;
  sendTime?: {
    optimalSendAt: string;
    dayOfWeek?: number;
    hourOfDay?: number;
    reason?: string;
    confidenceScore?: number;
    historicalOpenRate?: number;
  } | null;
  lastEmailSentAt?: string | null;
}

interface Campaign {
  id: string;
  name: string;
  status: string;
  assigned_sdr_id?: string;
  created_at: string;
}

interface AIStrategySuggestion {
  title: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  recommendedAction: string;
  category: 'personalization' | 'ab_testing' | 'send_time' | 'campaign_optimization' | 'lead_quality';
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
    vipLeads?: number;
    hotLeads?: number;
    avgPersonalizationScore?: number;
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
  const [selectedTab, setSelectedTab] = useState<'overview' | 'sdrs' | 'leads' | 'campaigns' | 'emails' | 'whatsapp' | 'sending'>('overview');
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [assignSdrId, setAssignSdrId] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showLeadDetail, setShowLeadDetail] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AIStrategySuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailLead, setEmailLead] = useState<Lead | null>(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailHistory, setEmailHistory] = useState<any[]>([]);
  const [emailStats, setEmailStats] = useState<any>(null);
  const [loadingEmailHistory, setLoadingEmailHistory] = useState(false);
  const [whatsappHistory, setWhatsappHistory] = useState<any[]>([]);
  const [whatsappStats, setWhatsappStats] = useState<any>(null);
  const [loadingWhatsappHistory, setLoadingWhatsappHistory] = useState(false);
  const [sendingState, setSendingState] = useState<any>(null);
  const [queueStatus, setQueueStatus] = useState<any>(null);
  const [sendingSettings, setSendingSettings] = useState<any[]>([]);
  const [loadingSending, setLoadingSending] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [editingSettings, setEditingSettings] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingLeads, setDeletingLeads] = useState(false);
  const [leadsToDelete, setLeadsToDelete] = useState<string[]>([]);
  const [generatingImage, setGeneratingImage] = useState<string | null>(null); // contactId being generated
  const [generatingLandingPage, setGeneratingLandingPage] = useState<string | null>(null); // contactId being generated
  const [showDebugModal, setShowDebugModal] = useState(false);
  const [debugData, setDebugData] = useState<any>(null);
  const [loadingDebug, setLoadingDebug] = useState(false);

  useEffect(() => {
    const savedToken = sessionStorage.getItem('admin_token');
    if (savedToken) {
      setAuthToken(savedToken);
      setIsAuthenticated(true);
      loadOverview(savedToken);
      loadSendingControl(savedToken);
      loadQueueStatus(savedToken);
      loadSendingSettings(savedToken);
      
      // Poll for updates every 10 seconds
      const interval = setInterval(() => {
        if (savedToken) {
          loadSendingControl(savedToken);
          loadQueueStatus(savedToken);
        }
      }, 10000);
      
      return () => clearInterval(interval);
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
      
      // Load AI suggestions
      loadAISuggestions(token);
      
      // Load email history
      loadEmailHistory(token);
      // Load WhatsApp history
      loadWhatsappHistory(token);
    } catch (err) {
      console.error('Error loading overview:', err);
      setError('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAISuggestions = async (token: string) => {
    try {
      setLoadingSuggestions(true);
      const response = await fetch('/api/admin/ai-strategist', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setAiSuggestions(result.suggestions || []);
      }
    } catch (err) {
      console.error('Error loading AI suggestions:', err);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const loadEmailHistory = async (token: string) => {
    try {
      setLoadingEmailHistory(true);
      const response = await fetch('/api/admin/emails/history', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setEmailHistory(result.emails || []);
        setEmailStats(result.stats || null);
      }
    } catch (err) {
      console.error('Error loading email history:', err);
    } finally {
      setLoadingEmailHistory(false);
    }
  };

  const loadSendingControl = async (token: string) => {
    try {
      const response = await fetch('/api/admin/sending/control', {
        headers: {
          'Authorization': `Bearer ${token}`,
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
      const response = await fetch('/api/admin/sending/queue', {
        headers: {
          'Authorization': `Bearer ${token}`,
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

  const loadSendingSettings = async (token: string) => {
    try {
      const response = await fetch('/api/admin/sending/settings', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setSendingSettings(result.settings || []);
      }
    } catch (err) {
      console.error('Error loading sending settings:', err);
    }
  };

  const handleSendingAction = async (action: 'start' | 'stop' | 'pause' | 'resume', pauseDuration?: number) => {
    try {
      setLoadingSending(true);
      const response = await fetch('/api/admin/sending/control', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, pauseDuration }),
      });

      if (response.ok) {
        await loadSendingControl(authToken);
        await loadQueueStatus(authToken);
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

  const loadWhatsappHistory = async (token: string) => {
    try {
      setLoadingWhatsappHistory(true);
      const response = await fetch('/api/whatsapp/history?limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setWhatsappHistory(result.history || []);
        
        // Use stats from API response, or calculate if not available
        if (result.stats) {
          setWhatsappStats({
            totalWhatsapp: result.stats.total,
            delivered: result.stats.delivered,
            read: result.stats.read,
            auto: result.stats.auto,
            manual: result.stats.manual,
            failed: result.history?.filter((s: any) => s.is_failed).length || 0,
          });
        } else {
          // Fallback: calculate stats
          const total = result.history?.length || 0;
          const delivered = result.history?.filter((s: any) => s.is_delivered).length || 0;
          const read = result.history?.filter((s: any) => s.is_read).length || 0;
          const failed = result.history?.filter((s: any) => s.is_failed).length || 0;
          const auto = result.history?.filter((s: any) => s.sent_by_system).length || 0;
          const manual = result.history?.filter((s: any) => !s.sent_by_system).length || 0;
          
          setWhatsappStats({
            totalWhatsapp: total,
            delivered,
            read,
            failed,
            auto,
            manual,
          });
        }
      }
    } catch (err) {
      console.error('Error loading WhatsApp history:', err);
    } finally {
      setLoadingWhatsappHistory(false);
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

  const handleDeleteLeads = async (leadIds: string[]) => {
    if (leadIds.length === 0) {
      setError('No leads selected for deletion');
      return;
    }

    try {
      setDeletingLeads(true);
      setError('');
      
      // Build query string for bulk delete
      const idsParam = leadIds.join(',');
      const response = await fetch(`/api/admin/leads/delete?ids=${idsParam}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete leads');
      }

      const result = await response.json();
      
      // Reload data
      await loadOverview(authToken);
      setSelectedLeads(new Set());
      setShowDeleteConfirm(false);
      setLeadsToDelete([]);
      
      // Show success message
      alert(`✅ Successfully deleted ${result.deleted || leadIds.length} lead(s)`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete leads';
      setError(errorMessage);
      console.error(err);
    } finally {
      setDeletingLeads(false);
    }
  };

  const handleGenerateImage = async (contactId: string, force: boolean = false) => {
    try {
      setGeneratingImage(contactId);
      setError('');

      const response = await fetch('/api/admin/leads/generate-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contactId,
          force,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate image');
      }

      if (result.alreadyExists) {
        alert('ℹ️ Image already exists for this lead');
      } else {
        alert(`✅ Image generated successfully!`);
      }

      // Reload data to show new image
      await loadOverview(authToken);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate image';
      setError(errorMessage);
      alert(`❌ ${errorMessage}`);
      console.error(err);
    } finally {
      setGeneratingImage(null);
    }
  };

  const handleGenerateLandingPage = async (contactId: string, force: boolean = false) => {
    try {
      setGeneratingLandingPage(contactId);
      setError('');

      const response = await fetch('/api/admin/leads/generate-landing-page', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contactId,
          force,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate landing page');
      }

      if (result.alreadyExists) {
        alert('ℹ️ Landing page already exists for this lead');
      } else {
        alert(`✅ Landing page generated successfully!`);
      }

      // Reload data to show new landing page
      await loadOverview(authToken);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate landing page';
      setError(errorMessage);
      alert(`❌ ${errorMessage}`);
      console.error(err);
    } finally {
      setGeneratingLandingPage(null);
    }
  };

  const confirmDelete = () => {
    const idsToDelete = leadsToDelete.length > 0 ? leadsToDelete : Array.from(selectedLeads);
    if (idsToDelete.length === 0) {
      setError('No leads selected for deletion');
      return;
    }
    handleDeleteLeads(idsToDelete);
  };

  const openDeleteConfirm = (leadId?: string) => {
    if (leadId) {
      setLeadsToDelete([leadId]);
    } else {
      setLeadsToDelete(Array.from(selectedLeads));
    }
    setShowDeleteConfirm(true);
  };

  const loadDebugData = async () => {
    try {
      setLoadingDebug(true);
      setError('');
      const response = await fetch('/api/integration/leads/debug', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load debug data');
      }

      const result = await response.json();
      setDebugData(result.debug);
      setShowDebugModal(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load debug data';
      setError(errorMessage);
      console.error(err);
    } finally {
      setLoadingDebug(false);
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

  const getTierColor = (tier?: string) => {
    switch (tier) {
      case 'VIP': return 'bg-gradient-to-r from-purple-500 to-pink-500';
      case 'HOT': return 'bg-gradient-to-r from-orange-500 to-red-500';
      case 'WARM': return 'bg-gradient-to-r from-yellow-400 to-orange-400';
      case 'COLD': return 'bg-gradient-to-r from-blue-400 to-cyan-400';
      default: return 'bg-gray-400';
    }
  };

  const getTierBadgeColor = (tier?: string) => {
    switch (tier) {
      case 'VIP': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'HOT': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'WARM': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'COLD': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      {/* Modern Header with Navigation */}
      <header className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Admin Dashboard
                </h1>
                <p className="text-xs text-gray-500">LK Lead Outreach</p>
              </div>
            </div>
            <button
              onClick={() => {
                sessionStorage.removeItem('admin_token');
                setIsAuthenticated(false);
              }}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
          
          {/* Navigation Tabs */}
          <nav className="flex space-x-1 border-b border-gray-200">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'ai-strategist', label: 'AI Strategist', icon: Sparkles },
              { id: 'ab-lab', label: 'A/B Lab', icon: BarChart3, href: '/admin/ab-lab' },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = tab.href ? false : selectedTab === tab.id;
              
              if (tab.href) {
                return (
                  <a
                    key={tab.id}
                    href={tab.href}
                    className="flex items-center gap-2 px-4 py-3 font-semibold text-sm transition-colors relative"
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </a>
                );
              }
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 font-semibold text-sm transition-colors relative ${
                    isActive
                      ? 'text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-full" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Modern Stats Cards with AI Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <span className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                {data.stats.totalSDRs}
              </span>
            </div>
            <p className="text-sm font-medium text-gray-600">Active SDRs</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center shadow-lg">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <span className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                {data.stats.totalLeads}
              </span>
            </div>
            <p className="text-sm font-medium text-gray-600">Total Leads</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <span className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                {data.stats.pendingLeads}
              </span>
            </div>
            <p className="text-sm font-medium text-gray-600">Pending Leads</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <span className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                {data.stats.unassignedLeads}
              </span>
            </div>
            <p className="text-sm font-medium text-gray-600">Unassigned Leads</p>
          </div>
        </div>

        {/* AI Insights Cards */}
        {(data.stats.vipLeads !== undefined || data.stats.avgPersonalizationScore !== undefined) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-xl p-6 text-white">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Zap className="w-6 h-6" />
                </div>
                <span className="text-3xl font-bold">{data.stats.vipLeads || 0}</span>
              </div>
              <p className="text-sm font-medium text-white/90">VIP Leads</p>
              <p className="text-xs text-white/70 mt-1">High-priority opportunities</p>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl shadow-xl p-6 text-white">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <span className="text-3xl font-bold">{data.stats.hotLeads || 0}</span>
              </div>
              <p className="text-sm font-medium text-white/90">HOT Leads</p>
              <p className="text-xs text-white/70 mt-1">Strong interest signals</p>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-xl p-6 text-white">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <span className="text-3xl font-bold">{data.stats.avgPersonalizationScore || 0}%</span>
              </div>
              <p className="text-sm font-medium text-white/90">Avg Personalization</p>
              <p className="text-xs text-white/70 mt-1">AI analysis quality score</p>
            </div>
          </div>
        )}

        {/* AI Strategist Suggestions */}
        {aiSuggestions.length > 0 && (
          <div className="mb-8">
            <div className="bg-gradient-to-br from-slate-800 via-purple-900 to-slate-800 rounded-2xl shadow-2xl p-6 border border-purple-500/20 relative overflow-hidden">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32" />
              
              {/* Header */}
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Sparkles className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">AI Strategist Suggestions</h2>
                    <p className="text-sm text-purple-200">Real-time campaign optimization insights</p>
                  </div>
                </div>
                {loadingSuggestions && (
                  <Loader2 className="w-5 h-5 animate-spin text-purple-300" />
                )}
              </div>

              {/* Suggestions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
                {aiSuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20 hover:bg-white/15 transition-all duration-300"
                  >
                    {/* Title and Impact Badge */}
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-bold text-white flex-1 pr-2">
                        {suggestion.title}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                          suggestion.impact === 'HIGH'
                            ? 'bg-orange-500/80 text-white'
                            : suggestion.impact === 'MEDIUM'
                            ? 'bg-blue-500/80 text-white'
                            : 'bg-gray-500/80 text-white'
                        }`}
                      >
                        {suggestion.impact} IMPACT
                      </span>
                    </div>

                    {/* Description */}
                    <div className="bg-white/5 rounded-lg p-3 mb-3">
                      <p className="text-sm text-purple-100 leading-relaxed">
                        {suggestion.description}
                      </p>
                    </div>

                    {/* Recommended Action */}
                    <div>
                      <p className="text-xs font-semibold text-purple-300 mb-2">RECOMMENDED ACTION</p>
                      <p className="text-sm text-white leading-relaxed">
                        {suggestion.recommendedAction}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Modern Tabs */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 mb-6 overflow-hidden">
          <div className="border-b border-gray-200/50 bg-gradient-to-r from-gray-50 to-blue-50/30">
            <div className="flex space-x-2 px-6">
              {(['overview', 'sdrs', 'leads', 'campaigns', 'emails', 'whatsapp', 'sending'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedTab(tab)}
                  className={`px-6 py-4 font-semibold text-sm transition-all duration-200 capitalize relative ${
                    selectedTab === tab
                      ? 'text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {selectedTab === tab && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-full" />
                  )}
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
                    <button
                      onClick={loadDebugData}
                      disabled={loadingDebug}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2 disabled:opacity-50"
                      title="Debug Integration"
                    >
                      {loadingDebug ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <BarChart3 className="w-4 h-4" />
                          Debug
                        </>
                      )}
                    </button>
                    {selectedLeads.size > 0 && (
                      <>
                        <button
                          onClick={() => setShowAssignModal(true)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                        >
                          <UserPlus className="w-4 h-4" />
                          Assign {selectedLeads.size} Lead{selectedLeads.size > 1 ? 's' : ''}
                        </button>
                        <button
                          onClick={() => openDeleteConfirm()}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete {selectedLeads.size} Lead{selectedLeads.size > 1 ? 's' : ''}
                        </button>
                      </>
                    )}
                    {data.leads.length === 0 && (
                      <p className="text-sm text-gray-500">No leads available. Send leads from your Lead Gen Tool.</p>
                    )}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50/50">
                        <th className="text-left py-3 px-4">
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
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Company</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Phone</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">AI Tier</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Score</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Assigned</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Campaign</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Análise</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Email Sent</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.leads.map((lead) => {
                        const assignedSdr = data.sdrs.find(s => s.id === lead.assigned_sdr_id);
                        const tier = lead.personalization?.tier;
                        const score = lead.personalization?.score;
                        return (
                          <tr 
                            key={lead.id} 
                            className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 transition-all duration-200 cursor-pointer"
                            onClick={() => {
                              setSelectedLead(lead);
                              setShowLeadDetail(true);
                            }}
                          >
                            <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={selectedLeads.has(lead.id)}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  const newSet = new Set(selectedLeads);
                                  if (e.target.checked) {
                                    newSet.add(lead.id);
                                  } else {
                                    newSet.delete(lead.id);
                                  }
                                  setSelectedLeads(newSet);
                                }}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                            </td>
                            <td className="py-3 px-4 font-semibold text-gray-900">{lead.nome || '-'}</td>
                            <td className="py-3 px-4 text-gray-700">{lead.empresa || '-'}</td>
                            <td className="py-3 px-4 text-gray-600 font-mono text-sm">{lead.phone}</td>
                            <td className="py-3 px-4">
                              {tier ? (
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getTierBadgeColor(tier)}`}>
                                  {tier}
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400">-</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {score !== undefined ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full ${getTierColor(tier)}`}
                                      style={{ width: `${score}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-semibold text-gray-700">{score}%</span>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400">-</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                lead.status === 'sent' ? 'bg-green-100 text-green-700 border border-green-200' :
                                lead.status === 'pending' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                                'bg-gray-100 text-gray-700 border border-gray-200'
                              }`}>
                                {lead.status}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              {assignedSdr ? (
                                <span className="text-sm font-medium text-gray-700">{assignedSdr.name}</span>
                              ) : (
                                <span className="text-sm text-gray-400 italic">Unassigned</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-xs text-gray-600 font-medium">
                              {lead.campaigns?.name || '-'}
                            </td>
                            <td className="py-3 px-4">
                              {((lead as any).analysis_image_url || (lead as any).landing_page_url) ? (
                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium flex items-center gap-1 w-fit">
                                  📊 Disponível
                                </span>
                              ) : (
                                <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full font-medium">
                                  -
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-xs text-gray-500">
                              {(lead as any).lastEmailSentAt ? (
                                <span className="text-green-600 font-medium">
                                  {formatDate((lead as any).lastEmailSentAt)}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-xs text-gray-500">
                              {formatDate(lead.created_at)}
                            </td>
                            <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center gap-2">
                                {lead.email && (
                                  <button
                                    onClick={() => {
                                      setEmailLead(lead);
                                      setEmailSubject(`Oportunidade para ${lead.empresa || lead.nome}`);
                                      setEmailContent(`Olá ${lead.nome || 'Cliente'}!\n\nVi que você trabalha na ${lead.empresa || 'sua empresa'}.\n\nGostaria de uma conversa rápida para mostrar como podemos ajudar?\n\nAtenciosamente,\nEquipe LK Digital`);
                                      setShowEmailModal(true);
                                    }}
                                    className="px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 rounded-lg hover:bg-green-100 border border-green-200 flex items-center gap-1.5 transition-colors"
                                    title="Send Email"
                                  >
                                    <Mail className="w-3.5 h-3.5" />
                                    Email
                                  </button>
                                )}
                                <button
                                  onClick={() => handleGenerateImage(lead.id, false)}
                                  disabled={generatingImage === lead.id}
                                  className="px-3 py-1.5 text-xs font-medium bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 border border-purple-200 flex items-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Generate Analysis Image"
                                >
                                  {generatingImage === lead.id ? (
                                    <>
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      Generating...
                                    </>
                                  ) : (
                                    <>
                                      <ImageIcon className="w-3.5 h-3.5" />
                                      Image
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedLeads(new Set([lead.id]));
                                    setShowAssignModal(true);
                                  }}
                                  className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 border border-blue-200 flex items-center gap-1.5 transition-colors"
                                  title="Assign to SDR"
                                >
                                  <UserPlus className="w-3.5 h-3.5" />
                                  Assign
                                </button>
                                <button
                                  onClick={() => openDeleteConfirm(lead.id)}
                                  className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 rounded-lg hover:bg-red-100 border border-red-200 flex items-center gap-1.5 transition-colors"
                                  title="Delete Lead"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Emails Tab */}
            {selectedTab === 'emails' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Email History</h3>
                  {emailStats && (
                    <div className="flex items-center gap-4 text-sm">
                      <div className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg">
                        <span className="font-semibold">{emailStats.totalEmails}</span> Total
                      </div>
                      <div className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg">
                        <span className="font-semibold">{emailStats.openedEmails}</span> Opened ({emailStats.avgOpenRate.toFixed(1)}%)
                      </div>
                      <div className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg">
                        <span className="font-semibold">{emailStats.clickedEmails}</span> Clicked ({emailStats.avgClickRate.toFixed(1)}%)
                      </div>
                    </div>
                  )}
                </div>
                {loadingEmailHistory ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                    <p className="text-gray-600">Loading email history...</p>
                  </div>
                ) : emailHistory.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No emails sent yet.</p>
                ) : (
                  <div className="space-y-4">
                    {emailHistory.map((email: any) => (
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
                                {email.is_bounced && (
                                  <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                                    Bounced
                                  </span>
                                )}
                                {!email.is_opened && !email.is_bounced && (
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
                            {email.sdr_users && (
                              <p className="text-xs text-gray-500 mt-1">
                                SDR: <span className="font-medium">{email.sdr_users.name}</span>
                              </p>
                            )}
                            {email.campaigns && (
                              <p className="text-xs text-gray-500">
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
            {selectedTab === 'whatsapp' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">WhatsApp Send History</h3>
                  {whatsappStats && (
                    <div className="flex items-center gap-4 text-sm">
                      <div className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg">
                        <span className="font-semibold">{whatsappStats.totalWhatsapp}</span> Total
                      </div>
                      <div className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg">
                        <span className="font-semibold">{whatsappStats.delivered}</span> Delivered
                      </div>
                      <div className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg">
                        <span className="font-semibold">{whatsappStats.read}</span> Read
                      </div>
                      <div className="px-3 py-1.5 bg-orange-50 text-orange-700 rounded-lg">
                        <span className="font-semibold">{whatsappStats.auto}</span> Auto
                      </div>
                      <div className="px-3 py-1.5 bg-gray-50 text-gray-700 rounded-lg">
                        <span className="font-semibold">{whatsappStats.manual || 0}</span> Manual
                      </div>
                    </div>
                  )}
                </div>
                {loadingWhatsappHistory ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                    <p className="text-gray-600">Loading WhatsApp history...</p>
                  </div>
                ) : whatsappHistory.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No WhatsApp messages sent yet.</p>
                ) : (
                  <div className="space-y-4">
                    {whatsappHistory.map((send: any) => (
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
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Sending Control Tab */}
            {selectedTab === 'sending' && (
              <div className="space-y-6">
                {/* Control Panel */}
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl shadow-xl border border-blue-200/50 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Sending Control</h3>
                      <p className="text-sm text-gray-600">Manage automated email and WhatsApp sending</p>
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
                          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-semibold disabled:opacity-50"
                        >
                          <Play className="w-5 h-5" />
                          {loadingSending ? 'Starting...' : 'Start Sending'}
                        </button>
                      )}
                      <button
                        onClick={() => {
                          // Load default settings or existing active settings
                          const defaultSettings = sendingSettings.find((s: any) => s.is_active) || {
                            humanMode: true,
                            delayBetweenMessages: 60,
                            delayVariation: 0.2,
                            coffeeBreakInterval: 15,
                            coffeeBreakDuration: 900,
                            longBreakInterval: 50,
                            longBreakDuration: 2700,
                            workingHoursEnabled: true,
                            startTime: '10:00',
                            endTime: '18:00',
                            daysSinceLastContact: 3,
                            dailyLimit: 250,
                            whatsappEnabled: true,
                            emailEnabled: true,
                          };
                          setEditingSettings(defaultSettings);
                          setShowSettingsModal(true);
                        }}
                        className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2 font-semibold"
                      >
                        <Settings className="w-5 h-5" />
                        Settings
                      </button>
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
                          const response = await fetch('/api/outreach/process', {
                            method: 'POST',
                            headers: {
                              'Authorization': `Bearer ${authToken}`,
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ maxMessages: 10 }),
                          });
                          const result = await response.json();
                          if (response.ok) {
                            alert(`Processed ${result.processed} messages. ${result.skipped} skipped.`);
                            await loadQueueStatus(authToken);
                            await loadSendingControl(authToken);
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
                      {loadingSending ? 'Processing...' : 'Process Queue Now (10 messages)'}
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          setLoadingSending(true);
                          const response = await fetch('/api/outreach/process', {
                            method: 'POST',
                            headers: {
                              'Authorization': `Bearer ${authToken}`,
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ maxMessages: 50 }),
                          });
                          const result = await response.json();
                          if (response.ok) {
                            alert(`Processed ${result.processed} messages. ${result.skipped} skipped.`);
                            await loadQueueStatus(authToken);
                            await loadSendingControl(authToken);
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
                      className="px-6 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2 font-semibold disabled:opacity-50"
                    >
                      <Send className="w-5 h-5" />
                      {loadingSending ? 'Processing...' : 'Process Queue Now (50 messages)'}
                    </button>
                  </div>
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

      {/* Lead Detail Modal with AI Insights */}
      {showLeadDetail && selectedLead && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowLeadDetail(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{selectedLead.nome}</h2>
                  <p className="text-blue-100 mt-1">{selectedLead.empresa}</p>
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

              {/* AI Personalization Insights */}
              {selectedLead.personalization && (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200/50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">AI Personalization Analysis</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-white/80 rounded-xl p-4">
                      <p className="text-xs text-gray-500 mb-1">Lead Tier</p>
                      <span className={`px-4 py-2 rounded-full text-sm font-bold ${getTierBadgeColor(selectedLead.personalization.tier)}`}>
                        {selectedLead.personalization.tier}
                      </span>
                    </div>
                    <div className="bg-white/80 rounded-xl p-4">
                      <p className="text-xs text-gray-500 mb-2">Personalization Score</p>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${getTierColor(selectedLead.personalization.tier)}`}
                            style={{ width: `${selectedLead.personalization.score}%` }}
                          />
                        </div>
                        <span className="text-lg font-bold text-gray-900">{selectedLead.personalization.score}%</span>
                      </div>
                    </div>
                  </div>

                  {selectedLead.personalization.intro && (
                    <div className="bg-white/80 rounded-xl p-4 mb-4">
                      <p className="text-xs text-gray-500 mb-2 font-semibold">Personalized Intro</p>
                      <p className="text-gray-700 leading-relaxed italic">"{selectedLead.personalization.intro}"</p>
                    </div>
                  )}

                  {selectedLead.personalization.painPoints && selectedLead.personalization.painPoints.length > 0 && (
                    <div className="bg-white/80 rounded-xl p-4 mb-4">
                      <p className="text-xs text-gray-500 mb-2 font-semibold">Identified Pain Points</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedLead.personalization.painPoints.map((point, idx) => (
                          <span key={idx} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                            {point}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedLead.personalization.ctaText && (
                    <div className="bg-white/80 rounded-xl p-4">
                      <p className="text-xs text-gray-500 mb-2 font-semibold">Recommended CTA</p>
                      <p className="text-gray-700 font-medium">{selectedLead.personalization.ctaText}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Optimal Send Time */}
              {selectedLead.sendTime && (
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-200/50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Optimal Send Time</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-white/80 rounded-xl p-4">
                      <p className="text-xs text-gray-500 mb-1">Best Time</p>
                      <p className="font-bold text-gray-900 text-lg">
                        {new Date(selectedLead.sendTime.optimalSendAt).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    {selectedLead.sendTime.confidenceScore !== undefined && (
                      <div className="bg-white/80 rounded-xl p-4">
                        <p className="text-xs text-gray-500 mb-1">Confidence</p>
                        <p className="font-bold text-gray-900 text-lg">{selectedLead.sendTime.confidenceScore}%</p>
                      </div>
                    )}
                  </div>

                  {selectedLead.sendTime.reason && (
                    <div className="bg-white/80 rounded-xl p-4">
                      <p className="text-xs text-gray-500 mb-2 font-semibold">Reasoning</p>
                      <p className="text-gray-700">{selectedLead.sendTime.reason}</p>
                    </div>
                  )}

                  {selectedLead.sendTime.historicalOpenRate !== undefined && (
                    <div className="bg-white/80 rounded-xl p-4 mt-4">
                      <p className="text-xs text-gray-500 mb-1">Historical Open Rate</p>
                      <p className="font-bold text-gray-900">{selectedLead.sendTime.historicalOpenRate}%</p>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setSelectedLeads(new Set([selectedLead.id]));
                    setShowLeadDetail(false);
                    setShowAssignModal(true);
                  }}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-5 h-5" />
                  Assign to SDR
                </button>
                <button
                  onClick={() => {
                    setShowLeadDetail(false);
                    openDeleteConfirm(selectedLead.id);
                  }}
                  className="px-4 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-5 h-5" />
                  Delete
                </button>
                <button
                  onClick={() => setShowLeadDetail(false)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-red-600">Confirm Deletion</h3>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setLeadsToDelete([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-4">
              <p className="text-gray-700 mb-2">
                Are you sure you want to delete <strong>{leadsToDelete.length}</strong> lead{leadsToDelete.length > 1 ? 's' : ''}?
              </p>
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  ⚠️ <strong>Warning:</strong> This action cannot be undone. All related data (emails, WhatsApp messages, contact history) will also be deleted.
                </p>
              </div>
            </div>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={confirmDelete}
                disabled={deletingLeads}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deletingLeads ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete {leadsToDelete.length} Lead{leadsToDelete.length > 1 ? 's' : ''}
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setLeadsToDelete([]);
                }}
                disabled={deletingLeads}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Debug Modal */}
      {showDebugModal && debugData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Integration Debug Information</h3>
              <button
                onClick={() => {
                  setShowDebugModal(false);
                  setDebugData(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-600 font-medium mb-1">Total Leads</p>
                  <p className="text-2xl font-bold text-blue-900">{debugData.totalLeadsInDatabase || 0}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <p className="text-sm text-green-600 font-medium mb-1">Recent Leads</p>
                  <p className="text-2xl font-bold text-green-900">{debugData.recentLeadsCount || 0}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <p className="text-sm text-purple-600 font-medium mb-1">Campaigns</p>
                  <p className="text-2xl font-bold text-purple-900">{debugData.campaignsCount || 0}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <p className="text-sm text-red-600 font-medium mb-1">Orphaned</p>
                  <p className="text-2xl font-bold text-red-900">{debugData.orphanedLeads?.length || 0}</p>
                </div>
              </div>

              {/* Recent Leads */}
              {debugData.recentLeads && debugData.recentLeads.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Recent Leads (Last 10)</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                          <th className="text-left py-2 px-3">Name</th>
                          <th className="text-left py-2 px-3">Company</th>
                          <th className="text-left py-2 px-3">Phone</th>
                          <th className="text-left py-2 px-3">Status</th>
                          <th className="text-left py-2 px-3">Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {debugData.recentLeads.map((lead: any) => (
                          <tr key={lead.id} className="border-b border-gray-100">
                            <td className="py-2 px-3">{lead.nome || '-'}</td>
                            <td className="py-2 px-3">{lead.empresa || '-'}</td>
                            <td className="py-2 px-3 font-mono text-xs">{lead.phone || '-'}</td>
                            <td className="py-2 px-3">
                              <span className={`px-2 py-1 rounded text-xs ${
                                lead.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                lead.status === 'sent' ? 'bg-green-100 text-green-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {lead.status || 'unknown'}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-xs text-gray-500">
                              {lead.created_at ? new Date(lead.created_at).toLocaleString() : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Recent Campaigns */}
              {debugData.campaigns && debugData.campaigns.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Recent Campaigns (Last 10)</h4>
                  <div className="space-y-2">
                    {debugData.campaigns.map((campaign: any) => (
                      <div key={campaign.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{campaign.name || 'Unnamed Campaign'}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {campaign.location || 'No location'} • {campaign.keyword || 'No keyword'}
                            </p>
                          </div>
                          <p className="text-xs text-gray-400">
                            {campaign.created_at ? new Date(campaign.created_at).toLocaleDateString() : '-'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Orphaned Leads */}
              {debugData.orphanedLeads && debugData.orphanedLeads.length > 0 && (
                <div>
                  <h4 className="font-semibold text-red-600 mb-3">⚠️ Orphaned Leads (No Campaign)</h4>
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800 mb-2">
                      These leads exist but don't have a campaign assigned. This indicates a problem.
                    </p>
                    <div className="space-y-1">
                      {debugData.orphanedLeads.map((lead: any) => (
                        <div key={lead.id} className="text-sm text-red-700">
                          • {lead.nome || lead.empresa || 'Unknown'} ({lead.id.substring(0, 8)}...)
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Errors */}
              {debugData.errors && Object.values(debugData.errors).some((err: any) => err !== null) && (
                <div>
                  <h4 className="font-semibold text-red-600 mb-3">Errors</h4>
                  <div className="space-y-2">
                    {Object.entries(debugData.errors).map(([key, error]: [string, any]) => {
                      if (!error) return null;
                      return (
                        <div key={key} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="font-medium text-red-800 text-sm">{key}</p>
                          <p className="text-xs text-red-600 mt-1">{error}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* No Data Message */}
              {debugData.recentLeadsCount === 0 && debugData.campaignsCount === 0 && (
                <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                  <p className="text-yellow-800 font-medium">No leads or campaigns found in database</p>
                  <p className="text-sm text-yellow-600 mt-2">
                    This could mean:
                    <br />• No leads have been sent yet
                    <br />• There's a database connection issue
                    <br />• Leads are being created in a different table
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setShowDebugModal(false);
                  setDebugData(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sending Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Sending Cadence Settings</h3>
              <button
                onClick={() => {
                  setShowSettingsModal(false);
                  setEditingSettings(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Delay Settings */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-4">Delay Between Messages</h4>
                <div className="space-y-4">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={editingSettings?.humanMode !== false}
                      onChange={(e) => setEditingSettings({ ...editingSettings, humanMode: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Human Mode (60-210 seconds random delay)</span>
                  </label>
                  {editingSettings?.humanMode === false && (
                    <div className="ml-7 space-y-2">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Base Delay (seconds)</label>
                        <input
                          type="number"
                          min="5"
                          max="600"
                          value={editingSettings?.delayBetweenMessages || 60}
                          onChange={(e) => setEditingSettings({ ...editingSettings, delayBetweenMessages: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Variation (±%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="5"
                          value={(editingSettings?.delayVariation || 0.2) * 100}
                          onChange={(e) => setEditingSettings({ ...editingSettings, delayVariation: parseFloat(e.target.value) / 100 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Break Settings */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-4">Break Settings</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Coffee Break (every N messages)</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={editingSettings?.coffeeBreakInterval || 15}
                      onChange={(e) => setEditingSettings({ ...editingSettings, coffeeBreakInterval: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Coffee Break Duration (minutes)</label>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={(editingSettings?.coffeeBreakDuration || 900) / 60}
                      onChange={(e) => setEditingSettings({ ...editingSettings, coffeeBreakDuration: parseInt(e.target.value) * 60 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Long Break (every N messages)</label>
                    <input
                      type="number"
                      min="1"
                      max="200"
                      value={editingSettings?.longBreakInterval || 50}
                      onChange={(e) => setEditingSettings({ ...editingSettings, longBreakInterval: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Long Break Duration (minutes)</label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={(editingSettings?.longBreakDuration || 2700) / 60}
                      onChange={(e) => setEditingSettings({ ...editingSettings, longBreakDuration: parseInt(e.target.value) * 60 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Working Hours */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-4">Working Hours</h4>
                <div className="space-y-4">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={editingSettings?.workingHoursEnabled !== false}
                      onChange={(e) => setEditingSettings({ ...editingSettings, workingHoursEnabled: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Enable Working Hours Restriction</span>
                  </label>
                  {editingSettings?.workingHoursEnabled !== false && (
                    <div className="grid grid-cols-2 gap-4 ml-7">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Start Time</label>
                        <input
                          type="time"
                          value={editingSettings?.startTime || '10:00'}
                          onChange={(e) => setEditingSettings({ ...editingSettings, startTime: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">End Time</label>
                        <input
                          type="time"
                          value={editingSettings?.endTime || '18:00'}
                          onChange={(e) => setEditingSettings({ ...editingSettings, endTime: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Frequency & Limits */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-4">Contact Frequency & Limits</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Days Between Contacts</label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={editingSettings?.daysSinceLastContact || 3}
                      onChange={(e) => setEditingSettings({ ...editingSettings, daysSinceLastContact: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Daily Limit</label>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={editingSettings?.dailyLimit || 250}
                      onChange={(e) => setEditingSettings({ ...editingSettings, dailyLimit: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Channel Settings */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-4">Channels</h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={editingSettings?.whatsappEnabled !== false}
                      onChange={(e) => setEditingSettings({ ...editingSettings, whatsappEnabled: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Enable WhatsApp Sending</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={editingSettings?.emailEnabled !== false}
                      onChange={(e) => setEditingSettings({ ...editingSettings, emailEnabled: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Enable Email Sending</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={async () => {
                  try {
                    setLoadingSending(true);
                    const response = await fetch('/api/admin/sending/settings', {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify(editingSettings || {}),
                    });

                    if (response.ok) {
                      await loadSendingSettings(authToken);
                      setShowSettingsModal(false);
                      setEditingSettings(null);
                      alert('Settings saved successfully!');
                    } else {
                      const error = await response.json();
                      alert(error.error || 'Failed to save settings');
                    }
                  } catch (err) {
                    alert('Failed to save settings');
                  } finally {
                    setLoadingSending(false);
                  }
                }}
                disabled={loadingSending}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold"
              >
                {loadingSending ? 'Saving...' : 'Save Settings'}
              </button>
              <button
                onClick={() => {
                  setShowSettingsModal(false);
                  setEditingSettings(null);
                }}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
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
