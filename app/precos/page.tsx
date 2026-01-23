'use client';

import { Suspense, useState } from 'react';
import { Check, Sparkles, Zap, Shield, X } from 'lucide-react';
import Link from 'next/link';
import { Navbar } from '@/components/ui/navbar';
import { Footer } from '@/components/ui/footer';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { trackPageView } from '@/lib/analytics';
import { fbViewContent } from '@/lib/facebook-pixel';

function PricingContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  useEffect(() => {
    trackPageView('/precos');
    fbViewContent('Pricing Page');
  }, []);

  const tiers = [
    {
      name: 'GRÁTIS',
      subtitle: 'Teste o Sistema',
      price: 0,
      priceAnnual: 0,
      description: 'Experimente sem compromisso.',
      icon: '🟢',
      color: 'emerald',
      popular: false,
      cta: 'Começar Grátis',
      ctaLink: email ? `/obrigado?plan=free&email=${encodeURIComponent(email)}` : '/obrigado?plan=free',
      trial: null,
      features: [
        'Reative até 10 pacientes por dia',
        'Envie mensagens personalizadas via WhatsApp',
        'Teste o sistema sem cartão de crédito',
        'Use por tempo ilimitado',
        'Faça upgrade quando quiser',
      ],
      limits: '10 mensagens/dia',
      idealFor: 'Dentistas que querem testar antes',
    },
    {
      name: 'PROFESSIONAL',
      subtitle: 'Recupere Pacientes',
      price: 197,
      priceAnnual: 1970,
      description: 'Tudo que você precisa para reativar pacientes.',
      icon: '🔵',
      color: 'blue',
      popular: true,
      cta: 'Começar Teste Grátis',
      ctaLink: process.env.NEXT_PUBLIC_PRO_SUBSCRIBTION || '#',
      ctaLinkAnnual: process.env.NEXT_PUBLIC_PRO_SUBSCRIBTION_YEARLY || '#',
      trial: '14 dias grátis',
      features: [
        '✨ Tudo no plano grátis +',
        'Reative até 500 pacientes por mês',
        'Crie campanhas personalizadas sem escrever nada',
        'IA cria mensagens profissionais automaticamente',
        'Acompanhe resultados em tempo real no painel',
        'Importe sua base de pacientes em segundos (CSV)',
        'Evite envios duplicados e pacientes bloqueados',
        'Configure envios automáticos no piloto automático',
      ],
      limits: '500 mensagens/mês',
      idealFor: 'Clínicas que querem resultados previsíveis',
    },
    {
      name: 'PREMIUM',
      subtitle: 'Maximize Resultados',
      price: 497,
      priceAnnual: 4970,
      description: 'Converta mais pacientes com IA avançada.',
      icon: '🟣',
      color: 'purple',
      popular: false,
      cta: 'Começar Teste Grátis',
      ctaLink: process.env.NEXT_PUBLIC_PREMIUM_SUBSCRIBTION || '#',
      ctaLinkAnnual: process.env.NEXT_PUBLIC_PREMIUM_SUBSCRIBTION_YEARLY || '#',
      trial: '14 dias grátis',
      features: [
        '✨ Tudo no plano Professional +',
        'Reative ILIMITADOS pacientes por dia',
        'IA cria 3 versões de cada mensagem (teste A/B/C)',
        'Escolha o tom: premium, amigável ou direto',
        '7 tipos de campanha prontos (reativação, promoção, recall...)',
        'Mensagens personalizadas para cada paciente',
        'Suporte prioritário com resposta em até 2h',
        'Ideal para clínicas que querem escalar rápido',
      ],
      limits: 'Mensagens ilimitadas',
      idealFor: 'Clínicas que querem maximizar agendamentos',
    },
  ];

  const getColorClasses = (color: string, variant: 'bg' | 'text' | 'border' | 'hover' | 'badge') => {
    const colors: any = {
      emerald: {
        bg: 'bg-emerald-600',
        text: 'text-emerald-600',
        border: 'border-emerald-200',
        hover: 'hover:bg-emerald-700',
        badge: 'bg-emerald-100 text-emerald-700',
      },
      blue: {
        bg: 'bg-blue-600',
        text: 'text-blue-600',
        border: 'border-blue-200',
        hover: 'hover:bg-blue-700',
        badge: 'bg-blue-100 text-blue-700',
      },
      purple: {
        bg: 'bg-purple-600',
        text: 'text-purple-600',
        border: 'border-purple-200',
        hover: 'hover:bg-purple-700',
        badge: 'bg-purple-100 text-purple-700',
      },
    };
    return colors[color]?.[variant] || '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <Navbar />
      <main>
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 sm:pt-40 md:pt-44 lg:pt-48 pb-12">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-10">
            <Sparkles className="w-4 h-4" />
            Sem taxa por mensagem • Sem WhatsApp API • Sem contratos longos
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight">
            Recupere pacientes perdidos no WhatsApp
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {' '}— sem depender de anúncios
            </span>
          </h1>
          
          <p className="text-xl text-slate-600 mb-8 leading-relaxed">
            Transforme contatos inativos em consultas reais com controle, segurança e inteligência.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-4 p-1 bg-white rounded-xl shadow-sm border border-slate-200">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-6 py-2 rounded-lg font-medium transition-all relative ${
                billingCycle === 'annual'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Anual
              <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-emerald-500 text-white text-xs rounded-full whitespace-nowrap">
                até 33% de desconto
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid lg:grid-cols-3 gap-8 lg:gap-6">
          {tiers.map((tier, index) => (
            <div
              key={tier.name}
              className={`relative bg-white rounded-2xl shadow-xl border-2 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
                tier.popular
                  ? 'border-blue-500 ring-4 ring-blue-100 lg:scale-105'
                  : getColorClasses(tier.color, 'border')
              }`}
            >
              {/* Popular Badge */}
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-bold rounded-full shadow-lg">
                  ⭐ MAIS POPULAR
                </div>
              )}

              <div className="p-8">
                {/* Header */}
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-4xl">{tier.icon}</span>
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900">{tier.name}</h3>
                      <p className="text-sm text-slate-600">{tier.subtitle}</p>
                    </div>
                  </div>
                  <p className="text-slate-600 leading-relaxed">{tier.description}</p>
                </div>

                {/* Pricing */}
                <div className="mb-6 pb-6 border-b border-slate-200">
                  {tier.trial && (
                    <div className="mb-3 inline-block px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-bold rounded-lg shadow-md">
                      🎁 {tier.trial}
                    </div>
                  )}
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-slate-900">
                      R${billingCycle === 'monthly' ? tier.price : Math.round(tier.priceAnnual / 12)}
                    </span>
                    <span className="text-slate-600">/mês</span>
                  </div>
                  {tier.trial && (
                    <p className="text-sm text-gray-600 mt-2">
                      Depois do período de teste
                    </p>
                  )}
                  {billingCycle === 'annual' && tier.price > 0 && (
                    <p className="text-sm text-emerald-600 font-medium mt-2">
                      R${tier.priceAnnual}/ano (economize R${tier.price * 12 - tier.priceAnnual})
                    </p>
                  )}
                  <div className={`inline-block px-3 py-1 ${getColorClasses(tier.color, 'badge')} rounded-full text-sm font-medium mt-3`}>
                    {tier.limits}
                  </div>
                </div>

                {/* Features */}
                <div className="mb-8 space-y-3">
                  {tier.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                      {feature.startsWith('Tudo do') ? (
                        <span className="text-sm font-semibold text-slate-700 mt-3">{feature}</span>
                      ) : (
                        <>
                          <Check className={`w-5 h-5 ${getColorClasses(tier.color, 'text')} flex-shrink-0 mt-0.5`} />
                          <span className="text-slate-700 text-sm leading-relaxed">{feature}</span>
                        </>
                      )}
                    </div>
                  ))}
                </div>

                {/* Ideal For */}
                <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500 font-medium mb-1">IDEAL PARA:</p>
                  <p className="text-sm text-slate-700 font-medium">{tier.idealFor}</p>
                </div>

                {/* CTA Button */}
                {tier.name === 'GRÁTIS' ? (
                  <Link
                    href={tier.ctaLink}
                    className={`block w-full py-4 rounded-xl font-bold text-center transition-all ${
                      tier.popular
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg hover:scale-105'
                        : `${getColorClasses(tier.color, 'bg')} ${getColorClasses(tier.color, 'hover')} text-white`
                    } shadow-md`}
                  >
                    {tier.cta}
                  </Link>
                ) : (
                  <a
                    href={
                      billingCycle === 'annual' && 'ctaLinkAnnual' in tier
                        ? (tier as any).ctaLinkAnnual
                        : tier.ctaLink
                    }
                    className={`block w-full py-4 rounded-xl font-bold text-center transition-all ${
                      tier.popular
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg hover:scale-105'
                        : `${getColorClasses(tier.color, 'bg')} ${getColorClasses(tier.color, 'hover')} text-white`
                    } shadow-md`}
                  >
                    {tier.cta}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why It Works */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-12 border border-slate-200">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">
            🧠 Por que funciona
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-2">WhatsApp é o canal principal no Brasil</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  98% dos seus pacientes usam WhatsApp diariamente. É onde eles respondem.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-2">A maioria das clínicas não faz follow-up</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Pacientes inativos são dinheiro deixado na mesa. Reative antes da concorrência.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-2">1 paciente recuperado já paga o mês</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Se o ticket médio é R$500, você só precisa reativar 1 paciente para ter ROI positivo.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <X className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-2">Sem dependência de anúncios</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Pare de queimar dinheiro no Meta Ads. Seus melhores leads já estão na sua base.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <h2 className="text-3xl font-bold text-slate-900 mb-10 text-center">
          ❓ Perguntas Rápidas
        </h2>
        
        <div className="space-y-4">
          {[
            {
              q: 'Isso pode bloquear meu WhatsApp?',
              a: 'Usamos envios graduais e controle humano. Sem promessas milagrosas. Você envia via seu próprio WhatsApp Web com intervalos seguros.',
            },
            {
              q: 'Preciso mudar meu processo?',
              a: 'Não. O sistema se adapta à sua rotina. Você continua usando seu WhatsApp normalmente.',
            },
            {
              q: 'Posso cancelar quando quiser?',
              a: 'Sim. Sem fidelidade. Cancele a qualquer momento sem burocracia.',
            },
            {
              q: 'Como funciona a IA no plano Premium?',
              a: 'A IA gera variações de mensagens personalizadas baseadas no objetivo da campanha. Você sempre revisa antes de enviar.',
            },
          ].map((faq, i) => (
            <details
              key={i}
              className="group bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden"
            >
              <summary className="p-6 cursor-pointer hover:bg-slate-50 transition-colors">
                <span className="font-bold text-slate-900 text-lg">{faq.q}</span>
              </summary>
              <div className="px-6 pb-6 text-slate-600 leading-relaxed">
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-2xl p-12 text-center text-white">
          <h2 className="text-4xl font-bold mb-4">
            🚀 Comece grátis agora
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Atualize quando quiser — em minutos.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={email ? `/obrigado?plan=free&email=${encodeURIComponent(email)}` : "/obrigado?plan=free"}
              className="px-8 py-4 bg-white text-blue-600 rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all text-center"
            >
              Começar Grátis
            </Link>
          </div>
          <p className="text-sm text-blue-200 mt-6">
            Sem cartão de crédito necessário • 10 mensagens grátis para sempre
          </p>
        </div>
      </section>
      </main>

      {/* Footer */}
        <Footer />
        </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <PricingContent />
    </Suspense>
  );
}
