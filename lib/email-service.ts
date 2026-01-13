import { Resend } from 'resend';

// Initialize Resend with API key from environment
const resend = new Resend(process.env.RESEND_API_KEY);

// Email configuration
const FROM_EMAIL = 'LK Reactor Pro <contato@lkdigital.org>';
const REPLY_TO = 'contato@lkdigital.org';
const DOWNLOAD_URL = 'https://seu-dominio.com/download/LK-Reactor-Setup.exe'; // TODO: Update with real URL

/**
 * Send welcome email with FREE license key (14-day trial)
 */
export async function sendFreeLicenseEmail(data: {
  name: string;
  email: string;
  clinicName: string;
  licenseKey: string;
  whatsapp: string;
}) {
  try {
    console.log(`📧 Sending FREE license email to: ${data.email}`);

    const { data: emailData, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [data.email],
      replyTo: REPLY_TO,
      subject: '🎉 Seu Acesso GRATUITO ao LK Reactor Pro está Ativo!',
      html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 30px 20px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0 0 10px 0; font-size: 28px; }
    .header p { margin: 5px 0; font-size: 16px; }
    .license-box { background: #f3f4f6; border: 3px dashed #3b82f6; border-radius: 8px; padding: 25px; margin: 30px 0; text-align: center; }
    .license-label { font-size: 14px; color: #6b7280; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px; }
    .license-key { font-size: 28px; font-weight: bold; color: #1e40af; letter-spacing: 3px; font-family: 'Courier New', monospace; margin: 15px 0; word-break: break-all; }
    .license-note { font-size: 13px; color: #6b7280; margin-top: 10px; }
    .button { display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white !important; padding: 15px 40px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; margin: 15px 0; }
    .section { margin: 30px 0; padding: 25px; background: #f9fafb; border-radius: 8px; border-left: 4px solid #3b82f6; }
    .section h3 { margin-top: 0; color: #1e40af; font-size: 20px; }
    .steps { list-style: none; padding: 0; counter-reset: step-counter; }
    .steps li { counter-increment: step-counter; padding: 15px 0; position: relative; padding-left: 50px; }
    .steps li::before { content: counter(step-counter); position: absolute; left: 0; top: 15px; background: #3b82f6; color: white; width: 35px; height: 35px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; }
    .feature { padding: 10px 0; padding-left: 25px; position: relative; }
    .feature::before { content: "✅"; position: absolute; left: 0; }
    .highlight-box { background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .highlight-box h3 { margin-top: 0; color: #92400e; }
    .footer { text-align: center; padding: 30px 20px; color: #6b7280; font-size: 14px; border-top: 2px solid #e5e7eb; margin-top: 40px; }
    .footer a { color: #3b82f6; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Bem-vindo ao LK Reactor Pro!</h1>
      <p>Olá <strong>${data.name}</strong>,</p>
      <p>Seu teste de <strong>14 DIAS GRÁTIS</strong> foi ativado com sucesso!</p>
    </div>

    <div class="license-box">
      <div class="license-label">🔑 Sua Chave de Licença</div>
      <div class="license-key">${data.licenseKey}</div>
      <div class="license-note">⚠️ Guarde esta chave em local seguro! Você precisará dela para ativar o aplicativo.</div>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${DOWNLOAD_URL}" class="button">📥 BAIXAR APLICATIVO AGORA</a>
    </div>

    <div class="section">
      <h3>📖 Como Ativar em 3 Passos Simples</h3>
      <ol class="steps">
        <li><strong>Baixe</strong> o LK Reactor Pro clicando no botão azul acima</li>
        <li><strong>Instale</strong> o aplicativo no seu computador Windows</li>
        <li><strong>Cole</strong> sua chave de licença quando o app solicitar</li>
      </ol>
      <p style="margin-top: 20px; padding: 15px; background: #eff6ff; border-radius: 6px; border-left: 4px solid #3b82f6;">
        💡 <strong>Dica:</strong> O processo leva menos de 3 minutos e você já pode começar a reativar pacientes!
      </p>
    </div>

    <div class="section">
      <h3>✨ O Que Você Pode Fazer AGORA</h3>
      <div class="feature">Reativar até 10 pacientes por dia</div>
      <div class="feature">Criar campanhas personalizadas de reativação</div>
      <div class="feature">Importar sua base de pacientes via CSV</div>
      <div class="feature">Ver resultados em tempo real no painel</div>
      <div class="feature">Testar TODAS as funcionalidades PREMIUM por 14 dias!</div>
    </div>

    <div class="highlight-box">
      <h3>🚀 Quer Reativar MAIS Pacientes?</h3>
      <p>Após o período de teste gratuito, você pode escolher um plano pago:</p>
      <ul style="margin: 15px 0;">
        <li><strong>PRO:</strong> Até 500 pacientes/dia + IA para criar mensagens + R$ 197/mês</li>
        <li><strong>PREMIUM:</strong> Pacientes ILIMITADOS + IA Avançada + R$ 497/mês</li>
      </ul>
      <p style="margin-top: 15px;">
        <a href="https://seu-dominio.com/precos" style="color: #f59e0b; font-weight: bold; text-decoration: underline;">
          Ver Todos os Planos e Preços →
        </a>
      </p>
    </div>

    <div style="text-align: center; padding: 30px 20px; background: #f9fafb; border-radius: 8px;">
      <h3 style="margin-top: 0;">💬 Precisa de Ajuda?</h3>
      <p style="margin: 15px 0;">Nossa equipe está pronta para ajudar você!</p>
      <p>
        <a href="https://wa.me/5511952829271" style="color: #25d366; font-weight: bold; text-decoration: none; font-size: 16px;">
          📱 WhatsApp: +55 11 95282-9271
        </a>
      </p>
      <p>
        <a href="mailto:contato@lkdigital.org" style="color: #3b82f6; text-decoration: none;">
          📧 contato@lkdigital.org
        </a>
      </p>
    </div>

    <div class="footer">
      <p><strong>Dados da sua conta:</strong></p>
      <p>Clínica: ${data.clinicName}<br>
      Email: ${data.email}<br>
      WhatsApp: ${data.whatsapp}</p>
      <p style="margin-top: 20px;">© 2026 LK Reactor Pro by LK Digital<br>
      Todos os direitos reservados</p>
    </div>
  </div>
</body>
</html>
      `,
    });

    if (error) {
      console.error('❌ Resend error:', error);
      throw error;
    }

    console.log(`✅ FREE license email sent successfully! Email ID: ${emailData?.id}`);
    return { success: true, emailId: emailData?.id };
    
  } catch (error) {
    console.error('❌ Error sending FREE license email:', error);
    throw error;
  }
}

/**
 * Send activation email with PAID license key (PRO/PREMIUM)
 */
export async function sendPaidLicenseEmail(data: {
  name: string;
  email: string;
  clinicName: string;
  licenseKey: string;
  tier: 'PRO' | 'PREMIUM';
  amount: number;
  billingCycle: string;
  paymentId: string;
}) {
  try {
    console.log(`📧 Sending ${data.tier} license email to: ${data.email}`);

    const tierName = data.tier === 'PRO' ? 'Professional' : 'Premium';
    const cycleName = data.billingCycle === 'monthly' ? 'Mensal' : 'Anual';
    const savings = data.billingCycle === 'yearly' 
      ? (data.tier === 'PRO' ? 236 : 2174)
      : 0;

    const tierColor = data.tier === 'PRO' ? '#3b82f6' : '#8b5cf6';
    const tierGradient = data.tier === 'PRO' 
      ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
      : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)';

    const { data: emailData, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [data.email],
      replyTo: REPLY_TO,
      subject: `✅ Pagamento Confirmado - LK Reactor Pro ${tierName}!`,
      html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 30px 20px; background: ${tierGradient}; color: white; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0 0 10px 0; font-size: 28px; }
    .header .checkmark { font-size: 60px; margin-bottom: 10px; }
    .header p { margin: 5px 0; font-size: 16px; }
    .license-box { background: #f3f4f6; border: 3px solid ${tierColor}; border-radius: 8px; padding: 25px; margin: 30px 0; text-align: center; }
    .license-label { font-size: 14px; color: #6b7280; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px; }
    .license-key { font-size: 28px; font-weight: bold; color: ${tierColor}; letter-spacing: 3px; font-family: 'Courier New', monospace; margin: 15px 0; word-break: break-all; }
    .license-note { font-size: 13px; color: #6b7280; margin-top: 10px; }
    .button { display: inline-block; background: ${tierGradient}; color: white !important; padding: 15px 40px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; margin: 15px 0; }
    .invoice { background: white; border: 2px solid #e5e7eb; border-radius: 8px; padding: 25px; margin: 25px 0; }
    .invoice h3 { margin-top: 0; color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
    .invoice-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f3f4f6; }
    .invoice-row:last-child { border-bottom: none; }
    .invoice-total { font-size: 24px; font-weight: bold; color: #10b981; margin-top: 15px; padding-top: 15px; border-top: 2px solid #e5e7eb; }
    .section { margin: 30px 0; padding: 25px; background: #f9fafb; border-radius: 8px; border-left: 4px solid ${tierColor}; }
    .section h3 { margin-top: 0; color: ${tierColor}; font-size: 20px; }
    .steps { list-style: none; padding: 0; counter-reset: step-counter; }
    .steps li { counter-increment: step-counter; padding: 15px 0; position: relative; padding-left: 50px; }
    .steps li::before { content: counter(step-counter); position: absolute; left: 0; top: 15px; background: ${tierColor}; color: white; width: 35px; height: 35px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; }
    .feature { padding: 10px 0; padding-left: 25px; position: relative; }
    .feature::before { content: "✅"; position: absolute; left: 0; }
    .footer { text-align: center; padding: 30px 20px; color: #6b7280; font-size: 14px; border-top: 2px solid #e5e7eb; margin-top: 40px; }
    .footer a { color: ${tierColor}; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="checkmark">✅</div>
      <h1>Pagamento Confirmado!</h1>
      <p>Olá <strong>${data.name}</strong>,</p>
      <p>Bem-vindo ao Plano <strong>${tierName}</strong>! 🎉</p>
    </div>

    <div class="license-box">
      <div class="license-label">🔑 Sua Chave de Licença ${tierName.toUpperCase()}</div>
      <div class="license-key">${data.licenseKey}</div>
      <div class="license-note">⚠️ Guarde esta chave em local seguro! Você precisará dela para ativar o aplicativo.</div>
    </div>

    <div class="invoice">
      <h3>📋 Detalhes do Pedido</h3>
      <div class="invoice-row">
        <span><strong>Plano:</strong></span>
        <strong style="color: ${tierColor};">${tierName}</strong>
      </div>
      <div class="invoice-row">
        <span><strong>Ciclo de Cobrança:</strong></span>
        <strong>${cycleName}</strong>
      </div>
      ${savings > 0 ? `
      <div class="invoice-row" style="color: #10b981;">
        <span><strong>Economia Anual:</strong></span>
        <strong>R$ ${savings.toFixed(2)}</strong>
      </div>
      ` : ''}
      <div class="invoice-total">
        <div style="display: flex; justify-content: space-between;">
          <span>Total Pago:</span>
          <span>R$ ${data.amount.toFixed(2)}</span>
        </div>
      </div>
      <div style="text-align: center; margin-top: 20px;">
        <a href="https://www.mercadopago.com.br/activities/${data.paymentId}" style="color: ${tierColor}; font-weight: bold; text-decoration: underline;">
          🧾 Ver Comprovante de Pagamento →
        </a>
      </div>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${DOWNLOAD_URL}" class="button">📥 BAIXAR APLICATIVO AGORA</a>
    </div>

    <div class="section">
      <h3>📖 Como Ativar em 3 Passos Simples</h3>
      <ol class="steps">
        <li><strong>Baixe</strong> o LK Reactor Pro clicando no botão acima</li>
        <li><strong>Instale</strong> o aplicativo no seu computador Windows</li>
        <li><strong>Cole</strong> sua chave de licença quando o app solicitar</li>
      </ol>
      <p style="margin-top: 20px; padding: 15px; background: white; border-radius: 6px; border-left: 4px solid ${tierColor};">
        💡 <strong>Dica:</strong> Aproveite todas as funcionalidades ${tierName} agora mesmo!
      </p>
    </div>

    <div class="section">
      <h3>✨ O Que Você Tem Agora (Plano ${tierName})</h3>
      ${data.tier === 'PRO' ? `
        <div class="feature">Reative até 500 pacientes por dia</div>
        <div class="feature">IA cria mensagens profissionais automaticamente</div>
        <div class="feature">Campanhas personalizadas ilimitadas</div>
        <div class="feature">Painel de resultados em tempo real</div>
        <div class="feature">Importação de base via CSV</div>
        <div class="feature">Suporte prioritário via WhatsApp</div>
      ` : `
        <div class="feature">Reativação ILIMITADA de pacientes por dia</div>
        <div class="feature">IA avançada com 3 versões de mensagens (A/B/C)</div>
        <div class="feature">7 tipos de campanha prontos para usar</div>
        <div class="feature">Testes A/B/C automáticos</div>
        <div class="feature">Personalização avançada de tom de voz</div>
        <div class="feature">Suporte VIP prioritário 24/7</div>
      `}
    </div>

    <div style="text-align: center; padding: 30px 20px; background: #eff6ff; border-radius: 8px; border: 2px solid ${tierColor};">
      <h3 style="margin-top: 0; color: ${tierColor};">💬 Suporte Prioritário ${tierName}</h3>
      <p style="margin: 15px 0;">Como cliente ${tierName}, você tem acesso ao nosso suporte exclusivo:</p>
      <p style="margin: 20px 0;">
        <a href="https://wa.me/5511952829271" style="color: #25d366; font-weight: bold; text-decoration: none; font-size: 18px;">
          📱 WhatsApp: +55 11 95282-9271
        </a>
      </p>
      <p>
        <a href="mailto:contato@lkdigital.org" style="color: ${tierColor}; text-decoration: none; font-weight: bold;">
          📧 contato@lkdigital.org
        </a>
      </p>
    </div>

    <div class="footer">
      <p><strong>Dados da sua conta:</strong></p>
      <p>Clínica: ${data.clinicName}<br>
      Email: ${data.email}<br>
      Plano: ${tierName} (${cycleName})</p>
      <p style="margin-top: 15px; font-size: 12px; color: #9ca3af;">
        ID do Pagamento: ${data.paymentId}
      </p>
      <p style="margin-top: 20px;">© 2026 LK Reactor Pro by LK Digital<br>
      Todos os direitos reservados</p>
    </div>
  </div>
</body>
</html>
      `,
    });

    if (error) {
      console.error('❌ Resend error:', error);
      throw error;
    }

    console.log(`✅ ${data.tier} license email sent successfully! Email ID: ${emailData?.id}`);
    return { success: true, emailId: emailData?.id };
    
  } catch (error) {
    console.error(`❌ Error sending ${data.tier} license email:`, error);
    throw error;
  }
}
