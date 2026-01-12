import { SimpleNavbar } from '@/components/ui/navbar';
import { FileText, Mail, Phone } from 'lucide-react';

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-white">
      <SimpleNavbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-24">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-6">
            <FileText className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Termos de Uso
          </h1>
          <p className="text-lg text-gray-600">
            Última atualização: 12 de janeiro de 2026
          </p>
        </div>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Aceitação dos Termos</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Ao acessar e usar o LK Reactor Pro, você concorda em cumprir estes Termos de Uso. 
              Se você não concorda com alguma parte destes termos, não deve usar nosso aplicativo.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              Estes termos constituem um acordo legal vinculante entre você ("Usuário", "você" ou "seu") 
              e a <strong>46 337 446 STEPHEN DOMINGOS DOMINGOS</strong> ("nós", "nosso" ou "LK Reactor Pro").
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Descrição do Serviço</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              O LK Reactor Pro é uma plataforma de automação de mensagens WhatsApp projetada para 
              clínicas odontológicas reativarem pacientes inativos. O serviço inclui:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Envio automatizado de mensagens via WhatsApp</li>
              <li>Geração de mensagens personalizadas com IA</li>
              <li>Gerenciamento de campanhas de reativação</li>
              <li>Painel de controle e relatórios</li>
              <li>Importação e gerenciamento de contatos</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Elegibilidade e Cadastro</h2>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">3.1 Requisitos de Elegibilidade</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Para usar o LK Reactor Pro, você deve:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Ter pelo menos 18 anos de idade</li>
              <li>Ser proprietário ou representante autorizado de uma clínica odontológica</li>
              <li>Possuir um número de WhatsApp Business válido</li>
              <li>Fornecer informações verdadeiras e atualizadas</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">3.2 Responsabilidades da Conta</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Você é responsável por:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Manter a confidencialidade de sua chave de licença</li>
              <li>Todas as atividades que ocorrem sob sua conta</li>
              <li>Notificar-nos imediatamente sobre qualquer uso não autorizado</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Uso Aceitável</h2>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">4.1 Você Concorda em:</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Usar o serviço apenas para fins legítimos de reativação de pacientes</li>
              <li>Obter consentimento adequado dos pacientes antes de enviar mensagens</li>
              <li>Cumprir todas as leis aplicáveis (LGPD, CAN-SPAM, etc.)</li>
              <li>Respeitar os Termos de Serviço do WhatsApp</li>
              <li>Enviar apenas mensagens relevantes e não spam</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">4.2 Você NÃO Pode:</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Enviar spam, conteúdo enganoso ou fraudulento</li>
              <li>Violar direitos de privacidade de terceiros</li>
              <li>Compartilhar sua licença com outras clínicas</li>
              <li>Fazer engenharia reversa ou copiar o software</li>
              <li>Usar o serviço para qualquer atividade ilegal</li>
              <li>Tentar contornar limites de mensagens ou recursos</li>
              <li>Revender ou redistribuir o serviço</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Planos e Pagamentos</h2>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">5.1 Planos Disponíveis</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li><strong>Grátis:</strong> 10 mensagens/dia, uso ilimitado</li>
              <li><strong>Professional:</strong> 500 mensagens/dia, R$197/mês (14 dias grátis)</li>
              <li><strong>Premium:</strong> Mensagens ilimitadas, R$497/mês (14 dias grátis)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">5.2 Cobrança e Renovação</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              - <strong>Período de teste:</strong> Planos pagos incluem 14 dias grátis. Você pode cancelar antes do fim do período sem cobrança.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              - <strong>Renovação automática:</strong> Assinaturas são renovadas automaticamente no ciclo escolhido (mensal/anual).
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              - <strong>Processamento de pagamento:</strong> Pagamentos são processados via Mercado Pago. Consulte os termos do Mercado Pago.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              - <strong>Impostos:</strong> Você é responsável por quaisquer impostos aplicáveis.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">5.3 Reembolsos</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              - Reembolsos são considerados caso a caso dentro de 7 dias da cobrança inicial.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              - Não há reembolso proporcional para cancelamentos durante o ciclo de faturamento.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              - Você pode cancelar a qualquer momento; o acesso continua até o fim do período pago.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Propriedade Intelectual</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              O LK Reactor Pro, incluindo seu software, design, logo, conteúdo e recursos, é propriedade 
              exclusiva da <strong>46 337 446 STEPHEN DOMINGOS DOMINGOS</strong> e está protegido por leis de direitos autorais e propriedade intelectual.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              Você recebe uma licença limitada, não exclusiva, intransferível e revogável para usar o 
              software conforme estes termos. Esta licença não lhe concede propriedade sobre o software.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Limitação de Responsabilidade</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>O LK Reactor Pro é fornecido "como está" e "conforme disponível".</strong>
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              Nós não garantimos que:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>O serviço será ininterrupto ou livre de erros</li>
              <li>Mensagens serão entregues 100% das vezes</li>
              <li>Sua conta do WhatsApp não será banida (depende do uso adequado)</li>
              <li>Você obterá resultados específicos (reativação de pacientes)</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>Não somos responsáveis por:</strong>
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Banimento de conta do WhatsApp devido a uso indevido</li>
              <li>Perda de dados causada por problemas técnicos ou ações do usuário</li>
              <li>Danos indiretos, incidentais ou consequenciais</li>
              <li>Mudanças nas políticas do WhatsApp que afetem o serviço</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-4">
              Nossa responsabilidade máxima é limitada ao valor pago por você nos últimos 12 meses.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Suspensão e Encerramento</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Podemos suspender ou encerrar sua conta imediatamente, sem aviso prévio, se você:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Violar estes Termos de Uso</li>
              <li>Usar o serviço para atividades ilegais ou spam</li>
              <li>Não pagar taxas devidas</li>
              <li>Fornecer informações falsas</li>
              <li>Comprometer a segurança do sistema</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-4">
              Você pode cancelar sua assinatura a qualquer momento através do painel do Mercado Pago.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Alterações aos Termos</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Reservamo-nos o direito de modificar estes termos a qualquer momento. Notificaremos sobre 
              mudanças significativas por e-mail ou aviso no aplicativo com pelo menos 15 dias de antecedência.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              Seu uso contínuo após as mudanças constitui aceitação dos novos termos.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Lei Aplicável e Jurisdição</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Estes termos são regidos pelas leis da República Federativa do Brasil. Quaisquer disputas 
              serão resolvidas nos tribunais de São Paulo, SP.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Contato</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Para dúvidas sobre estes Termos de Uso, entre em contato:
            </p>
            <div className="bg-gray-50 rounded-lg p-6 space-y-3">
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-2">Razão Social:</p>
                <p className="text-gray-700">46 337 446 STEPHEN DOMINGOS DOMINGOS</p>
                <p className="text-gray-700"><strong>CNPJ:</strong> 46.337.446/0001-07</p>
              </div>
              <div className="flex items-center gap-3 pt-3 border-t border-gray-200">
                <Mail className="w-5 h-5 text-emerald-600" />
                <span className="text-gray-900 font-medium">contato@lkdigital.org</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-emerald-600" />
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
