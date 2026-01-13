import {
  Download,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  BarChart3,
  MessageSquare,
  Calendar,
  Star,
  Crown,
  Zap,
  Infinity,
  TrendingDown,
} from 'lucide-react';
import Link from 'next/link';
import { SimpleNavbar } from '@/components/ui/navbar';

export default function ObrigadoPremiumAnualPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50">
      <SimpleNavbar />
      
      {/* HERO SECTION */}
      <section className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center animate-bounce">
              <Crown className="w-14 h-14 text-yellow-300" />
            </div>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight">
            👑 Bem-vindo ao Plano PREMIUM!
          </h1>
          
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 inline-block">
            <div className="flex items-center gap-3 justify-center mb-3">
              <span className="text-3xl">🟣</span>
              <span className="text-2xl sm:text-3xl font-bold">PLANO PREMIUM - ANUAL</span>
            </div>
            <p className="text-xl text-white/90 mb-2">
              Assinatura ativa • R$ 4.970/ano • 14 dias grátis
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 rounded-full">
              <TrendingDown className="w-5 h-5" />
              <span className="font-bold">Você economizou R$ 994 no plano anual!</span>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8 space-y-8">
        {/* SAVINGS HIGHLIGHT */}
        <section className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl shadow-xl p-6 text-white text-center">
          <h2 className="text-2xl font-bold mb-2">🎉 Parabéns! Você fez a escolha mais inteligente!</h2>
          <p className="text-lg">
            Com o plano PREMIUM anual, você economiza <strong>R$ 994 por ano</strong> comparado ao plano mensal.
          </p>
          <p className="text-sm mt-2 text-white/90">
            Isso equivale a <strong>17% de desconto</strong> + garantia de preço fixo por 12 meses + todos os recursos PREMIUM!
          </p>
        </section>

        {/* WHAT YOU GET */}
        <section className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border-2 border-purple-200">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              ✨ O que você tem acesso agora
            </h2>
            <p className="text-gray-600">
              Todos os recursos PREMIUM + IA avançada pelos próximos 12 meses
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-purple-50 border-2 border-purple-300 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                  <Infinity className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900">Mensagens ILIMITADAS</h3>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                Sem limite diário. Reative quantos pacientes quiser por dia!
              </p>
            </div>

            <div className="bg-pink-50 border-2 border-pink-300 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-pink-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900">IA Avançada - 3 Variações A/B/C</h3>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                IA cria 3 versões diferentes de cada mensagem. Escolha a melhor!
              </p>
            </div>

            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900">Painel Web Premium</h3>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                Analytics avançado + relatórios detalhados de desempenho.
              </p>
            </div>

            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900">Suporte Prioritário</h3>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                Resposta em até 2 horas úteis. Fale diretamente com especialistas.
              </p>
            </div>

            <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900">Agendamento Avançado</h3>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                Agende campanhas para rodar automaticamente no melhor horário.
              </p>
            </div>

            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-600 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900">7 Tipos de Campanha Prontos</h3>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                Reativação, promoção, recall, aniversário e muito mais.
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white text-center">
            <p className="text-lg font-bold mb-2">🎁 14 Dias de Teste Grátis</p>
            <p className="text-sm text-white/90">
              Depois do período de teste, R$ 4.970 cobrado uma vez por ano
            </p>
          </div>
        </section>

        {/* NEXT STEPS */}
        <section className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border-2 border-purple-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            📋 Próximos Passos
          </h2>

          <div className="space-y-4">
            <div className="flex gap-4 p-4 bg-purple-50 rounded-xl border-2 border-purple-200">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-1">Baixe o Aplicativo</h3>
                <p className="text-sm text-gray-700 mb-3">
                  Instale o LK Reactor no seu computador Windows.
                </p>
                <Link
                  href="/setup"
                  className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all font-medium text-sm shadow-md"
                >
                  <Download className="w-5 h-5" />
                  Baixar Aplicativo Agora
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>

            <div className="flex gap-4 p-4 bg-pink-50 rounded-xl border-2 border-pink-200">
              <div className="flex-shrink-0 w-8 h-8 bg-pink-600 text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Ative sua Licença PREMIUM</h3>
                <p className="text-sm text-gray-700">
                  Sua chave de licença PREMIUM foi enviada por email. Cole ela no aplicativo.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-4 bg-purple-50 rounded-xl border-2 border-purple-200">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Explore os Recursos Premium</h3>
                <p className="text-sm text-gray-700">
                  Teste a IA criando 3 versões de mensagens e escolha a melhor para sua campanha!
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* PREMIUM BENEFITS */}
        <section className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl shadow-lg p-6 sm:p-8 border-2 border-yellow-300">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
            💎 Por que clientes Premium têm os melhores resultados
          </h2>
          
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex gap-3 items-start">
              <span className="text-lg">✨</span>
              <p><strong>IA Avançada:</strong> Teste 3 versões e use a que converte mais. Aumente em até 300% sua taxa de resposta.</p>
            </div>
            <div className="flex gap-3 items-start">
              <span className="text-lg">⚡</span>
              <p><strong>Sem Limites:</strong> Envie quantas mensagens precisar, sem se preocupar com quotas diárias.</p>
            </div>
            <div className="flex gap-3 items-start">
              <span className="text-lg">🎯</span>
              <p><strong>Personalização Total:</strong> Escolha o tom (premium, amigável, direto) e o tipo de campanha ideal.</p>
            </div>
            <div className="flex gap-3 items-start">
              <span className="text-lg">🚀</span>
              <p><strong>Suporte VIP:</strong> Fale diretamente com especialistas que vão te ajudar a escalar seus resultados.</p>
            </div>
            <div className="flex gap-3 items-start">
              <span className="text-lg">💰</span>
              <p><strong>Economia Garantida:</strong> Preço fixo por 12 meses + economia de R$ 994 comparado ao mensal.</p>
            </div>
          </div>
        </section>

        {/* SUPPORT */}
        <section className="text-center py-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            📧 Sua chave de licença PREMIUM foi enviada para seu email.
          </p>
          <p className="text-sm text-gray-500 mb-2">
            Suporte Prioritário (resposta em até 2h):{' '}
            <a
              href="https://wa.me/5511952829271"
              className="text-purple-600 hover:underline font-medium"
            >
              (11) 95282-9271
            </a>
          </p>
          <p className="text-xs text-gray-400">
            💎 Clientes Premium têm prioridade máxima no atendimento
          </p>
        </section>
      </div>
    </main>
  );
}
