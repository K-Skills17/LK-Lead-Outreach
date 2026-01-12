'use client';

import {
  Download,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Crown,
  BarChart3,
  MessageSquare,
  Calendar,
  Shield,
  Star,
} from 'lucide-react';
import Link from 'next/link';
import { SimpleNavbar } from '@/components/ui/navbar';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function ThankYouContent() {
  const searchParams = useSearchParams();
  const tier = searchParams.get('tier') || 'professional';
  
  const isProfessional = tier === 'professional';
  const isPremium = tier === 'premium';

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-emerald-50">
      <SimpleNavbar />

      {/* HERO SECTION */}
      <section className={`bg-gradient-to-r ${isPremium ? 'from-purple-600 to-pink-600' : 'from-blue-600 to-cyan-600'} text-white py-16 px-4`}>
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-14 h-14 text-white" />
            </div>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight">
            🎉 Assinatura Ativada!
          </h1>
          
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 inline-block">
            <div className="flex items-center gap-3 justify-center mb-3">
              {isPremium && <Crown className="w-8 h-8 text-yellow-300" />}
              {isProfessional && <Star className="w-8 h-8 text-yellow-300" />}
              <span className="text-2xl sm:text-3xl font-bold uppercase">
                {isPremium ? '🟣 PREMIUM' : '🔵 PROFESSIONAL'}
              </span>
              {isPremium && <Crown className="w-8 h-8 text-yellow-300" />}
              {isProfessional && <Star className="w-8 h-8 text-yellow-300" />}
            </div>
            <p className="text-lg text-white/90">
              Sua assinatura está ativa e pronta para usar!
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 max-w-md mx-auto">
            <p className="text-sm text-white/90">
              💳 <strong>Cobrança automática mensal</strong> • Cancele quando quiser • Sem multa
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8 space-y-8">
        {/* WHAT YOU GET */}
        <section className={`bg-white rounded-2xl shadow-xl p-6 sm:p-8 border-2 ${isPremium ? 'border-purple-200' : 'border-blue-200'}`}>
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              ✨ O que você tem acesso
            </h2>
            <p className="text-gray-600">
              {isPremium 
                ? 'Todos os recursos do PROFESSIONAL + inteligência artificial' 
                : 'Controle total de campanhas e resultados'}
            </p>
          </div>

          {isProfessional && (
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900">Painel Web</h3>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Crie campanhas, faça upload de CSV, veja status em tempo real.
                </p>
              </div>

              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900">500 Mensagens/Dia</h3>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Envie até 500 mensagens diariamente com segurança.
                </p>
              </div>

              <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900">Lista Não Contatar</h3>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Proteja pacientes que não querem ser contatados.
                </p>
              </div>

              <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900">Deduplicação</h3>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Evita enviar mensagens duplicadas para o mesmo paciente.
                </p>
              </div>
            </div>
          )}

          {isPremium && (
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900">Geração de Mensagens com IA</h3>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Crie 3 variações de mensagens personalizadas. A IA escreve por você.
                </p>
              </div>

              <div className="bg-pink-50 border-2 border-pink-200 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-pink-600 rounded-lg flex items-center justify-center">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900">Mensagens Ilimitadas</h3>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Sem limite diário. Envie quantas quiser (com segurança).
                </p>
              </div>

              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900">Painel Web Completo</h3>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Tudo do Professional + análise avançada de resultados.
                </p>
              </div>

              <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                    <Star className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900">Suporte Prioritário</h3>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Atendimento prioritário via WhatsApp e email.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* NEXT STEPS */}
        <section className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border-2 border-blue-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            📋 Próximos Passos
          </h2>

          <div className="space-y-4">
            <div className="flex gap-4 p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Baixe o Aplicativo</h3>
                <p className="text-sm text-gray-700 mb-3">
                  Instale o LK Reactor no seu computador Windows.
                </p>
                <Link
                  href="/setup"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                >
                  <Download className="w-4 h-4" />
                  Ir para Download
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="flex gap-4 p-4 bg-purple-50 rounded-xl border-2 border-purple-200">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Ative sua Licença</h3>
                <p className="text-sm text-gray-700">
                  Sua chave foi enviada por email. Cole no app para ativar sua assinatura {isPremium ? 'PREMIUM' : 'PROFESSIONAL'}.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-4 bg-emerald-50 rounded-xl border-2 border-emerald-200">
              <div className="flex-shrink-0 w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Crie sua Primeira Campanha</h3>
                <p className="text-sm text-gray-700">
                  Acesse o painel web, crie uma campanha e importe seus contatos.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* BILLING INFO */}
        <section className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl shadow-xl p-6 sm:p-8 border-2 border-slate-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">
            💳 Informações de Cobrança
          </h2>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span>
                <strong>Cobrança mensal automática:</strong> R$ {isPremium ? '497' : '197'}/mês
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span>
                <strong>Próxima cobrança:</strong> {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span>
                <strong>Gerenciar assinatura:</strong> Acesse sua conta no Mercado Pago
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span>
                <strong>Cancelamento:</strong> Sem multa, sem burocracia. Cancele quando quiser.
              </span>
            </div>
          </div>
        </section>

        {/* UPSELL (only for Professional) */}
        {isProfessional && (
          <section className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl shadow-xl p-6 sm:p-8 text-white">
            <div className="text-center mb-6">
              <Crown className="w-16 h-16 mx-auto mb-4 text-yellow-300" />
              <h2 className="text-2xl sm:text-3xl font-bold mb-3">
                Quer mensagens ainda mais inteligentes?
              </h2>
              <p className="text-white/90 text-lg">
                Upgrade para PREMIUM e desbloqueie a geração de mensagens com IA.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 mb-6">
              <h3 className="font-bold text-lg mb-3">Com PREMIUM você ganha:</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-300 flex-shrink-0 mt-0.5" />
                  <span>Gerador de mensagens com ChatGPT</span>
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-300 flex-shrink-0 mt-0.5" />
                  <span>3 variações A/B/C por campanha</span>
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-300 flex-shrink-0 mt-0.5" />
                  <span>Mensagens ilimitadas (vs 500/dia)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-300 flex-shrink-0 mt-0.5" />
                  <span>Suporte prioritário</span>
                </li>
              </ul>
            </div>

            <div className="text-center">
              <p className="text-2xl font-bold mb-4">
                R$ 497/mês
              </p>
              <Link
                href={process.env.NEXT_PUBLIC_PREMIUM_PAYMENT_URL || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-purple-600 rounded-lg hover:bg-gray-100 transition-colors font-bold text-lg"
              >
                <Crown className="w-5 h-5" />
                Fazer Upgrade para Premium
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

export default function ObrigadoAssinaturaPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    }>
      <ThankYouContent />
    </Suspense>
  );
}
