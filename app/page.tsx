'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  Calculator,
  User,
  Phone,
  Mail,
  TrendingDown,
  CheckCircle,
  Users,
  Building2,
  Sparkles,
} from 'lucide-react';
import {
  WizardContainer,
  WizardStep,
  WizardProgress,
  WizardButton,
  NumberInput,
  CurrencyInput,
  SliderInput,
  PhoneInput,
  EmailInput,
  TextInput,
} from '@/components/ui/wizard';
import { SimpleNavbar } from '@/components/ui/navbar';
import Link from 'next/link';
import { fbLead, fbViewContent } from '@/lib/facebook-pixel';
import { 
  trackPageView, 
  trackLeadStarted, 
  trackLeadStep1, 
  trackLeadStep2, 
  trackLeadCompleted 
} from '@/lib/analytics';

interface FormData {
  totalLeads: number;
  ticketMedio: number;
  inactivePercent: number;
  companyName: string;
  name: string;
  whatsapp: string;
  email: string;
}

interface FormErrors {
  totalLeads?: string;
  ticketMedio?: string;
  companyName?: string;
  name?: string;
  whatsapp?: string;
  email?: string;
}

export default function Home() {
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    totalLeads: 0,
    ticketMedio: 0,
    inactivePercent: 40,
    companyName: '',
    name: '',
    whatsapp: '+55 ',
    email: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const totalSteps = 3;

  // Track page view on mount
  useEffect(() => {
    trackPageView('/');
  }, []);

  // Track lead started when user starts filling form
  useEffect(() => {
    if (currentStep === 1 && (formData.totalLeads > 0 || formData.ticketMedio > 0)) {
      trackLeadStarted();
    }
  }, [currentStep, formData.totalLeads, formData.ticketMedio]);

  // Calculate lost revenue
  const lostRevenue =
    formData.totalLeads *
    (formData.inactivePercent / 100) *
    formData.ticketMedio;

  // Format currency
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  // Validation functions
  const validateStep1 = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.totalLeads || formData.totalLeads < 1) {
      newErrors.totalLeads = 'Informe o total de leads';
    }

    if (!formData.ticketMedio || formData.ticketMedio < 0.01) {
      newErrors.ticketMedio = 'Informe o ticket médio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.companyName || formData.companyName.length < 2) {
      newErrors.companyName = 'Nome da empresa deve ter no mínimo 2 caracteres';
    }

    if (!formData.name || formData.name.length < 2) {
      newErrors.name = 'Nome deve ter no mínimo 2 caracteres';
    }

    if (!formData.whatsapp || formData.whatsapp.length < 16) {
      newErrors.whatsapp = 'WhatsApp inválido';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Navigation handlers
  const handleNext = () => {
    if (currentStep === 1) {
      if (!validateStep1()) return;
      trackLeadStep1({
        totalPatients: formData.totalLeads, // Keep for backward compatibility with analytics
        ticketMedio: formData.ticketMedio,
        inactivePercent: formData.inactivePercent,
        lostRevenue,
      });
    }
    
    if (currentStep === 2) {
      if (!validateStep2()) return;
      
      trackLeadStep2({
        clinicName: formData.companyName, // Keep for backward compatibility with analytics
        name: formData.name,
        email: formData.email,
        whatsapp: formData.whatsapp,
      });

      // Track Lead on Facebook Pixel (Browser)
      fbLead('Lead Form');
    }

    setDirection('forward');
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  };

  const handlePrevious = () => {
    setDirection('backward');
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Submit diagnostic data when reaching step 3
  useEffect(() => {
    if (currentStep === 3 && !isSubmitting) {
      submitDiagnostic();
      trackLeadCompleted({
        ...formData,
        lostRevenue,
      });
    }
  }, [currentStep]);

  const submitDiagnostic = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/submit-diagnostic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          lostRevenue,
        }),
      });

      const data = await response.json();
      console.log('Diagnostic submitted:', data);
    } catch (error) {
      console.error('Error submitting diagnostic:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SimpleNavbar />
      <main>
        <WizardContainer>
          <WizardProgress currentStep={currentStep} totalSteps={totalSteps} />

      <AnimatePresence mode="wait">
        {/* Step 1: Diagnostic Inputs */}
        {currentStep === 1 && (
          <WizardStep key="step1" isActive={true} direction={direction}>
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-slate-700 to-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Calculator className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                    Diagnóstico Inicial
                  </h2>
                  <p className="text-sm text-gray-600">
                    Veja o impacto dos leads inativos
                  </p>
                </div>
              </div>
            </div>

            <NumberInput
              id="totalLeads"
              label="Total de Leads"
              value={formData.totalLeads || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  totalLeads: parseInt(e.target.value) || 0,
                })
              }
              placeholder="Ex: 500"
              required
              min={1}
              error={errors.totalLeads}
              icon={<Users className="w-5 h-5" />}
              helperText="Quantos leads você tem cadastrados?"
            />

            <CurrencyInput
              id="ticketMedio"
              label="Ticket Médio"
              value={formData.ticketMedio}
              onChange={(value) =>
                setFormData({ ...formData, ticketMedio: value })
              }
              required
              error={errors.ticketMedio}
              helperText="Valor médio gasto por paciente"
            />

            <SliderInput
              id="inactivePercent"
              label="Percentual de Leads Inativos"
              value={formData.inactivePercent}
              onChange={(value) =>
                setFormData({ ...formData, inactivePercent: value })
              }
              min={10}
              max={90}
              step={5}
              helperText="Quantos % dos seus leads não respondem há mais de 6 meses?"
            />

            <div className="flex gap-3 mt-6">
              <WizardButton onClick={handleNext} icon="next">
                Continuar
              </WizardButton>
            </div>
          </WizardStep>
        )}

        {/* Step 2: Lead Capture */}
        {currentStep === 2 && (
          <WizardStep key="step2" isActive={true} direction={direction}>
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-slate-700 to-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <User className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                    Seus Dados
                  </h2>
                  <p className="text-sm text-gray-600">
                    Receba seu diagnóstico personalizado
                  </p>
                </div>
              </div>
            </div>

            <TextInput
              id="companyName"
              label="Nome da Empresa"
              value={formData.companyName}
              onChange={(e) =>
                setFormData({ ...formData, companyName: e.target.value })
              }
              placeholder="Empresa Exemplo Ltda"
              required
              error={errors.companyName}
              icon={<Building2 className="w-5 h-5" />}
            />

            <TextInput
              id="name"
              label="Nome Completo"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Dr. João Silva"
              required
              error={errors.name}
              icon={<User className="w-5 h-5" />}
            />

            <PhoneInput
              id="whatsapp"
              label="WhatsApp"
              value={formData.whatsapp}
              onChange={(value) =>
                setFormData({ ...formData, whatsapp: value })
              }
              required
              error={errors.whatsapp}
              icon={<Phone className="w-5 h-5" />}
            />

            <EmailInput
              id="email"
              label="Email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="seu@email.com"
              required
              error={errors.email}
              icon={<Mail className="w-5 h-5" />}
            />

            <div className="flex gap-3 mt-6">
              <WizardButton
                onClick={handlePrevious}
                variant="secondary"
                icon="prev"
              >
                Voltar
              </WizardButton>
              <WizardButton onClick={handleNext} icon="next">
                Ver Resultado
              </WizardButton>
            </div>
          </WizardStep>
        )}

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
                  <p className="text-3xl sm:text-4xl md:text-5xl font-black text-red-600 whitespace-nowrap mb-4">
                    {formatCurrency(lostRevenue)}
                  </p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl">
                    <span className="text-2xl">😰</span>
                    <p className="text-sm text-red-800 font-medium">
                      <span className="font-bold">{formData.inactivePercent}%</span> dos seus leads ({Math.round(formData.totalLeads * (formData.inactivePercent / 100))} leads) inativos há 6+ meses
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 border-2 border-blue-200 rounded-2xl p-6 sm:p-8 overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-blue-200/20 rounded-full -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-slate-200/20 rounded-full -ml-16 -mb-16"></div>
                
                <div className="relative z-10 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-slate-700 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <Sparkles className="w-9 h-9 text-white" />
                    </div>
                  </div>
                  
                  <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                    💡 Recupere Esses Leads!
                  </h3>
                  <p className="text-base sm:text-lg text-gray-700 mb-6 max-w-lg mx-auto">
                    Veja as soluções que vão trazer esses leads de volta para sua empresa automaticamente
                  </p>

                  <div className="bg-white/90 backdrop-blur-sm rounded-xl p-5 mb-6 shadow-md max-w-md mx-auto">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                      <p className="text-sm font-bold text-gray-900">
                        Teste GRÁTIS por 14 dias
                      </p>
                    </div>
                    <p className="text-xs text-gray-600">
                      Sem cartão de crédito • Sem compromisso • Cancele quando quiser
                    </p>
                  </div>

                  <Link href="/dashboard">
                    <WizardButton>
                      🚀 Acessar Dashboard
                    </WizardButton>
                  </Link>
                  
                  <p className="text-xs text-gray-600 mt-4">
                    ✓ 3 planos disponíveis • ✓ Reative leads automaticamente • ✓ Mensagens com IA
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
      </AnimatePresence>
    </WizardContainer>
      </main>
      </>
  );
}
