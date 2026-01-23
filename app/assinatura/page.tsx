'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Crown, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowRight,
  ShieldCheck,
  Zap,
  ArrowDownCircle,
  XCircle
} from 'lucide-react';
import { SimpleNavbar } from '@/components/ui/navbar';
import { Footer } from '@/components/ui/footer';
import { trackPageView } from '@/lib/analytics';

function SubscriptionManagementContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  useEffect(() => {
    trackPageView('/assinatura');
  }, []);
  
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [licenseKey, setLicenseKey] = useState(searchParams.get('license_key') || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // If email and license key are in URL, authenticate automatically
  useEffect(() => {
    if (email && licenseKey) {
      handleAuthenticate();
    }
  }, []);

  const handleAuthenticate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !licenseKey) return;

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/auth/manage-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, license_key: licenseKey, action: 'get_info' }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Falha na autenticação');
      }

      setData(result);
      setIsAuthenticated(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDowngrade = async (newTier: string) => {
    if (!confirm(`Tem certeza que deseja alterar seu plano para ${newTier}? Esta mudança entrará em vigor no próximo ciclo de faturamento.`)) {
      return;
    }

    setIsActionLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/auth/manage-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          license_key: licenseKey, 
          action: 'downgrade',
          new_tier: newTier
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Falha ao processar alteração');
      }

      setMessage({ type: 'success', text: result.message });
      // Refresh data
      handleAuthenticate();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsActionLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Gerenciar Assinatura</h1>
            <p className="text-gray-600 mt-2">Acesse os detalhes da sua conta para gerenciar seu plano.</p>
          </div>

          <form onSubmit={handleAuthenticate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chave de Licença</label>
              <input
                type="text"
                required
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="LKRX-XXXX-XXXX-XXXX"
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-100 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  Acessar Minha Conta
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const { clinic, subscription, links } = data;
  const currentTier = clinic.tier;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <SimpleNavbar />
      
      <main className="max-w-4xl mx-auto px-4 pt-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-10 text-white">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <p className="text-blue-100 font-medium mb-1">Gerenciamento de Assinatura</p>
                <h1 className="text-3xl font-bold">{clinic.clinic_name || clinic.name}</h1>
                <div className="mt-4 flex items-center gap-2 bg-white/20 w-fit px-3 py-1 rounded-full text-sm font-semibold">
                  {currentTier === 'PREMIUM' ? <Crown className="w-4 h-4" /> : currentTier === 'PRO' ? <Zap className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                  PLANO {currentTier}
                </div>
              </div>
              <div className="text-left md:text-right">
                <p className="text-blue-100 text-sm">Status da Assinatura</p>
                <p className="text-xl font-bold capitalize">{subscription.status}</p>
                {subscription.current_period_end && (
                  <p className="text-blue-100 text-sm mt-1">
                    Próxima renovação: {new Date(subscription.current_period_end).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {message && (
              <div className={`mb-8 p-4 rounded-xl flex items-start gap-3 ${
                message.type === 'success' ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'
              }`}>
                {message.type === 'success' ? (
                  <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-red-500 shrink-0" />
                )}
                <div>
                  <p className={`font-medium ${message.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                    {message.type === 'success' ? 'Sucesso!' : 'Erro'}
                  </p>
                  <p className={`text-sm ${message.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                    {message.text}
                  </p>
                </div>
              </div>
            )}

            {subscription.next_tier && (
              <div className="mb-8 p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-amber-500 shrink-0" />
                <div>
                  <p className="font-medium text-amber-800">Alteração Pendente</p>
                  <p className="text-sm text-amber-700">
                    Seu plano será alterado para <strong>{subscription.next_tier}</strong> em {new Date(subscription.current_period_end).toLocaleDateString()}.
                  </p>
                </div>
              </div>
            )}

            <h2 className="text-xl font-bold text-gray-900 mb-6">Opções de Plano</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* FREE Tier */}
              <div className={`p-6 rounded-2xl border transition-all ${currentTier === 'FREE' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-gray-500" />
                  <h3 className="font-bold text-gray-900">Grátis</h3>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    5 mensagens/dia
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Sem suporte IA
                  </li>
                </ul>
                {currentTier === 'FREE' ? (
                  <div className="w-full py-2 px-4 rounded-lg bg-blue-100 text-blue-700 text-center text-sm font-bold">
                    Seu Plano Atual
                  </div>
                ) : (
                  <button
                    onClick={() => handleDowngrade('FREE')}
                    disabled={isActionLoading}
                    className="w-full py-2 px-4 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors text-sm font-bold flex items-center justify-center gap-2"
                  >
                    {isActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowDownCircle className="w-4 h-4" />}
                    Downgrade para Grátis
                  </button>
                )}
              </div>

              {/* PRO Tier */}
              <div className={`p-6 rounded-2xl border transition-all ${currentTier === 'PRO' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-gray-900">Professional</h3>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    500 mensagens/mês
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Inteligência Artificial
                  </li>
                </ul>
                {currentTier === 'PRO' ? (
                  <div className="w-full py-2 px-4 rounded-lg bg-blue-100 text-blue-700 text-center text-sm font-bold">
                    Seu Plano Atual
                  </div>
                ) : currentTier === 'PREMIUM' ? (
                  <button
                    onClick={() => handleDowngrade('PRO')}
                    disabled={isActionLoading}
                    className="w-full py-2 px-4 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors text-sm font-bold flex items-center justify-center gap-2"
                  >
                    {isActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowDownCircle className="w-4 h-4" />}
                    Mudar para Pro
                  </button>
                ) : (
                  <a
                    href={links.upgrade_pro_monthly}
                    className="w-full py-2 px-4 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-bold flex items-center justify-center gap-2"
                  >
                    Upgrade para Pro
                    <Crown className="w-4 h-4" />
                  </a>
                )}
              </div>

              {/* PREMIUM Tier */}
              <div className={`p-6 rounded-2xl border transition-all ${currentTier === 'PREMIUM' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                <div className="flex items-center gap-2 mb-4">
                  <Crown className="w-5 h-5 text-amber-500" />
                  <h3 className="font-bold text-gray-900">Premium</h3>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Mensagens Ilimitadas
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    IA Avançada + Analytics
                  </li>
                </ul>
                {currentTier === 'PREMIUM' ? (
                  <div className="w-full py-2 px-4 rounded-lg bg-blue-100 text-blue-700 text-center text-sm font-bold">
                    Seu Plano Atual
                  </div>
                ) : (
                  <a
                    href={links.upgrade_premium_monthly}
                    className="w-full py-2 px-4 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors text-sm font-bold flex items-center justify-center gap-2"
                  >
                    Upgrade para Premium
                    <Crown className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Precisa de Ajuda?</h3>
              <p className="text-gray-600 text-sm mb-6">
                Se você tiver qualquer dúvida sobre sua cobrança ou quiser cancelar sua assinatura imediatamente, 
                entre em contato com nosso suporte.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a 
                  href="mailto:suporte@receitaoculta.com.br"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-all"
                >
                  Contatar Suporte
                </a>
                <button
                  onClick={() => handleDowngrade('FREE')}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-red-600 font-medium hover:bg-red-50 transition-all"
                >
                  <XCircle className="w-5 h-5" />
                  Cancelar Assinatura
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function SubscriptionManagementPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    }>
      <SubscriptionManagementContent />
    </Suspense>
  );
}
