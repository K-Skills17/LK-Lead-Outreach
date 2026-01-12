# 🎯 Landing Page & Pricing Fixes

## Changes Needed

### 1. Remove Navigation Buttons from Landing Page

**File**: `app/page.tsx`

**Line 27** - Change:
```typescript
import { Navbar } from '@/components/ui/navbar';
```

**To**:
```typescript
import { SimpleNavbar } from '@/components/ui/navbar';
import Link from 'next/link';
```

**Line 167** - Change:
```typescript
<Navbar />
```

**To**:
```typescript
<SimpleNavbar />
```

This removes the "Preços" and "Download" buttons, showing only the logo.

---

### 2. Redirect to Full Pricing Page After Calculator

**File**: `app/page.tsx`

**Lines 320-461** - Replace the entire Step 3 section with:

```typescript
        {/* Step 3: Results & Redirect to Pricing */}
        {currentStep === 3 && (
          <WizardStep key="step3" isActive={true} direction={direction}>
            <div className="mb-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg animate-pulse">
                  <TrendingDown className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                    Seu Diagnóstico
                  </h2>
                  <p className="text-sm text-gray-600">
                    Impacto financeiro identificado
                  </p>
                </div>
              </div>

              <div className="relative bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-200 rounded-2xl p-6 sm:p-8 mb-6 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-200/30 rounded-full -mr-16 -mt-16"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                    <p className="text-sm font-bold text-red-600 uppercase tracking-wide">
                      Receita Perdida por Mês
                    </p>
                  </div>
                  <p className="text-4xl sm:text-5xl md:text-6xl font-black text-red-600 break-words mb-4">
                    {formatCurrency(lostRevenue)}
                  </p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl">
                    <span className="text-2xl">😰</span>
                    <p className="text-sm text-red-800 font-medium">
                      <span className="font-bold">{formData.inactivePercent}%</span> dos seus pacientes ({Math.round(formData.totalPatients * (formData.inactivePercent / 100))} pacientes) inativos há 6+ meses
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50 border-2 border-emerald-200 rounded-2xl p-6 sm:p-8 overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-200/20 rounded-full -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-200/20 rounded-full -ml-16 -mb-16"></div>
                
                <div className="relative z-10 text-center">
                  <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                    💡 Recupere Esses Pacientes!
                  </h3>
                  <p className="text-base sm:text-lg text-gray-700 mb-6">
                    Veja as soluções que vão trazer esses pacientes de volta para sua clínica
                  </p>

                  <Link href="/precos">
                    <WizardButton>
                      Ver Planos e Soluções
                    </WizardButton>
                  </Link>
                  
                  <p className="text-xs text-gray-600 mt-4">
                    ✓ 3 planos disponíveis • ✓ Teste grátis • ✓ Sem cartão de crédito
                  </p>
                </div>
              </div>

              <button
                onClick={handlePrevious}
                className="w-full mt-6 py-2 text-xs sm:text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Voltar e editar dados
              </button>
            </div>
          </WizardStep>
        )}
```

---

### 3. Update Pricing Page with Benefit-Focused Copy

**File**: `app/precos/page.tsx`

**Lines 11-85** - Replace the `tiers` array with:

```typescript
  const tiers = [
    {
      name: 'FREE',
      subtitle: 'Teste o Motor',
      price: 0,
      priceAnnual: 0,
      description: 'Experimente o envio sem compromisso.',
      icon: '🟢',
      color: 'emerald',
      popular: false,
      cta: 'Começar Grátis',
      ctaLink: '/setup',
      features: [
        'Reative até 10 pacientes por dia',
        'Envie mensagens personalizadas via WhatsApp',
        'Teste o sistema antes de investir',
        'Sem necessidade de cartão',
        'Cancele quando quiser',
      ],
      limits: '10 mensagens/dia',
      idealFor: 'Dentistas que querem testar antes de investir',
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
      cta: 'Ativar Professional',
      ctaLink: process.env.NEXT_PUBLIC_PRO_PAYMENT_URL || '#',
      features: [
        'Reative até 500 pacientes por dia',
        'Crie campanhas personalizadas sem escrever nada',
        'IA cria mensagens profissionais automaticamente',
        'Acompanhe resultados em tempo real no painel',
        'Importe sua base de pacientes em segundos (CSV)',
        'Evite envios duplicados e pacientes bloqueados',
        'Programa envios automáticos no piloto',
      ],
      limits: '500 mensagens/dia',
      idealFor: 'Clínicas que querem resultados previsíveis',
    },
    {
      name: 'PREMIUM',
      subtitle: 'Maximize Resultados',
      price: 497,
      priceAnnual: 4970,
      description: 'O máximo de conversão e agendamentos.',
      icon: '🟣',
      color: 'purple',
      popular: false,
      cta: 'Ativar Premium',
      ctaLink: process.env.NEXT_PUBLIC_PREMIUM_PAYMENT_URL || '#',
      features: [
        'Mensagens ILIMITADAS por dia',
        'IA cria 3 versões de cada mensagem (teste A/B/C)',
        'Personalize tom: premium, amigável ou direto',
        '7 tipos de campanha prontos (reativação, promoção, recall...)',
        'Mensagens adaptam-se automaticamente a cada paciente',
        'Suporte prioritário para máxima conversão',
        'Ideal para clínicas que querem escalar rápido',
      ],
      limits: 'Mensagens ilimitadas',
      idealFor: 'Clínicas que querem maximizar agendamentos',
    },
  ];
```

This changes features from technical specs to **benefits** - what the dentist will GET:
- ❌ "7 campanhas mensal" (technical)
- ✅ "Crie campanhas personalizadas sem escrever nada" (benefit)

---

## Summary of Changes

### Before:
1. Landing page showed "Preços" and "Download" buttons during calculator
2. After calculator, only showed $67 offer
3. Features were technical ("7 campanhas", "CSV upload", etc.)

### After:
1. Landing page shows ONLY logo (no navigation)
2. After calculator, redirects to FULL pricing page with all 3 plans
3. Features describe what dentists GET:
   - "Reative até 500 pacientes por dia"
   - "Crie campanhas personalizadas sem escrever nada"
   - "IA cria mensagens profissionais automaticamente"
   - "Acompanhe resultados em tempo real"

---

## How to Apply

1. Open `app/page.tsx`
2. Make changes to lines 27 and 167 (SimpleNavbar)
3. Replace lines 320-461 with the new Step 3 code
4. Open `app/precos/page.tsx`
5. Replace lines 11-85 with the new benefits-focused tiers
6. Save all files
7. Test the flow:
   - Go to `/` → Fill calculator → Click "Ver Planos e Soluções"
   - Should redirect to `/precos` with all 3 plans visible

---

## User Flow After Changes

```
1. User visits: / (landing page)
   ↓ (sees ONLY logo, no nav buttons)
2. Fills calculator (Steps 1-2)
   ↓
3. Sees lost revenue (Step 3)
   ↓
4. Clicks "Ver Planos e Soluções"
   ↓
5. Redirects to: /precos
   ↓
6. Sees ALL 3 plans with benefit-focused copy:
   - FREE: "Reative até 10 pacientes por dia"
   - PROFESSIONAL: "Reative até 500 pacientes por dia"
   - PREMIUM: "Mensagens ILIMITADAS por dia"
   ↓
7. Chooses plan and proceeds to payment
```

---

**Ready to apply these changes!** 🚀
