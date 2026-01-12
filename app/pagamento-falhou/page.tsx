import { XCircle, CreditCard, AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { SimpleNavbar } from '@/components/ui/navbar';

export default function PagamentoFalhouPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-pink-50">
      <SimpleNavbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-red-600 to-pink-600 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <XCircle className="w-14 h-14 text-white" />
            </div>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight">
            ❌ Pagamento Não Aprovado
          </h1>
          
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Houve um problema ao processar seu pagamento.
          </p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto p-4 sm:p-6 md:p-8 space-y-8">
        {/* Common Reasons */}
        <section className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border-2 border-red-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            🔍 Possíveis Motivos
          </h2>

          <div className="space-y-4">
            <div className="flex gap-4 p-4 bg-red-50 rounded-xl border-2 border-red-100">
              <div className="flex-shrink-0">
                <CreditCard className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Cartão Recusado</h3>
                <p className="text-sm text-gray-700">
                  Seu banco pode ter recusado a transação por segurança. Entre em contato com o banco ou tente outro cartão.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-4 bg-orange-50 rounded-xl border-2 border-orange-100">
              <div className="flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Saldo Insuficiente</h3>
                <p className="text-sm text-gray-700">
                  Verifique se há saldo disponível ou limite no cartão.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-4 bg-yellow-50 rounded-xl border-2 border-yellow-100">
              <div className="flex-shrink-0">
                <XCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Dados Incorretos</h3>
                <p className="text-sm text-gray-700">
                  Número do cartão, CVV, data de validade ou CPF podem estar errados.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-4 bg-purple-50 rounded-xl border-2 border-purple-100">
              <div className="flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Problema Técnico</h3>
                <p className="text-sm text-gray-700">
                  Às vezes o problema é temporário. Aguarde alguns minutos e tente novamente.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* What to Do */}
        <section className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl shadow-xl p-6 sm:p-8 border-2 border-blue-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">
            💡 O Que Fazer Agora
          </h2>

          <div className="space-y-3 text-gray-700">
            <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
              <CreditCard className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="block mb-1">1. Verifique os dados do cartão</strong>
                <span className="text-sm">Confirme número, validade, CVV e CPF.</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
              <RefreshCw className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="block mb-1">2. Tente novamente</strong>
                <span className="text-sm">Use outro cartão ou forma de pagamento (PIX, boleto).</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
              <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="block mb-1">3. Entre em contato com seu banco</strong>
                <span className="text-sm">Se o problema persistir, seu banco pode ter mais informações.</span>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Buttons */}
        <section className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border-2 border-slate-200">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">
            🚀 Tente Novamente
          </h2>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/precos"
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all font-bold text-lg"
            >
              <RefreshCw className="w-5 h-5" />
              Tentar Novamente
            </Link>
            
            <a
              href="https://wa.me/5511999999999?text=Olá,%20tive%20problema%20com%20pagamento"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-bold text-lg"
            >
              Falar com Suporte
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-gray-600 hover:text-gray-900 transition-colors text-sm underline"
            >
              Voltar ao Início
            </Link>
          </div>
        </section>

        {/* Guarantee */}
        <section className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl shadow-xl p-6 sm:p-8 text-white text-center">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">
              🔒 Seu Pagamento é 100% Seguro
            </h3>
            <p className="text-white/90 mb-4">
              Usamos o Mercado Pago, a plataforma de pagamentos mais confiável do Brasil.
            </p>
            <p className="text-sm text-white/80">
              Seus dados estão protegidos com criptografia de ponta a ponta.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
