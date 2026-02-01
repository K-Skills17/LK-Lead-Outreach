# 🚀 Como Executar Scripts PowerShell

## ⚠️ Problema Comum

Quando o caminho tem espaços (como `C:\dev\LK Lead Outreach\LK-Lead-Outreach`), o PowerShell pode ter problemas.

## ✅ Soluções

### **Opção 1: Navegar para o diretório primeiro** (Recomendado)

```powershell
# 1. Navegar para o diretório do projeto
cd "C:\dev\LK Lead Outreach\LK-Lead-Outreach"

# 2. Executar o script
& .\test-advanced-features.ps1
```

### **Opção 2: Usar caminho completo com aspas**

```powershell
& "C:\dev\LK Lead Outreach\LK-Lead-Outreach\test-advanced-features.ps1"
```

### **Opção 3: Usar o script helper run.ps1**

```powershell
cd "C:\dev\LK Lead Outreach\LK-Lead-Outreach"
& .\run.ps1 test-advanced-features
```

### **Opção 4: Executar direto com &**

```powershell
cd "C:\dev\LK Lead Outreach\LK-Lead-Outreach"
& .\test-advanced-features.ps1
```

---

## 🔧 Scripts Disponíveis

### Testar Features Avançadas
```powershell
cd "C:\dev\LK Lead Outreach\LK-Lead-Outreach"
& .\test-advanced-features.ps1
```

### Criar Conta SDR
```powershell
cd "C:\dev\LK Lead Outreach\LK-Lead-Outreach"
& .\create-sdr.ps1 -Email "sdr@example.com" -Password "Pass123!" -Name "SDR Name"
```

### Testar Conexão
```powershell
cd "C:\dev\LK Lead Outreach\LK-Lead-Outreach"
& .\test-connection-simple.ps1
```

---

## ❌ Erros Comuns

### "Não é reconhecido como nome de cmdlet"

**Causa:** Caminho com espaços não foi tratado corretamente

**Solução:**
```powershell
# ❌ ERRADO
.\test-advanced-features.ps1

# ✅ CORRETO
cd "C:\dev\LK Lead Outreach\LK-Lead-Outreach"
& .\test-advanced-features.ps1
```

### "Erro 400 - Solicitação Incorreta"

**Causa:** 
- Servidor não está rodando
- Token inválido
- Dados de teste inválidos (UUIDs fake)

**Solução:**
1. Verifique se o servidor está rodando:
   ```powershell
   npm run dev
   ```
2. Verifique o token no `.env.local`
3. Os UUIDs de teste são fake - use UUIDs reais do banco para testes completos

---

## 💡 Dica Rápida

Crie um alias no PowerShell para facilitar:

```powershell
# Adicionar ao perfil do PowerShell
Set-Alias -Name lk -Value "C:\dev\LK Lead Outreach\LK-Lead-Outreach"

# Depois use:
cd lk
& .\test-advanced-features.ps1
```

---

## ✅ Verificação Rápida

```powershell
# Verificar se está no diretório correto
pwd

# Verificar se o arquivo existe
Test-Path "test-advanced-features.ps1"

# Listar scripts disponíveis
Get-ChildItem -Filter "*.ps1" | Select-Object Name
```
