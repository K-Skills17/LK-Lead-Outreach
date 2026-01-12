# 🔗 Mercado Pago - URLs de Configuração

## 📋 Planos Atuais

Você tem **3 planos**:
1. **FREE** ($0) - Sem pagamento, vai direto para `/setup`
2. **PROFESSIONAL** ($197/mês) - Requer link de pagamento
3. **PREMIUM** ($497/mês) - Requer link de pagamento

---

## 🎯 URLs para Configurar no Mercado Pago

### PROFESSIONAL ($197/mês)

Ao criar o link de pagamento no Mercado Pago, configure:

#### ✅ URL de Sucesso (Success URL)
```
https://seudominio.com/obrigado-pro
```
**Quando usar**: Pagamento aprovado com sucesso

#### ⏳ URL de Pendente (Pending URL)
```
https://seudominio.com/pagamento-pendente
```
**Quando usar**: Pagamento em análise (PIX, boleto, etc)

#### ❌ URL de Falha (Failure URL)
```
https://seudominio.com/pagamento-falhou
```
**Quando usar**: Pagamento recusado ou com erro

---

### PREMIUM ($497/mês)

Ao criar o link de pagamento no Mercado Pago, configure:

#### ✅ URL de Sucesso (Success URL)
```
https://seudominio.com/obrigado-pro
```
**Quando usar**: Pagamento aprovado com sucesso

#### ⏳ URL de Pendente (Pending URL)
```
https://seudominio.com/pagamento-pendente
```
**Quando usar**: Pagamento em análise (PIX, boleto, etc)

#### ❌ URL de Falha (Failure URL)
```
https://seudominio.com/pagamento-falhou
```
**Quando usar**: Pagamento recusado ou com erro

---

## 📝 Importante!

### ⚠️ Substitua "seudominio.com"

**Para Desenvolvimento:**
```
http://localhost:3000/obrigado-pro
http://localhost:3000/pagamento-pendente
http://localhost:3000/pagamento-falhou
```

**Para Produção (após deploy):**
```
https://seudominio.com/obrigado-pro
https://seudominio.com/pagamento-pendente
https://seudominio.com/pagamento-falhou
```

Exemplos de domínios:
- `https://lkreactorpro.com/obrigado-pro`
- `https://seu-app.vercel.app/obrigado-pro`
- `https://reativar.com.br/obrigado-pro`

---

## 🛠️ Como Criar os Links no Mercado Pago

### Passo 1: Acesse o Mercado Pago
1. Entre em: https://www.mercadopago.com.br
2. Vá em **Vendas** → **Links de Pagamento**
3. Clique em **Criar link**

### Passo 2: Configure o PROFESSIONAL ($197)
1. **Título**: LK Reactor Pro - Professional
2. **Descrição**: Plano Professional - Reativação de Pacientes
3. **Valor**: R$ 197,00
4. **Tipo**: Recorrente (Mensal) OU Único (Pagamento Único)
5. **URLs de Redirecionamento**:
   - ✅ Sucesso: `https://seudominio.com/obrigado-pro`
   - ⏳ Pendente: `https://seudominio.com/pagamento-pendente`
   - ❌ Falha: `https://seudominio.com/pagamento-falhou`

### Passo 3: Configure o PREMIUM ($497)
1. **Título**: LK Reactor Pro - Premium
2. **Descrição**: Plano Premium com IA - Máxima Conversão
3. **Valor**: R$ 497,00
4. **Tipo**: Recorrente (Mensal) OU Único (Pagamento Único)
5. **URLs de Redirecionamento**:
   - ✅ Sucesso: `https://seudominio.com/obrigado-pro`
   - ⏳ Pendente: `https://seudominio.com/pagamento-pendente`
   - ❌ Falha: `https://seudominio.com/pagamento-falhou`

### Passo 4: Copie os Links
Após criar, o Mercado Pago vai gerar links como:
- Professional: `https://mpago.la/1234567` ou `https://mpago.la/2abc456`
- Premium: `https://mpago.la/7890abc` ou `https://mpago.la/9xyz012`

---

## 🔐 Atualizar Environment Variables

Depois de criar os links, adicione no `.env.local`:

```bash
# Professional ($197)
NEXT_PUBLIC_PRO_PAYMENT_URL=https://mpago.la/SEU_LINK_PRO

# Premium ($497)
NEXT_PUBLIC_PREMIUM_PAYMENT_URL=https://mpago.la/SEU_LINK_PREMIUM
```

**⚠️ Importante**: Após atualizar `.env.local`, reinicie o servidor:
```bash
# Pare o servidor (Ctrl + C)
npm run dev  # Inicie novamente
```

---

## ✅ Páginas de Status Já Criadas

