import {
  Download,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  BarChart3,
  MessageSquare,
  Calendar,
  Star,
} from 'lucide-react';
import Link from 'next/link';
import { SimpleNavbar } from '@/components/ui/navbar';
import { Footer } from '@/components/ui/footer';

export default function ObrigadoProPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-emerald-50">
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
            🎉 Bem-vindo ao LK Reactor!
          </h1>
          
          <p className="text-xl sm:text-2xl text-white/90 max-w-2xl mx-auto">
            Seu pagamento foi confirmado com sucesso. Você agora tem acesso completo à plataforma!
          </p>

          <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm rounded-full">
            <Star className="w-5 h-5 text-yellow-300" />
            <span className="font-semibold">Assinatura Ativa</span>
            <Star className="w-5 h-5 text-yellow-300" />
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8 space-y-8">
        {/* WHAT YOU GET */}
        <section className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border-2 border-blue-200">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              ✨ O que você tem acesso agora
            </h2>
            <p className="text-gray-600">
              Todos os recursos da sua assinatura estão ativos
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900">Painel Web Completo</h3>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                Gerencie todas as suas campanhas e veja estatísticas em tempo real.
              </p>
            </div>

            <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900">Envios em Escala</h3>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                Envie mensagens para centenas de contatos com segurança e controle.
              </p>
            </div>

            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900">Campanhas Ilimitadas</h3>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                Crie quantas campanhas precisar para diferentes segmentos de pacientes.
              </p>
            </div>

            <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900">Recursos Avançados</h3>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                Upload de CSV, deduplicação, lista de bloqueio e muito mais.
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white text-center">
            <p className="text-lg font-semibold mb-2">
              🚀 Sua assinatura está ativa e pronta para usar!
            </p>
            <p className="text-sm text-white/90">
              Comece a reativar pacientes hoje mesmo
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
                  Instale o LK Reactor no seu computador Windows para começar a enviar mensagens.
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
                  Sua chave de licença foi enviada por email. Cole ela no aplicativo para ativar sua conta.
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
                  Faça upload da sua lista de pacientes e comece a reativar com mensagens personalizadas.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* TIPS */}
        <section className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl shadow-lg p-6 sm:p-8 border-2 border-yellow-300">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
            💡 Dicas para Começar
          </h2>
          
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex gap-3 items-start">
              <span className="text-lg">✅</span>
              <p><strong>Organize seus contatos:</strong> Separe pacientes por tipo de tratamento ou tempo de inatividade para mensagens mais relevantes.</p>
            </div>
            <div className="flex gap-3 items-start">
              <span className="text-lg">✅</span>
              <p><strong>Comece aos poucos:</strong> Teste com um grupo pequeno antes de enviar para toda a base.</p>
            </div>
            <div className="flex gap-3 items-start">
              <span className="text-lg">✅</span>
              <p><strong>Personalize suas mensagens:</strong> Mensagens personalizadas têm muito mais retorno que mensagens genéricas.</p>
            </div>
            <div className="flex gap-3 items-start">
              <span className="text-lg">✅</span>
              <p><strong>Monitore os resultados:</strong> Use o painel para acompanhar taxas de envio e ajustar sua estratégia.</p>
            </div>
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
          <p className="text-xs text-gray-400 mt-3">
            Suporte prioritário disponível de segunda a sexta, 9h às 18h
          </p>
        </section>
      </div>
      <Footer />
    </main>
  );
}
