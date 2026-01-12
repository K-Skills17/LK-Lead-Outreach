'use client';

import React, { InputHTMLAttributes, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';

// Wizard Container
interface WizardContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function WizardContainer({ children, className = '' }: WizardContainerProps) {
  return (
    <div className={`min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50 flex items-center justify-center p-4 pt-24 sm:pt-28 md:pt-32 relative overflow-hidden ${className}`}>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
      
      <div className="w-full max-w-lg relative z-10">
        {children}
      </div>
    </div>
  );
}

// Wizard Step
interface WizardStepProps {
  children: React.ReactNode;
  isActive: boolean;
  direction?: 'forward' | 'backward';
}

export function WizardStep({ children, isActive, direction = 'forward' }: WizardStepProps) {
  const variants = {
    enter: {
      x: direction === 'forward' ? 50 : -50,
      opacity: 0,
      scale: 0.98,
    },
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: {
      x: direction === 'forward' ? -50 : 50,
      opacity: 0,
      scale: 0.98,
    },
  };

  if (!isActive) return null;

  return (
    <motion.div
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ 
        duration: 0.4, 
        ease: [0.4, 0, 0.2, 1],
        scale: { duration: 0.3 }
      }}
      className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-100 p-6 sm:p-8 md:p-10"
    >
      {children}
    </motion.div>
  );
}

// Wizard Progress
interface WizardProgressProps {
  currentStep: number;
  totalSteps: number;
}

export function WizardProgress({ currentStep, totalSteps }: WizardProgressProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span className="text-sm font-semibold text-gray-700">
            Passo {currentStep} de {totalSteps}
          </span>
        </div>
        <span className="text-sm font-bold text-emerald-600">
          {Math.round((currentStep / totalSteps) * 100)}%
        </span>
      </div>
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden shadow-inner">
        <motion.div
          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full shadow-lg"
          initial={{ width: 0 }}
          animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        />
      </div>
    </div>
  );
}

// Wizard Button
interface WizardButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
  type?: 'button' | 'submit';
  icon?: 'next' | 'prev';
  loading?: boolean;
}

export function WizardButton({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  type = 'button',
  icon,
  loading = false,
}: WizardButtonProps) {
  const baseClasses = 'w-full h-14 rounded-xl font-semibold text-base transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg';
  const variantClasses = variant === 'primary'
    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:hover:scale-100'
    : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98]';

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses}`}
      whileHover={{ y: -2 }}
      whileTap={{ y: 0 }}
    >
      {icon === 'prev' && !loading && <ChevronLeft className="w-5 h-5" />}
      {loading ? (
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span>Aguarde...</span>
        </div>
      ) : (
        children
      )}
      {icon === 'next' && !loading && <ChevronRight className="w-5 h-5" />}
    </motion.button>
  );
}

// Number Input
interface NumberInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  ({ label, error, helperText, icon, className = '', ...props }, ref) => {
    return (
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-800 mb-2.5">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="relative group">
          {icon && (
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-600 transition-colors">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            type="number"
            className={`w-full h-14 px-4 ${icon ? 'pl-12' : ''} bg-white border-2 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all text-base font-medium ${
              error ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-100' : 'border-gray-200 hover:border-gray-300'
            } ${className}`}
            {...props}
          />
        </div>
        {error && (
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-sm text-red-600 font-medium"
          >
            {error}
          </motion.p>
        )}
        {helperText && !error && (
          <p className="mt-2 text-sm text-gray-600">{helperText}</p>
        )}
      </div>
    );
  }
);

NumberInput.displayName = 'NumberInput';

// Currency Input
interface CurrencyInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  label: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  onChange?: (value: number) => void;
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ label, error, helperText, icon, onChange, value, className = '', ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const numbers = e.target.value.replace(/\D/g, '');
      const amount = parseFloat(numbers) / 100;
      if (onChange) {
        onChange(isNaN(amount) ? 0 : amount);
      }
    };

    const displayValue = typeof value === 'number' && value > 0 
      ? value.toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : '';

    return (
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-800 mb-2.5">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="relative group">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-emerald-600 font-bold text-lg">
            R$
          </div>
          <input
            ref={ref}
            type="text"
            value={displayValue}
            onChange={handleChange}
            className={`w-full h-14 px-4 pl-14 bg-white border-2 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all text-base font-medium ${
              error ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-100' : 'border-gray-200 hover:border-gray-300'
            } ${className}`}
            placeholder="0,00"
            {...props}
          />
        </div>
        {error && (
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-sm text-red-600 font-medium"
          >
            {error}
          </motion.p>
        )}
        {helperText && !error && (
          <p className="mt-2 text-sm text-gray-600">{helperText}</p>
        )}
      </div>
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';

// Slider Input
interface SliderInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  helperText?: string;
}

export function SliderInput({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  helperText,
}: SliderInputProps) {
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <label className="block text-sm font-semibold text-gray-800">
          {label}
        </label>
        <div className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xl font-bold rounded-xl shadow-lg">
          {value}%
        </div>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-3 bg-gray-200 rounded-full appearance-none cursor-pointer slider-thumb"
          style={{
            background: `linear-gradient(to right, #10b981 0%, #14b8a6 ${((value - min) / (max - min)) * 100}%, #e5e7eb ${((value - min) / (max - min)) * 100}%, #e5e7eb 100%)`,
          }}
        />
      </div>
      <div className="flex justify-between text-xs font-medium text-gray-500 mt-2">
        <span>{min}%</span>
        <span>{max}%</span>
      </div>
      {helperText && <p className="mt-3 text-sm text-gray-600">{helperText}</p>}
      <style jsx>{`
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #10b981, #14b8a6);
          cursor: pointer;
          box-shadow: 0 4px 8px rgba(16, 185, 129, 0.4);
          transition: all 0.2s;
        }
        .slider-thumb::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 12px rgba(16, 185, 129, 0.5);
        }
        .slider-thumb::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #10b981, #14b8a6);
          cursor: pointer;
          border: none;
          box-shadow: 0 4px 8px rgba(16, 185, 129, 0.4);
          transition: all 0.2s;
        }
        .slider-thumb::-moz-range-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 12px rgba(16, 185, 129, 0.5);
        }
      `}</style>
    </div>
  );
}

