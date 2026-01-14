'use client';

import {
  Sparkles,
  Crown,
  Download,
  CheckCircle2,
  ArrowRight,
  BarChart3,
  Calendar,
  MessageSquare,
  Key,
  Copy,
} from 'lucide-react';
import Link from 'next/link';
import { SimpleNavbar } from '@/components/ui/navbar';
import { Footer } from '@/components/ui/footer';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { trackDownload, trackTrialActivated } from '@/lib/analytics';

function ThankYouContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const [licenseKey, setLicenseKey] = useState('Carregando...');

  useEffect(() => {
    async function fetchClinicData() {
      if (email) {
        try {
          // Trigger trial activation email and tracking
          trackTrialActivated(email);

          const response = await fetch(`/api/clinics/get-by-email?email=${encodeURIComponent(email)}`);
          if (response.ok) {
            const data = await response.json();
            if (data.license_key) {
              setLicenseKey(data.license_key);
            }
          }
        } catch (error) {
          console.error('Error fetching clinic data:', error);
        }
      }
    }
    fetchClinicData();
  }, [email]);

  const downloadUrl = 'https://lk-reactor-download.mute-mountain-033a.workers.dev';

  const handleDownload = () => {
    trackDownload({
      email: email || undefined,
      planType: 'free',
      licenseKey: licenseKey !== 'Carregando...' ? licenseKey : undefined,
      sourcePage: '/obrigado'
    });
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-emerald-50">
      <SimpleNavbar />
      {/* HERO SECTION */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-12 h-12 text-white" />
            </div>
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">
            🎉 Diagnóstico Concluído!
          </h1>
          
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 inline-block">
            <div className="flex items-center gap-3 justify-center mb-3">
              <Crown className="w-8 h-8 text-yellow-300" />
              <span className="text-2xl sm:text-3xl font-bold">14 DIAS DE PREMIUM GRÁTIS</span>
              <Crown className="w-8 h-8 text-yellow-300" />
            </div>
            <p className="text-lg text-white/90">
              Você acabou de desbloquear todos os recursos por 2 semanas!
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8 space-y-8">
        {/* LICENSE KEY DISPLAY */}
        <section className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 md:p-8 space-y-4 shadow-lg">
          <div className="flex items-start gap-3">
            <Key className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div className="flex-1 space-y-3">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
                Sua Chave de Teste Grátis
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                Copie esta chave. Você precisará dela para ativar o aplicativo.
                Esta é uma licença de teste válida por 14 dias.
              </p>
              <div className="bg-white border-2 border-blue-300 rounded-lg p-4 flex items-center justify-between gap-3 shadow-inner">
                <code className="text-base sm:text-lg font-mono font-bold text-blue-600 break-all">
                  {licenseKey}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(licenseKey)}
                  className="flex-shrink-0 p-2 hover:bg-blue-100 rounded-lg transition-colors"
                  title="Copiar chave"
                >
                  <Copy className="w-5 h-5 text-blue-600" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* DOWNLOAD SECTION */}
        <section className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border-2 border-emerald-200">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Download className="w-8 h-8 text-emerald-600" />
            </div>
            <div className="flex-1 text-center md:text-left space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">Baixe o LK Reactor</h2>
              <p className="text-gray-600">Instale no seu Windows e comece a reativar pacientes agora mesmo.</p>
            </div>
            <a
              href={downloadUrl}
              onClick={handleDownload}
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-bold text-lg shadow-md hover:shadow-lg"
            >
              <Download className="w-5 h-5" />
              Baixar Agora
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </section>

        {/* WHAT YOU GET */}
        <section className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border-2 border-purple-200">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              ✨ O que você tem acesso agora
            </h2>
            <p className="text-gray-600">
              Todos os recursos PREMIUM desbloqueados pelos próximos 14 dias
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
      <Footer />
    </main>
  );
}

export default function ObrigadoPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <ThankYouContent />
    </Suspense>
  );
}
