'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      role="banner"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-xl shadow-lg border-b border-gray-100' 
          : 'bg-white/80 backdrop-blur-md border-b border-gray-100'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3 sm:py-4 md:py-5">
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center group relative"
          >
            <div className="relative h-16 sm:h-20 md:h-24 lg:h-28 w-auto">
              <Image
                src="/lk-reactor-logo.svg"
                alt="LK Reactor Pro"
                width={350}
                height={100}
                className="h-full w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                priority
              />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link 
              href="/dashboard" 
              className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors relative group"
            >
              Dashboard
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all group-hover:w-full"></span>
            </Link>
            <Link 
              href="/dashboard" 
              className="px-6 py-2.5 bg-gradient-to-r from-slate-700 to-blue-600 text-white text-sm font-semibold rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-300 relative overflow-hidden group"
            >
              <span className="relative z-10">Começar Agora</span>
              <div className="absolute inset-0 bg-gradient-to-r from-slate-800 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </Link>
          </nav>

          {/* Mobile menu button */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-gray-700 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white/98 backdrop-blur-xl">
          <div className="px-4 py-6 space-y-3">
            <Link 
              href="/dashboard" 
              className="block px-4 py-3 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link 
              href="/dashboard" 
              className="block px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-slate-700 to-blue-600 rounded-lg hover:shadow-lg transition-all text-center"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Começar Agora
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

export function SimpleNavbar() {
  return (
    <header role="banner" className="bg-white/95 backdrop-blur-xl border-b border-gray-100 py-4 sm:py-5 md:py-6 px-4 shadow-sm">
      <div className="max-w-4xl mx-auto flex items-center justify-center">
        <Link href="/" className="relative hover:opacity-90 transition-opacity h-16 sm:h-20 md:h-24">
          <Image
            src="/lk-reactor-logo.svg"
            alt="LK Reactor Pro"
            width={350}
            height={100}
            className="h-full w-auto object-contain"
            priority
          />
        </Link>
      </div>
    </header>
  );
}
