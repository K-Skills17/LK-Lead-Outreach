import { SimpleNavbar } from '@/components/ui/navbar';
import { Shield, Mail, Phone } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-white">
      <SimpleNavbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-24">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Política de Privacidade
          </h1>
          <p className="text-lg text-gray-600">
            Última atualização: 12 de janeiro de 2026
          </p>
        </div>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introdução</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              A <strong>46 337 446 STEPHEN DOMINGOS DOMINGOS</strong> ("nós", "nosso" ou "LK Reactor Pro") está comprometida em proteger sua privacidade. 
              Esta Política de Privacidade explica como coletamos, usamos, divulgamos e protegemos suas informações 
              quando você usa nosso aplicativo LK Reactor Pro.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Informações que Coletamos</h2>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">2.1 Informações Fornecidas por Você</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Nome completo e informações de contato (e-mail, telefone)</li>
              <li>Informações da clínica odontológica</li>
              <li>Dados de pacientes (nome, telefone) para envio de mensagens</li>
              <li>Informações de pagamento (processadas por terceiros seguros)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">2.2 Informações Coletadas Automaticamente</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Dados de uso do aplicativo (campanhas criadas, mensagens enviadas)</li>
              <li>Informações do dispositivo (sistema operacional, versão do app)</li>
              <li>Logs de atividade e diagnósticos técnicos</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Como Usamos Suas Informações</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Utilizamos suas informações para:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Fornecer, operar e manter o LK Reactor Pro</li>
              <li>Processar campanhas de reativação de pacientes</li>
              <li>Enviar mensagens via WhatsApp para seus pacientes</li>
              <li>Processar pagamentos e gerenciar assinaturas</li>
              <li>Enviar atualizações, notificações e suporte técnico</li>
              <li>Melhorar nossos serviços e desenvolver novos recursos</li>
              <li>Cumprir obrigações legais e regulatórias</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Compartilhamento de Informações</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>Não vendemos suas informações pessoais.</strong> Compartilhamos informações apenas nas seguintes situações:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li><strong>Provedores de Serviço:</strong> Mercado Pago (pagamentos), Supabase (armazenamento de dados)</li>
              <li><strong>WhatsApp/Meta:</strong> Para envio de mensagens conforme sua instrução</li>
              <li><strong>Requisitos Legais:</strong> Quando exigido por lei ou para proteger nossos direitos</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Segurança dos Dados</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Implementamos medidas de segurança técnicas e organizacionais para proteger suas informações:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Criptografia de dados em trânsito (HTTPS/TLS)</li>
              <li>Criptografia de dados em repouso</li>
              <li>Controles de acesso rigorosos</li>
              <li>Monitoramento contínuo de segurança</li>
              <li>Backups regulares</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Seus Direitos (LGPD)</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem direito a:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li><strong>Confirmação e acesso:</strong> Saber se processamos seus dados e acessá-los</li>
              <li><strong>Correção:</strong> Corrigir dados incompletos, inexatos ou desatualizados</li>
              <li><strong>Anonimização ou exclusão:</strong> Solicitar anonimização ou exclusão de dados desnecessários</li>
              <li><strong>Portabilidade:</strong> Solicitar transferência de dados para outro fornecedor</li>
              <li><strong>Revogação de consentimento:</strong> Retirar consentimento a qualquer momento</li>
              <li><strong>Oposição:</strong> Opor-se ao tratamento de dados em certas circunstâncias</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-4">
              Para exercer seus direitos, entre em contato conosco pelos canais abaixo.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Retenção de Dados</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Mantemos seus dados apenas pelo tempo necessário para:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Fornecer nossos serviços durante sua assinatura ativa</li>
              <li>Cumprir obrigações legais (geralmente 5 anos para dados fiscais)</li>
              <li>Resolver disputas e fazer cumprir acordos</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-4">
              Após o cancelamento, seus dados serão excluídos em até 90 dias, exceto quando a retenção for exigida por lei.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Cookies e Tecnologias Similares</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Nosso site pode usar cookies essenciais para:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Manter sessões ativas e autenticação</li>
              <li>Lembrar preferências do usuário</li>
              <li>Analisar uso do site (de forma anonimizada)</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-4">
              Você pode configurar seu navegador para recusar cookies, mas isso pode afetar a funcionalidade.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Alterações a Esta Política</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos sobre mudanças 
              significativas por e-mail ou aviso no aplicativo. A data de "Última atualização" no topo 
              indicará quando a política foi revisada pela última vez.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Contato</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Se você tiver dúvidas sobre esta Política de Privacidade ou quiser exercer seus direitos, 
              entre em contato conosco:
            </p>
            <div className="bg-gray-50 rounded-lg p-6 space-y-3">
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-2">Razão Social:</p>
                <p className="text-gray-700">46 337 446 STEPHEN DOMINGOS DOMINGOS</p>
                <p className="text-gray-700"><strong>CNPJ:</strong> 46.337.446/0001-07</p>
              </div>
              <div className="flex items-center gap-3 pt-3 border-t border-gray-200">
                <Mail className="w-5 h-5 text-blue-600" />
                <span className="text-gray-900 font-medium">contato@lkdigital.org</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-blue-600" />
                <span className="text-gray-900 font-medium">+55 11 95282-9271</span>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500">
            © 2026 46 337 446 STEPHEN DOMINGOS DOMINGOS. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </main>
  );
}