// Phone Input
interface PhoneInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  label: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  onChange?: (value: string) => void;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ label, error, helperText, icon, onChange, value, className = '', ...props }, ref) => {
    const formatPhoneNumber = (val: string) => {
      const numbers = val.replace(/\D/g, '');
      
      // Always start with +55 for Brazilian numbers
      if (numbers.length === 0) {
        return '+55 ';
      } else if (numbers.length <= 2) {
        return `+${numbers} `;
      } else if (numbers.length <= 4) {
        return `+${numbers.slice(0, 2)} (${numbers.slice(2)}`;
      } else if (numbers.length <= 9) {
        return `+${numbers.slice(0, 2)} (${numbers.slice(2, 4)}) ${numbers.slice(4)}`;
      } else {
        return `+${numbers.slice(0, 2)} (${numbers.slice(2, 4)}) ${numbers.slice(4, 9)}-${numbers.slice(9, 13)}`;
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatPhoneNumber(e.target.value);
      if (onChange) {
        onChange(formatted);
      }
    };

    return (
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-800 mb-2.5">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="relative group">
          {icon && (
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-600 transition-colors">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            type="tel"
            value={value}
            onChange={handleChange}
            className={`w-full h-14 px-4 ${icon ? 'pl-12' : ''} bg-white border-2 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all text-base font-medium ${
              error ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-100' : 'border-gray-200 hover:border-gray-300'
            } ${className}`}
            placeholder="+55 (11) 99999-9999"
            {...props}
          />
        </div>
        {error && (
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-sm text-red-600 font-medium"
          >
            {error}
          </motion.p>
        )}
        {helperText && !error && (
          <p className="mt-2 text-sm text-gray-600">{helperText}</p>
        )}
      </div>
    );
  }
);

PhoneInput.displayName = 'PhoneInput';

// Email Input
interface EmailInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export const EmailInput = forwardRef<HTMLInputElement, EmailInputProps>(
  ({ label, error, helperText, icon, className = '', ...props }, ref) => {
    return (
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-800 mb-2.5">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="relative group">
          {icon && (
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-600 transition-colors">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            type="email"
            className={`w-full h-14 px-4 ${icon ? 'pl-12' : ''} bg-white border-2 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all text-base font-medium ${
              error ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-100' : 'border-gray-200 hover:border-gray-300'
            } ${className}`}
            {...props}
          />
        </div>
        {error && (
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-sm text-red-600 font-medium"
          >
            {error}
          </motion.p>
        )}
        {helperText && !error && (
          <p className="mt-2 text-sm text-gray-600">{helperText}</p>
        )}
      </div>
    );
  }
);

EmailInput.displayName = 'EmailInput';

// Text Input
interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ label, error, helperText, icon, className = '', ...props }, ref) => {
    return (
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-800 mb-2.5">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="relative group">
          {icon && (
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-600 transition-colors">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            type="text"
            className={`w-full h-14 px-4 ${icon ? 'pl-12' : ''} bg-white border-2 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all text-base font-medium ${
              error ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-100' : 'border-gray-200 hover:border-gray-300'
            } ${className}`}
            {...props}
          />
        </div>
        {error && (
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-sm text-red-600 font-medium"
          >
            {error}
          </motion.p>
        )}
        {helperText && !error && (
          <p className="mt-2 text-sm text-gray-600">{helperText}</p>
        )}
      </div>
    );
  }
);

TextInput.displayName = 'TextInput';
