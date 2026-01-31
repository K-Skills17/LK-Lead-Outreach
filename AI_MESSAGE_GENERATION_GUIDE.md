# 🤖 AI Message Generation - Complete Guide

## Overview

The AI message generator now uses **ALL** CSV data to create highly personalized messages for each lead.

## 🎯 Available Endpoints

### 1. Generate Message for Specific Lead (Recommended)

**Endpoint:** `POST /api/campaigns/{campaignId}/leads/{leadId}/generate-message`

**Use this when:** You want to generate a message for a specific lead using all their CSV data.

**Request:**
```json
{
  "licenseKey": "YOUR_LICENSE_KEY",
  "prompt": "Optional: Custom instructions for the AI",
  "tone": "professional" // optional: friendly, professional, casual, formal
}
```

**Response:**
```json
{
  "message": "Olá João! Vi que você é CEO da Empresa ABC...",
  "leadInfo": {
    "nome": "João Silva",
    "empresa": "Empresa ABC",
    "cargo": "CEO",
    "site": "https://empresaabc.com.br",
    "dor_especifica": "Necessita aumentar vendas"
  }
}
```

**Example (JavaScript):**
```javascript
const response = await fetch(
  `http://localhost:3000/api/campaigns/${campaignId}/leads/${leadId}/generate-message`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      licenseKey: 'YOUR_LICENSE_KEY',
      tone: 'professional'
    })
  }
);

const { message, leadInfo } = await response.json();
console.log('Generated message:', message);
```

### 2. General AI Generation (with Optional Lead Context)

**Endpoint:** `POST /api/campaigns/{campaignId}/ai-generate`

**Use this when:** You want to generate a template or use lead context optionally.

**Request:**
```json
{
  "licenseKey": "YOUR_LICENSE_KEY",
  "prompt": "Create a cold outreach message",
  "leadId": "optional-lead-uuid", // NEW: If provided, uses lead's CSV data
  "tone": "professional"
}
```

## 📊 How AI Uses CSV Data

### Automatic Personalization

The AI automatically uses all CSV fields:

1. **`nome`** → Personalizes greeting: "Olá {nome}!"
2. **`empresa`** → Shows research: "Vi que você trabalha na {empresa}..."
3. **`cargo`** → Adapts tone:
   - CEO/CTO → Strategic, high-level language
   - Manager → Operational, practical focus
   - Founder → Entrepreneurial, growth-focused
4. **`site`** → Shows research: "Visitei o site {site} e notei..."
5. **`dor_especifica`** → **Main focus**: "Entendo que você precisa {dor_especifica}..."

### Example Output

**Input CSV:**
```csv
nome,empresa,cargo,site,dor_especifica,phone
João Silva,Empresa ABC,CEO,https://empresaabc.com.br,Necessita aumentar vendas,+5511999999999
```

**AI Generated Message:**
```
Olá João! 👋

Vi que você é CEO da Empresa ABC e visitei o site da empresa. 
Notei que vocês estão focados em crescimento e entendo que você 
necessita aumentar vendas.

Tenho uma solução que pode ajudar empresas como a sua a escalar 
vendas de forma estratégica. Gostaria de uma conversa rápida 
para mostrar como podemos resolver essa dor específica?

Posso agendar um Loom audit gratuito para analisar sua operação 
e propor soluções personalizadas.

Aguardo seu retorno! 🚀
```

## 🎨 Tone Options

- **`friendly`** - Amigável e acolhedor
- **`professional`** - Profissional e respeitoso (default)
- **`casual`** - Descontraído e informal
- **`formal`** - Formal e educado

## 💡 Best Practices

1. **Always provide `leadId`** when generating for a specific lead
2. **Use `dor_especifica`** - This is the most important field for personalization
3. **Include `cargo`** - Helps AI adapt language to hierarchy level
4. **Add `site`** - Shows you did research (increases response rate)

## 🔄 Workflow

```
1. Import CSV with all fields
   ↓
2. Get leadId from campaign
   ↓
3. Call generate-message endpoint with leadId
   ↓
4. AI uses ALL CSV data automatically
   ↓
5. Get personalized message
   ↓
6. Save to campaign_contacts.personalized_message
   ↓
7. Send via desktop app
```

## 📝 Placeholder Replacement

The AI automatically replaces these placeholders with real values:
- `{nome}` → Actual lead name
- `{empresa}` → Actual company name
- `{cargo}` → Actual job title
- `{site}` → Actual website
- `{dor_especifica}` → Actual pain point

**Note:** If a field is empty, the placeholder is removed (not replaced with "N/A").

## 🚀 Integration Example

```typescript
// Generate message for a lead
async function generateMessageForLead(
  campaignId: string,
  leadId: string,
  licenseKey: string
) {
  const response = await fetch(
    `http://localhost:3000/api/campaigns/${campaignId}/leads/${leadId}/generate-message`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        licenseKey,
        tone: 'professional',
        prompt: 'Focus on the pain point and offer a Loom audit'
      })
    }
  );

  const data = await response.json();
  return data.message;
}

// Use in your workflow
const message = await generateMessageForLead(
  'campaign-uuid',
  'lead-uuid',
  'your-license-key'
);
console.log(message); // Fully personalized message
```

## ⚠️ Important Notes

- **All fields are optional** except `nome`, `empresa`, and `phone` (for import)
- **AI works best** when all fields are provided
- **`dor_especifica` is key** - This drives the main message focus
- **No tier restrictions** - AI is available for all users (internal tool)
