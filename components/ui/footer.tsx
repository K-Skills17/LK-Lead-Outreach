import Link from 'next/link';
import Image from 'next/image';
import { Mail, Phone } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Logo and Description */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <Image
                src="/lk-reactor-logo.svg"
                alt="LK Reactor Pro"
                width={120}
                height={36}
                className="h-10 w-auto object-contain"
              />
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              Transforme contatos inativos em consultas reais com controle, segurança e inteligência. 
              Sistema de reativação de pacientes para clínicas odontológicas.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-emerald-500" />
                <a href="mailto:contato@lkdigital.org" className="hover:text-emerald-500 transition-colors">
                  contato@lkdigital.org
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-emerald-500" />
                <a href="https://wa.me/5511952829271" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-500 transition-colors">
                  +55 11 95282-9271
                </a>
              </div>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-bold text-white mb-4">Produto</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/precos" className="hover:text-emerald-500 transition-colors">
                  Preços
                </Link>
              </li>
              <li>
                <Link href="/setup" className="hover:text-emerald-500 transition-colors">
                  Download
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-bold text-white mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacidade" className="hover:text-emerald-500 transition-colors">
                  Política de Privacidade
                </Link>
              </li>
              <li>
                <Link href="/termos" className="hover:text-emerald-500 transition-colors">
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link href="/lgpd" className="hover:text-emerald-500 transition-colors">
                  LGPD
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-800 text-center text-sm text-gray-500">
          <p>© 2026 46 337 446 STEPHEN DOMINGOS DOMINGOS. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
