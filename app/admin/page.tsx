'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  TrendingUp,
  Download,
  CreditCard,
  AlertCircle,
  DollarSign,
  UserCheck,
  UserX,
} from 'lucide-react';

interface AnalyticsData {
  overview: {
    totalVisitors: number;
    uniqueVisitors: number;
    totalLeads: number;
    completedLeads: number;
    abandonedLeads: number;
    totalDownloads: number;
    freeDownloads: number;
    professionalDownloads: number;
    premiumDownloads: number;
    paymentsInitiated: number;
    paymentsCompleted: number;
    totalRevenue: string;
  };
  conversionRates: {
    visitorToLead: string;
    leadToDownload: string;
    downloadToPayment: string;
  };
  recentLeads: any[];
  abandonedLeads: any[];
}

export default function AdminDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('30');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const fetchAnalytics = async (token: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/analytics?period=${period}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError('Sessão expirada. Faça login novamente.');
          setIsAuthenticated(false);
          sessionStorage.removeItem('admin_token');
          setAuthToken('');
          return;
        }
        throw new Error('Erro ao carregar dados');
      }

      const analyticsData = await response.json();
      setData(analyticsData);
      setError('');
      setIsAuthenticated(true);
    } catch (err) {
      setError('Erro ao carregar analytics. Verifique sua conexão.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if token is saved in session storage
    const savedToken = sessionStorage.getItem('admin_token');
    if (savedToken) {
      setAuthToken(savedToken);
      fetchAnalytics(savedToken);
    } else {
      setLoading(false);
    }
  }, [period]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Erro ao fazer login');
        setLoading(false);
        return;
      }

      // Save token and fetch analytics
      const token = data.token;
      setAuthToken(token);
      sessionStorage.setItem('admin_token', token);
      await fetchAnalytics(token);
    } catch (err) {
      setError('Erro ao conectar. Tente novamente.');
      console.error(err);
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">LK Reactor Pro Analytics</p>
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="admin@lkdigital.org"
                required
                disabled={loading}
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="••••••••"
                required
                disabled={loading}
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
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Entrando...</span>
                </>
              ) : (
                'Acessar Dashboard'
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando analytics...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const StatCard = ({ icon: Icon, label, value, color, subValue }: any) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      <h3 className="text-gray-500 text-sm font-medium mb-1">{label}</h3>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {subValue && <p className="text-sm text-gray-500 mt-1">{subValue}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">📊 LK Reactor - Analytics</h1>
            <div className="flex items-center gap-4">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="7">Últimos 7 dias</option>
                <option value="30">Últimos 30 dias</option>
                <option value="90">Últimos 90 dias</option>
              </select>
              <button
                onClick={() => {
                  sessionStorage.removeItem('admin_token');
                  setIsAuthenticated(false);
                }}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Stats */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Users}
            label="Total de Visitantes"
            value={data.overview.totalVisitors.toLocaleString()}
            color="bg-blue-500"
            subValue={`${data.overview.uniqueVisitors} únicos`}
          />
          <StatCard
            icon={UserCheck}
            label="Leads Completos"
            value={data.overview.completedLeads}
            color="bg-green-500"
            subValue={`${data.conversionRates.visitorToLead}% conversão`}
          />
          <StatCard
            icon={Download}
            label="Downloads Total"
            value={data.overview.totalDownloads}
            color="bg-purple-500"
            subValue={`${data.overview.freeDownloads} grátis`}
          />
          <StatCard
            icon={DollarSign}
            label="Receita Total"
            value={`R$ ${data.overview.totalRevenue}`}
            color="bg-emerald-500"
            subValue={`${data.overview.paymentsCompleted} pagamentos`}
          />
        </div>

        {/* Downloads Breakdown */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">📥 Downloads por Plano</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {data.overview.freeDownloads}
              </div>
              <div className="text-sm text-gray-600 font-medium">Plano GRÁTIS</div>
            </div>
            <div className="text-center p-6 bg-blue-50 rounded-lg border-2 border-blue-300">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {data.overview.professionalDownloads}
              </div>
              <div className="text-sm text-blue-700 font-medium">Plano PROFESSIONAL</div>
            </div>
            <div className="text-center p-6 bg-purple-50 rounded-lg border-2 border-purple-300">
              <div className="text-4xl font-bold text-purple-600 mb-2">
                {data.overview.premiumDownloads}
              </div>
              <div className="text-sm text-purple-700 font-medium">Plano PREMIUM</div>
            </div>
          </div>
        </div>

        {/* Conversion Funnel */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">📊 Funil de Conversão</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-32 text-sm font-medium text-gray-700">Visitantes</div>
              <div className="flex-1 bg-gray-200 rounded-full h-8 relative">
                <div className="bg-blue-500 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ width: '100%' }}>
                  {data.overview.uniqueVisitors}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-32 text-sm font-medium text-gray-700">Leads</div>
              <div className="flex-1 bg-gray-200 rounded-full h-8 relative">
                <div className="bg-green-500 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ width: `${(data.overview.completedLeads / data.overview.uniqueVisitors * 100)}%` }}>
                  {data.overview.completedLeads} ({data.conversionRates.visitorToLead}%)
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-32 text-sm font-medium text-gray-700">Downloads</div>
              <div className="flex-1 bg-gray-200 rounded-full h-8 relative">
                <div className="bg-purple-500 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ width: `${(data.overview.totalDownloads / data.overview.uniqueVisitors * 100)}%` }}>
                  {data.overview.totalDownloads}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-32 text-sm font-medium text-gray-700">Pagamentos</div>
              <div className="flex-1 bg-gray-200 rounded-full h-8 relative">
                <div className="bg-emerald-500 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ width: `${(data.overview.paymentsCompleted / data.overview.uniqueVisitors * 100)}%` }}>
                  {data.overview.paymentsCompleted} ({data.conversionRates.downloadToPayment}%)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Abandonment */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <AlertCircle className="w-6 h-6 text-orange-500" />
            <h2 className="text-xl font-bold text-gray-900">⚠️ Leads Abandonados</h2>
          </div>
          <div className="mb-4 p-4 bg-orange-50 rounded-lg">
            <p className="text-2xl font-bold text-orange-600">{data.overview.abandonedLeads}</p>
            <p className="text-sm text-orange-700">leads começaram mas não completaram o formulário</p>
          </div>
          {data.abandonedLeads && data.abandonedLeads.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4 font-medium text-gray-700">Email</th>
                    <th className="text-left py-2 px-4 font-medium text-gray-700">Status</th>
                    <th className="text-left py-2 px-4 font-medium text-gray-700">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {data.abandonedLeads.slice(0, 10).map((lead, i) => (
                    <tr key={i} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-4">{lead.email || '-'}</td>
                      <td className="py-2 px-4">
                        <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">
                          {lead.status}
                        </span>
                      </td>
                      <td className="py-2 px-4 text-gray-600">
                        {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Leads */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">📋 Últimos Leads</h2>
          {data.recentLeads && data.recentLeads.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4 font-medium text-gray-700">Nome</th>
                    <th className="text-left py-2 px-4 font-medium text-gray-700">Email</th>
                    <th className="text-left py-2 px-4 font-medium text-gray-700">WhatsApp</th>
                    <th className="text-left py-2 px-4 font-medium text-gray-700">Clínica</th>
                    <th className="text-left py-2 px-4 font-medium text-gray-700">Receita Perdida</th>
                    <th className="text-left py-2 px-4 font-medium text-gray-700">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentLeads.map((lead, i) => (
                    <tr key={i} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-4 font-medium">{lead.name}</td>
                      <td className="py-2 px-4">{lead.email}</td>
                      <td className="py-2 px-4">{lead.whatsapp}</td>
                      <td className="py-2 px-4">{lead.clinic_name}</td>
                      <td className="py-2 px-4 font-bold text-red-600">
                        R$ {parseFloat(lead.lost_revenue || 0).toLocaleString('pt-BR')}
                      </td>
                      <td className="py-2 px-4 text-gray-600">
                        {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Nenhum lead ainda</p>
          )}
        </div>
      </main>
    </div>
  );
}