### `/obrigado-pro` ✅
**Conteúdo**:
- Mensagem de agradecimento
- "Sua assinatura está ativa!"
- Botão para baixar o app
- Instruções de instalação

### `/pagamento-pendente` ✅
**Conteúdo**:
- "Pagamento em análise"
- Explicação do que está acontecendo
- "Você receberá um email"
- Instruções para aguardar

### `/pagamento-falhou` ✅
**Conteúdo**:
- "Pagamento não aprovado"
- Possíveis motivos do erro
- Botão "Tentar Novamente"
- Link para suporte via WhatsApp

---

## 🧪 Como Testar

### Teste em Desenvolvimento (Localhost)
1. Use credenciais de **TESTE** do Mercado Pago
2. Configure URLs como `http://localhost:3000/...`
3. Use cartões de teste:
   - **Aprovado**: `5031 4332 1540 6351` (CVV: 123, Validade: qualquer futura)
   - **Recusado**: `5031 4332 1540 6351` (CVV: 123, Validade: qualquer futura, mas digite CPF errado)
   - **Pendente**: Escolha PIX ou Boleto

### Teste em Produção
1. Use credenciais de **PRODUÇÃO** do Mercado Pago
2. Configure URLs com seu domínio real
3. Faça um pagamento real (valor pequeno para teste)
4. Verifique se redireciona corretamente

---

## 🚨 Problemas Comuns

### ❌ "Redirect não funciona"
- **Causa**: URLs incorretas no Mercado Pago
- **Solução**: Verifique se colocou `https://` (não `http://` em produção)
- **Solução**: Certifique-se de que o domínio está correto

### ❌ "Pagamento aprovado mas não redireciona"
- **Causa**: Mercado Pago não consegue acessar a URL
- **Solução**: Verifique se o site está no ar
- **Solução**: Teste as URLs manualmente no navegador

### ❌ "Botão de pagamento não funciona"
- **Causa**: Environment variables não configuradas
- **Solução**: Verifique se `NEXT_PUBLIC_PRO_PAYMENT_URL` está no `.env.local`
- **Solução**: Reinicie o servidor

---

## 📊 Fluxo Completo do Usuário

```
1. Usuário visita: /precos
   ↓
2. Clica: "Ativar Professional" ou "Ativar Premium"
   ↓
3. Redireciona para: Mercado Pago (link que você criou)
   ↓
4. Usuário preenche dados e paga
   ↓
5a. ✅ APROVADO → /obrigado-pro
5b. ⏳ PENDENTE → /pagamento-pendente
5c. ❌ RECUSADO → /pagamento-falhou
   ↓
6. Usuário recebe email com licença (se aprovado)
   ↓
7. Baixa o app em: /setup
```

---

## 🎯 Checklist Final

### Antes de Lançar
- [ ] Criar link de pagamento Professional no Mercado Pago
- [ ] Criar link de pagamento Premium no Mercado Pago
- [ ] Configurar URLs de sucesso/pendente/falha em ambos
- [ ] Copiar links e adicionar em `.env.local`
- [ ] Testar pagamento em modo TESTE
- [ ] Trocar para credenciais de PRODUÇÃO
- [ ] Fazer pagamento real de teste
- [ ] Verificar se redireciona corretamente
- [ ] Verificar se email é enviado (se configurado)

### Depois de Lançar
- [ ] Monitorar primeiros pagamentos
- [ ] Verificar taxa de conversão
- [ ] Ajustar copy se necessário
- [ ] Adicionar mais métodos de pagamento (se desejado)

---

## 📞 Suporte Mercado Pago

Se tiver problemas:
- **Central de Ajuda**: https://www.mercadopago.com.br/ajuda
- **Documentação**: https://www.mercadopago.com.br/developers
- **Suporte**: Via chat no dashboard do Mercado Pago

---

## ✅ Resumo Rápido

**Para PROFESSIONAL ($197)**:
- Sucesso: `https://seudominio.com/obrigado-pro`
- Pendente: `https://seudominio.com/pagamento-pendente`
- Falha: `https://seudominio.com/pagamento-falhou`

**Para PREMIUM ($497)**:
- Sucesso: `https://seudominio.com/obrigado-pro`
- Pendente: `https://seudominio.com/pagamento-pendente`
- Falha: `https://seudominio.com/pagamento-falhou`

**Depois de criar os links, adicione em `.env.local`:**
```bash
NEXT_PUBLIC_PRO_PAYMENT_URL=https://mpago.la/SEU_LINK_PRO
NEXT_PUBLIC_PREMIUM_PAYMENT_URL=https://mpago.la/SEU_LINK_PREMIUM
```

---

**Pronto! Após configurar isso, você está 100% pronto para o lançamento! 🚀**
