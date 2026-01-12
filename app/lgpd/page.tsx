import { SimpleNavbar } from '@/components/ui/navbar';
import { Scale, Mail, Phone, Shield } from 'lucide-react';

export default function LGPDPage() {
  return (
    <main className="min-h-screen bg-white">
      <SimpleNavbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-24">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-6">
            <Scale className="w-8 h-8 text-purple-600" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Conformidade com a LGPD
          </h1>
          <p className="text-lg text-gray-600">
            Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018)
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Última atualização: 12 de janeiro de 2026
          </p>
        </div>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Nosso Compromisso com a LGPD</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              A <strong>46 337 446 STEPHEN DOMINGOS DOMINGOS</strong> está comprometida com a proteção de dados pessoais de acordo com a 
              Lei Geral de Proteção de Dados (LGPD). Este documento detalha como cumprimos com 
              os princípios e obrigações estabelecidos pela LGPD.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Identificação do Controlador e Operador</h2>
            <div className="bg-purple-50 rounded-lg p-6 mb-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Controlador de Dados</h3>
              <p className="text-gray-700 mb-2"><strong>Razão Social:</strong> 46 337 446 STEPHEN DOMINGOS DOMINGOS</p>
              <p className="text-gray-700 mb-2"><strong>CNPJ:</strong> 46.337.446/0001-07</p>
              <p className="text-gray-700 mb-2"><strong>Aplicativo:</strong> LK Reactor Pro</p>
              <p className="text-gray-700 mb-2"><strong>E-mail:</strong> contato@lkdigital.org</p>
              <p className="text-gray-700"><strong>WhatsApp:</strong> +55 11 95282-9271</p>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>Papel:</strong> A <strong>46 337 446 STEPHEN DOMINGOS DOMINGOS</strong> atua como <strong>Controlador</strong> dos dados pessoais 
              dos usuários (clínicas odontológicas) e como <strong>Operador</strong> dos dados dos pacientes, 
              processando-os sob instrução das clínicas.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Base Legal para Tratamento de Dados</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Tratamos dados pessoais com base nas seguintes hipóteses legais (Art. 7º da LGPD):
            </p>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3">3.1 Dados das Clínicas (Usuários)</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li><strong>Execução de contrato:</strong> Para fornecer o serviço LK Reactor Pro conforme contratado</li>
              <li><strong>Legítimo interesse:</strong> Para melhorar nossos serviços e suporte ao cliente</li>
              <li><strong>Cumprimento de obrigação legal:</strong> Para fins fiscais e contábeis</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">3.2 Dados dos Pacientes</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li><strong>Execução de contrato:</strong> Processamento sob instrução da clínica para reativação</li>
              <li><strong>Consentimento:</strong> A clínica deve obter consentimento dos pacientes conforme aplicável</li>
              <li><strong>Legítimo interesse:</strong> Comunicação pós-atendimento (desde que não exista oposição)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Princípios da LGPD que Seguimos</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Nossa operação segue os 10 princípios da LGPD (Art. 6º):
            </p>
            <div className="space-y-4">
              <div className="border-l-4 border-purple-500 pl-4">
                <p className="font-semibold text-gray-900">1. Finalidade</p>
                <p className="text-gray-700 text-sm">Coletamos dados apenas para propósitos legítimos, específicos e explícitos.</p>
              </div>
              <div className="border-l-4 border-purple-500 pl-4">
                <p className="font-semibold text-gray-900">2. Adequação</p>
                <p className="text-gray-700 text-sm">O tratamento é compatível com as finalidades informadas ao titular.</p>
              </div>
              <div className="border-l-4 border-purple-500 pl-4">
                <p className="font-semibold text-gray-900">3. Necessidade</p>
                <p className="text-gray-700 text-sm">Limitamos a coleta ao mínimo necessário para atingir as finalidades.</p>
              </div>
              <div className="border-l-4 border-purple-500 pl-4">
                <p className="font-semibold text-gray-900">4. Livre Acesso</p>
                <p className="text-gray-700 text-sm">Garantimos consulta facilitada e gratuita sobre seus dados.</p>
              </div>
              <div className="border-l-4 border-purple-500 pl-4">
                <p className="font-semibold text-gray-900">5. Qualidade dos Dados</p>
                <p className="text-gray-700 text-sm">Mantemos dados exatos, claros e atualizados.</p>
              </div>
              <div className="border-l-4 border-purple-500 pl-4">
                <p className="font-semibold text-gray-900">6. Transparência</p>
                <p className="text-gray-700 text-sm">Fornecemos informações claras e acessíveis sobre o tratamento.</p>
              </div>
              <div className="border-l-4 border-purple-500 pl-4">
                <p className="font-semibold text-gray-900">7. Segurança</p>
                <p className="text-gray-700 text-sm">Implementamos medidas técnicas e administrativas para proteção.</p>
              </div>
              <div className="border-l-4 border-purple-500 pl-4">
                <p className="font-semibold text-gray-900">8. Prevenção</p>
                <p className="text-gray-700 text-sm">Adotamos medidas para prevenir danos aos titulares.</p>
              </div>
              <div className="border-l-4 border-purple-500 pl-4">
                <p className="font-semibold text-gray-900">9. Não Discriminação</p>
                <p className="text-gray-700 text-sm">Não realizamos tratamento para fins discriminatórios.</p>
              </div>
              <div className="border-l-4 border-purple-500 pl-4">
                <p className="font-semibold text-gray-900">10. Responsabilização e Prestação de Contas</p>
                <p className="text-gray-700 text-sm">Demonstramos eficácia das medidas e cumprimento das normas.</p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Direitos dos Titulares (Art. 18 LGPD)</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Você tem os seguintes direitos garantidos pela LGPD:
            </p>
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <div>
                <p className="font-semibold text-gray-900 mb-1">✅ Confirmação e Acesso</p>
                <p className="text-gray-700 text-sm">Confirmar a existência de tratamento e acessar seus dados</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">✏️ Correção</p>
                <p className="text-gray-700 text-sm">Corrigir dados incompletos, inexatos ou desatualizados</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">🔒 Anonimização, Bloqueio ou Eliminação</p>
                <p className="text-gray-700 text-sm">Solicitar anonimização, bloqueio ou eliminação de dados desnecessários</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">📦 Portabilidade</p>
                <p className="text-gray-700 text-sm">Solicitar transferência de dados para outro fornecedor</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">🗑️ Eliminação</p>
                <p className="text-gray-700 text-sm">Excluir dados tratados com base em consentimento</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">ℹ️ Informação sobre Compartilhamento</p>
                <p className="text-gray-700 text-sm">Saber com quem compartilhamos seus dados</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">🚫 Negativa de Consentimento</p>
                <p className="text-gray-700 text-sm">Recusar fornecer consentimento e conhecer as consequências</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">❌ Revogação de Consentimento</p>
                <p className="text-gray-700 text-sm">Retirar consentimento a qualquer momento</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">⚖️ Oposição</p>
                <p className="text-gray-700 text-sm">Opor-se ao tratamento em caso de descumprimento da LGPD</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">📋 Revisão de Decisões Automatizadas</p>
                <p className="text-gray-700 text-sm">Solicitar revisão de decisões tomadas unicamente por processamento automatizado</p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Como Exercer Seus Direitos</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Para exercer qualquer dos direitos acima, entre em contato conosco através de:
            </p>
            <div className="bg-purple-50 rounded-lg p-6 space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-2">Razão Social:</p>
                <p className="text-gray-700">46 337 446 STEPHEN DOMINGOS DOMINGOS</p>
                <p className="text-gray-700"><strong>CNPJ:</strong> 46.337.446/0001-07</p>
              </div>
              <div className="flex items-start gap-3 pt-3 border-t border-purple-200">
                <Mail className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-gray-900">E-mail (Canal Prioritário)</p>
                  <p className="text-gray-700">contato@lkdigital.org</p>
                  <p className="text-gray-600 text-sm mt-1">Assunto: "LGPD - [Tipo de Solicitação]"</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-gray-900">WhatsApp</p>
                  <p className="text-gray-700">+55 11 95282-9271</p>
                </div>
              </div>
            </div>
            <p className="text-gray-700 leading-relaxed mt-4">
              <strong>Prazo de resposta:</strong> Responderemos sua solicitação em até <strong>15 dias</strong>, 
              conforme Art. 18, §1º da LGPD. Em casos complexos, podemos prorrogar por mais 15 dias, mediante justificativa.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Medidas de Segurança</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Implementamos medidas técnicas e organizacionais apropriadas para proteger dados pessoais:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <Shield className="w-8 h-8 text-blue-600 mb-2" />
                <p className="font-semibold text-gray-900 mb-1">Segurança Técnica</p>
                <ul className="text-gray-700 text-sm space-y-1">
                  <li>• Criptografia (TLS/SSL)</li>
                  <li>• Autenticação segura</li>
                  <li>• Backups regulares</li>
                  <li>• Monitoramento 24/7</li>
                </ul>
              </div>
              <div className="bg-emerald-50 rounded-lg p-4">
                <Shield className="w-8 h-8 text-emerald-600 mb-2" />
                <p className="font-semibold text-gray-900 mb-1">Segurança Administrativa</p>
                <ul className="text-gray-700 text-sm space-y-1">
                  <li>• Controle de acesso</li>
                  <li>• Treinamento de equipe</li>
                  <li>• Políticas de privacidade</li>
                  <li>• Auditoria regular</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Compartilhamento de Dados</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Compartilhamos dados apenas quando necessário e com terceiros confiáveis:
            </p>
            <div className="space-y-3">
              <div className="border-l-4 border-blue-500 pl-4">
                <p className="font-semibold text-gray-900">Mercado Pago</p>
                <p className="text-gray-700 text-sm">Processamento de pagamentos (nome, e-mail, dados de pagamento)</p>
              </div>
              <div className="border-l-4 border-emerald-500 pl-4">
                <p className="font-semibold text-gray-900">Supabase (PostgreSQL)</p>
                <p className="text-gray-700 text-sm">Armazenamento seguro de dados (infraestrutura em nuvem)</p>
              </div>
              <div className="border-l-4 border-purple-500 pl-4">
                <p className="font-semibold text-gray-900">Meta/WhatsApp</p>
                <p className="text-gray-700 text-sm">Envio de mensagens para pacientes (nome, telefone, conteúdo da mensagem)</p>
              </div>
            </div>
            <p className="text-gray-700 leading-relaxed mt-4">
              <strong>Importante:</strong> Todos os fornecedores são selecionados com base em suas práticas de 
              segurança e conformidade com regulamentações de proteção de dados.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Transferência Internacional de Dados</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Alguns de nossos fornecedores (como Supabase) podem armazenar dados em servidores fora do Brasil. 
              Garantimos que essas transferências estão em conformidade com o Art. 33 da LGPD, através de:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Cláusulas contratuais padrão</li>
              <li>Certificações de segurança internacionais</li>
              <li>Garantias de nível de proteção adequado</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Retenção de Dados</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Mantemos dados pessoais apenas pelo tempo necessário para:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li><strong>Dados de usuários (clínicas):</strong> Durante vigência do contrato + 5 anos (obrigações fiscais)</li>
              <li><strong>Dados de pacientes:</strong> Durante vigência da campanha + período determinado pela clínica</li>
              <li><strong>Logs de sistema:</strong> 6 meses (segurança e diagnóstico)</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-4">
              Após os períodos acima, os dados são eliminados ou anonimizados de forma segura.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Incidentes de Segurança</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Em caso de incidente de segurança que possa trazer risco ou dano relevante aos titulares:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Notificaremos a ANPD (Autoridade Nacional de Proteção de Dados) em prazo razoável</li>
              <li>Comunicaremos os titulares afetados sobre a natureza do incidente</li>
              <li>Informaremos medidas técnicas e de segurança adotadas para proteção</li>
              <li>Indicaremos os riscos relacionados ao incidente</li>
              <li>Detalharemos motivos para eventual demora na notificação</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Responsabilidades da Clínica (Controlador)</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>Importante:</strong> A clínica odontológica atua como <strong>Controladora</strong> dos 
              dados de seus pacientes. Portanto, é responsabilidade da clínica:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Obter consentimento adequado dos pacientes para envio de mensagens</li>
              <li>Respeitar o direito de oposição e cancelamento de mensagens</li>
              <li>Garantir que dados importados foram obtidos legalmente</li>
              <li>Atender solicitações de pacientes sobre seus dados</li>
              <li>Usar o serviço apenas para finalidades legítimas</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-4">
              A <strong>46 337 446 STEPHEN DOMINGOS DOMINGOS</strong> atua como <strong>Operadora</strong>, processando dados sob instruções da clínica. 
              Não somos responsáveis pelo uso indevido do serviço pela clínica.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Alterações a Este Documento</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Podemos atualizar este documento periodicamente para refletir mudanças em nossas práticas ou 
              na legislação. Notificaremos sobre alterações significativas.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Contato e Solicitações</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Para questões relacionadas à LGPD, proteção de dados ou para exercer seus direitos:
            </p>
            <div className="bg-gray-50 rounded-lg p-6 space-y-3">
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-2">Razão Social:</p>
                <p className="text-gray-700">46 337 446 STEPHEN DOMINGOS DOMINGOS</p>
                <p className="text-gray-700"><strong>CNPJ:</strong> 46.337.446/0001-07</p>
              </div>
              <div className="flex items-center gap-3 pt-3 border-t border-gray-200">
                <Mail className="w-5 h-5 text-purple-600" />
                <span className="text-gray-900 font-medium">contato@lkdigital.org</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-purple-600" />
                <span className="text-gray-900 font-medium">+55 11 95282-9271</span>
              </div>
            </div>
            <p className="text-gray-700 leading-relaxed mt-4">
              <strong>Prazo de resposta:</strong> 15 dias úteis
            </p>
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
