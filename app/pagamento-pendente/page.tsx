'use client';

import { Clock, Mail, ArrowRight, RefreshCcw } from 'lucide-react';
import Link from 'next/link';
import { SimpleNavbar } from '@/components/ui/navbar';
import { useEffect } from 'react';
import { trackPageView } from '@/lib/analytics';

export default function PagamentoPendentePage() {
  useEffect(() => {
    trackPageView('/pagamento-pendente');
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-amber-50">
      <SimpleNavbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center animate-pulse">
              <Clock className="w-14 h-14 text-white" />
            </div>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight">
            ⏳ Pagamento Pendente
          </h1>
          
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Seu pagamento está sendo processado. Isso pode levar alguns minutos.
          </p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto p-4 sm:p-6 md:p-8 space-y-8">
        {/* What's Happening */}
        <section className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border-2 border-orange-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            📋 O que está acontecendo?
          </h2>

          <div className="space-y-4">
            <div className="flex gap-4 p-4 bg-orange-50 rounded-xl border-2 border-orange-100">
              <div className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Pagamento em Análise</h3>
                <p className="text-sm text-gray-700">
                  O Mercado Pago está verificando seu pagamento. Isso geralmente leva de 1 a 5 minutos.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-4 bg-yellow-50 rounded-xl border-2 border-yellow-100">
              <div className="flex-shrink-0 w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Você Receberá um Email</h3>
                <p className="text-sm text-gray-700">
                  Assim que o pagamento for aprovado, você receberá:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-gray-700">
                  <li className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-yellow-600" />
                    Confirmação de pagamento
                  </li>
                  <li className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-yellow-600" />
                    Sua chave de licença
                  </li>
                  <li className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-yellow-600" />
                    Instruções de instalação
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex gap-4 p-4 bg-emerald-50 rounded-xl border-2 border-emerald-100">
              <div className="flex-shrink-0 w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Acesso Liberado</h3>
                <p className="text-sm text-gray-700">
                  Com a licença em mãos, é só instalar o app e começar a usar!
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* What to Do */}
        <section className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl shadow-xl p-6 sm:p-8 border-2 border-blue-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">
            ⏰ Enquanto Você Espera
          </h2>

          <div className="space-y-3 text-gray-700">
            <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
              <RefreshCcw className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="block mb-1">Verifique seu email</strong>
                <span className="text-sm">Certifique-se de que o email cadastrado está correto.</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
              <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="block mb-1">Aguarde alguns minutos</strong>
                <span className="text-sm">Pagamentos via PIX são instantâneos, mas boleto pode levar até 3 dias úteis.</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
              <Mail className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="block mb-1">Cheque spam/promoções</strong>
                <span className="text-sm">Às vezes o email vai para a caixa de spam. Procure por "LK Reactor" ou "Mercado Pago".</span>
              </div>
            </div>
          </div>
        </section>

        {/* Support */}
        <section className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border-2 border-slate-200 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            🆘 Precisa de Ajuda?
          </h2>
          <p className="text-gray-700 mb-6">
            Se seu pagamento ainda estiver pendente após 15 minutos, entre em contato conosco.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://wa.me/5511999999999?text=Olá,%20meu%20pagamento%20está%20pendente"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
            >
              WhatsApp Suporte
              <ArrowRight className="w-5 h-5" />
            </a>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium"
            >
              Voltar ao Início
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
