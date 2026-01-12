import {
  Sparkles,
  Crown,
  Download,
  Clock,
  CheckCircle2,
  ArrowRight,
  Zap,
  BarChart3,
  Calendar,
  MessageSquare,
} from 'lucide-react';
import Link from 'next/link';
import { SimpleNavbar } from '@/components/ui/navbar';

export default function ObrigadoPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-emerald-50">
      <SimpleNavbar />
      {/* HERO SECTION */}
      <section className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-12 h-12 text-white" />
            </div>
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">
            🎉 Pagamento Confirmado!
          </h1>
          
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 inline-block">
            <div className="flex items-center gap-3 justify-center mb-3">
              <Crown className="w-8 h-8 text-yellow-300" />
              <span className="text-2xl sm:text-3xl font-bold">7 DIAS DE PREMIUM GRÁTIS</span>
              <Crown className="w-8 h-8 text-yellow-300" />
            </div>
            <p className="text-lg text-white/90">
              Você acabou de desbloquear todos os recursos por 1 semana!
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8 space-y-8">
        {/* WHAT YOU GET */}
        <section className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border-2 border-purple-200">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              ✨ O que você tem acesso agora
            </h2>
            <p className="text-gray-600">
              Todos os recursos PREMIUM desbloqueados pelos próximos 7 dias
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900">Geração de Mensagens com IA</h3>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                Crie 3 variações de mensagens personalizadas para cada campanha. A IA escreve por você.
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
                Veja em tempo real quantas mensagens foram enviadas, falharam ou estão pendentes.
              </p>
            </div>

            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900">Mensagens Ilimitadas</h3>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                Sem limite diário. Envie quantas mensagens quiser (com segurança, claro).
              </p>
            </div>

            <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900">Agendamento de Campanhas</h3>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                Programe suas campanhas para rodar automaticamente no melhor horário.
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white text-center">
            <p className="text-lg font-bold mb-2">🔥 Valor Total dos Recursos Premium</p>
            <p className="text-4xl font-black mb-2">R$ 1.142</p>
            <p className="text-sm text-white/90">
              Você desbloqueou acesso total agora mesmo!
            </p>
          </div>
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
                  Acesse a página de download e instale o LK Reactor no seu computador Windows.
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
                <h3 className="font-bold text-gray-900 mb-1">Copie sua Chave de Licença</h3>
                <p className="text-sm text-gray-700">
                  Sua chave foi enviada por email. Cole no app para ativar os 7 dias Premium.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-4 bg-emerald-50 rounded-xl border-2 border-emerald-200">
              <div className="flex-shrink-0 w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Comece a Reativar Pacientes</h3>
                <p className="text-sm text-gray-700">
                  Faça upload da sua lista de pacientes e crie sua primeira campanha com IA!
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* UPGRADE OPTIONS */}
        <section className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl shadow-lg p-6 sm:p-8 border-2 border-yellow-300">
          <div className="flex items-start gap-4 mb-6">
            <Zap className="w-8 h-8 text-orange-600 flex-shrink-0" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                ⚡ Maximize seus Resultados
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Quer reativar ainda mais pacientes? Faça upgrade para enviar centenas de mensagens por dia com painel web completo.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border-2 border-orange-200 mb-6">
            <h3 className="font-bold text-gray-900 mb-4 text-center">
              💡 Planos Disponíveis para Upgrade
            </h3>
            
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="border-2 border-blue-200 rounded-lg p-4 hover:border-blue-400 transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🔵</span>
                  <h4 className="font-bold text-gray-900">PROFESSIONAL</h4>
                </div>
                <p className="text-3xl font-bold text-blue-600 mb-2">R$ 197/mês</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>✅ 500 mensagens/dia</li>
                  <li>✅ Painel web completo</li>
                  <li>✅ Campanhas ilimitadas</li>
                  <li>❌ Sem IA</li>
                </ul>
              </div>

              <div className="border-2 border-purple-400 rounded-lg p-4 bg-gradient-to-br from-purple-50 to-blue-50 hover:border-purple-600 transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🟣</span>
                  <h4 className="font-bold text-gray-900">PREMIUM</h4>
                  <span className="text-xs bg-yellow-300 text-yellow-900 px-2 py-0.5 rounded-full font-bold">
                    RECOMENDADO
                  </span>
                </div>
                <p className="text-3xl font-bold text-purple-600 mb-2">R$ 497/mês</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>✅ Mensagens ilimitadas</li>
                  <li>✅ IA + 3 variações A/B/C</li>
                  <li>✅ Suporte prioritário</li>
                  <li>✅ Agendamento avançado</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/precos"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all"
            >
              <Zap className="w-5 h-5" />
              Ver Todos os Planos
              <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-xs text-gray-500 mt-3">
              Você pode fazer upgrade a qualquer momento — durante ou após o trial
            </p>
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
              href="https://wa.me/5511952823271"
              className="text-blue-600 hover:underline font-medium"
            >
              (11) 95282-3271
            </a>
          </p>
        </section>
      </div>
    </main>
  );
}
