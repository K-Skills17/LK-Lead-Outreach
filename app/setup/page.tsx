'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import {
  CheckCircle2,
  Download,
  Key,
  Monitor,
  Copy,
} from 'lucide-react';

function SetupContent() {
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan');
  const isFree = plan === 'free';
  
  // TODO: Replace with actual license key from database/webhook
  const licenseKey = isFree ? 'LK-FREE-TRIAL-XXXX' : 'LK-XXXX-XXXX-XXXX-XXXX';
  const downloadUrl = '#/download/LK-Reactor-Setup.exe';

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-4 md:py-5 px-4">
        <div className="max-w-3xl mx-auto flex items-center justify-center">
          <img 
            src="/lk-reactor-logo.svg" 
            alt="LK Reactor Pro" 
            className="h-12 sm:h-16 md:h-18 w-auto object-contain"
          />
        </div>
      </header>

        <div className="max-w-3xl w-full mx-auto space-y-8 px-4 py-16 sm:py-20 md:py-24">
        {/* HERO - LICENSE ACTIVE */}
        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 md:p-10">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-600" />
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
              {isFree ? 'Teste Grátis Ativado! 🎉' : 'Sua Licença está Ativa! 🎉'}
            </h1>
            <p className="text-base sm:text-lg text-gray-700 leading-relaxed">
              {isFree 
                ? 'Baixe o aplicativo e teste gratuitamente com até 10 mensagens por dia.' 
                : 'Bem-vindo ao LK Reactor. Baixe o aplicativo e comece a reativar seus pacientes agora.'}
            </p>
          </div>
        </section>

        {/* LICENSE KEY DISPLAY */}
        <section className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 md:p-8 space-y-4">
          <div className="flex items-start gap-3">
            <Key className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div className="flex-1 space-y-3">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
                {isFree ? 'Sua Chave de Teste Grátis' : 'Sua Chave de Licença'}
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                Copie esta chave. Você precisará dela para ativar o aplicativo.
                {isFree && ' Esta é uma licença de teste com limite de 10 mensagens/dia.'}
              </p>
              <div className="bg-white border-2 border-blue-300 rounded-lg p-4 flex items-center justify-between gap-3">
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

        {/* DOWNLOAD APP BUTTON */}
        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 md:p-8 space-y-5">
          <div className="flex items-start gap-3">
            <Monitor className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-1" />
            <div className="flex-1 space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
                Baixe o Aplicativo
              </h2>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                Instale o LK Reactor no seu computador Windows e comece a enviar mensagens com segurança.
              </p>
              <a
                href={downloadUrl}
                download
                className="flex items-center justify-center gap-2 w-full bg-emerald-600 text-white text-center font-bold text-base sm:text-lg py-4 px-6 rounded-xl hover:bg-emerald-700 transition-colors shadow-md"
              >
                <Download className="w-5 h-5" />
                Baixar LK Reactor (Windows)
              </a>
              <p className="text-xs text-gray-500 text-center leading-relaxed">
                Compatível com Windows 10 e 11 • Arquivo: ~25 MB
              </p>
            </div>
          </div>
        </section>

        {/* INSTRUCTIONS */}
        <section className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-6 md:p-8">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
            Como começar
          </h3>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-slate-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0 text-sm">
                1
              </div>
              <p className="text-sm sm:text-base text-gray-700 pt-1 leading-relaxed">
                Baixe o App clicando no botão acima.
              </p>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-slate-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0 text-sm">
                2
              </div>
              <p className="text-sm sm:text-base text-gray-700 pt-1 leading-relaxed">
                Copie sua Chave de Licença (mostrada acima).
              </p>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-slate-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0 text-sm">
                3
              </div>
              <p className="text-sm sm:text-base text-gray-700 pt-1 leading-relaxed">
                Cole a chave no App para ativar e começar a reativar pacientes.
              </p>
            </div>
          </div>
        </section>

        {/* SUPPORT NOTE */}
        <section className="text-center pt-4 border-t border-gray-200">
          <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
            Problemas com o download ou ativação? Entre em contato via email de confirmação.
          </p>
        </section>
        </div>
    </main>
  );
}

export default function SetupPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <SetupContent />
    </Suspense>
  );
}
