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
  TrendingDown,
} from 'lucide-react';
import Link from 'next/link';
import { SimpleNavbar } from '@/components/ui/navbar';
import { Footer } from '@/components/ui/footer';

export default function ObrigadoProAnualPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-blue-50">
      <SimpleNavbar />
      
      {/* HERO SECTION */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-14 h-14 text-white" />
            </div>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight">
            🎉 Bem-vindo ao Plano PROFESSIONAL!
          </h1>
          
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 inline-block">
            <div className="flex items-center gap-3 justify-center mb-3">
              <span className="text-3xl">🔵</span>
              <span className="text-2xl sm:text-3xl font-bold">PLANO PROFESSIONAL - ANUAL</span>
            </div>
            <p className="text-xl text-white/90 mb-2">
              Assinatura ativa • R$ 2.128/ano • 14 dias grátis
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 rounded-full">
              <TrendingDown className="w-5 h-5" />
              <span className="font-bold">Você economizou R$ 236 no plano anual!</span>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8 space-y-8">
        {/* SAVINGS HIGHLIGHT */}
        <section className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl shadow-xl p-6 text-white text-center">
          <h2 className="text-2xl font-bold mb-2">💰 Parabéns! Você fez uma escolha inteligente!</h2>
          <p className="text-lg">
            Com o plano anual, você economiza <strong>R$ 236 por ano</strong> comparado ao plano mensal.
          </p>
          <p className="text-sm mt-2 text-white/90">
            Isso equivale a <strong>10% de desconto</strong> + estabilidade de preço por 12 meses!
          </p>
        </section>

        {/* WHAT YOU GET */}
        <section className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border-2 border-blue-200">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              ✨ O que você tem acesso agora
            </h2>
            <p className="text-gray-600">
              Todos os recursos do plano PROFESSIONAL pelos próximos 12 meses
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900">500 Mensagens/Dia</h3>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                Reative até 500 pacientes por dia com mensagens personalizadas via WhatsApp.
              </p>
            </div>

            <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900">Painel Web Completo</h3>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                Acompanhe resultados em tempo real no dashboard completo.
              </p>
            </div>

            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900">Campanhas Personalizadas</h3>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                Crie campanhas sem escrever nada. O sistema cria por você!
              </p>
            </div>

            <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900">Import CSV + Automação</h3>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                Importe sua base e configure envios no piloto automático.
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white text-center">
            <p className="text-lg font-bold mb-2">🎁 14 Dias de Teste Grátis</p>
            <p className="text-sm text-white/90">
              Depois do período de teste, R$ 2.128 cobrado uma vez por ano
            </p>
          </div>
        </section>

        {/* NEXT STEPS */}
        <section className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border-2 border-purple-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            📋 Próximos Passos
          </h2>

          <div className="space-y-4">
            <div className="flex gap-4 p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-1">Baixe o Aplicativo</h3>
                <p className="text-sm text-gray-700 mb-3">
                  Instale o LK Reactor no seu computador Windows.
                </p>
                <a
                  href="https://lk-reactor-download.mute-mountain-033a.workers.dev"
                  className="inline-flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium text-sm shadow-md hover:shadow-lg"
                >
                  <Download className="w-5 h-5" />
                  Baixar Aplicativo Agora
                  <ArrowRight className="w-5 h-5" />
                </a>
              </div>
            </div>

            <div className="flex gap-4 p-4 bg-purple-50 rounded-xl border-2 border-purple-200">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Ative sua Licença</h3>
                <p className="text-sm text-gray-700">
                  Sua chave de licença foi enviada por email. Cole ela no aplicativo.
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
                  Faça upload da sua lista de pacientes e comece a reativar!
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* UPGRADE OPTION */}
        <section className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-lg p-6 sm:p-8 border-2 border-purple-300">
          <div className="flex items-start gap-4 mb-6">
            <Crown className="w-8 h-8 text-purple-600 flex-shrink-0" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                💎 Quer Mais Poder?
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Upgrade para PREMIUM e tenha mensagens ILIMITADAS + IA avançada com 3 variações A/B/C!
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border-2 border-purple-200 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-3xl">🟣</span>
              <h4 className="font-bold text-gray-900 text-lg">PREMIUM ANUAL</h4>
              <span className="text-xs bg-yellow-300 text-yellow-900 px-2 py-0.5 rounded-full font-bold">
                ECONOMIZE R$ 2.174
              </span>
            </div>
            <p className="text-3xl font-bold text-purple-600 mb-3">R$ 3.790/ano</p>
            <ul className="text-sm text-gray-700 space-y-2 mb-4">
              <li className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-600" />
                <span>Mensagens <strong>ILIMITADAS</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>IA cria 3 versões A/B/C de cada mensagem</span>
              </li>
              <li className="flex items-center gap-2">
                <Star className="w-4 h-4 text-purple-600" />
                <span>Suporte prioritário (resposta em 2h)</span>
              </li>
            </ul>
          </div>

          <div className="text-center">
            <Link
              href="/precos"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all"
            >
              <Crown className="w-5 h-5" />
              Fazer Upgrade para PREMIUM
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>

        {/* SUPPORT */}
        <section className="text-center py-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            📧 Sua chave de licença foi enviada para seu email.
          </p>
          <p className="text-sm text-gray-500">
            Precisa de ajuda? Entre em contato pelo WhatsApp:{' '}
            <a
              href="https://wa.me/5511952829271"
              className="text-blue-600 hover:underline font-medium"
            >
              (11) 95282-9271
            </a>
          </p>
        </section>
      </div>
      <Footer />
    </main>
  );
}
