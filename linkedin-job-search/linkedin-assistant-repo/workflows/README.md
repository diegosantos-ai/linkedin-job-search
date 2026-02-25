# 📋 n8n Workflows

Este diretório contém os workflows do n8n exportados em formato JSON para versionamento no Git.

## 📂 Arquivos

### Workflows Principais

- **`collect-jobs.v1.0.json`** (27 nodes, ✅ Production)
  - Coleta vagas do LinkedIn diariamente
  - Extrai e processa informações de vagas
  - Compara com resume via IA (Gemini)
  - Armazena resultados em Google Sheets
  - Envia notificações Telegram

- **`trigger-automation.json`** (🚧 Development)
  - Webhook para automação de candidaturas
  - Processa fila de vagas para aplicação
  - Retorna status em JSON

### Arquivos de Suporte

- **`CHANGELOG.md`** - Histórico de versões
- **`exports/backup-*.json`** - Backups automáticos diários

---

## 🔄 Como Usar

### Importar Workflow no n8n

1. Abra n8n UI
2. **Workflows** → **Import from File**
3. Selecione o arquivo JSON desejado
4. Clique em **Import**
5. Configure credenciais (Google, Telegram, etc)

### Exportar Workflow para Git

1. Faça mudanças no n8n UI
2. Clique em **...** → **Download**
3. Salve como `workflows/nome.vX.Y.json`
4. Commit no Git:
   ```bash
   git add workflows/nome.vX.Y.json
   git commit -m "refactor(workflows): improve job parsing"
   ```

---

## 🔐 Segurança

### ⚠️ ANTES DE COMMITAR

**NUNCA exponha:**
- Credential IDs
- API Keys
- Tokens de autenticação

**Verificar:**
```bash
grep -i "password\|api_key\|secret\|token" *.json
# Deve retornar vazio
```

### ✅ Como Fazer

Substitua IDs antes de commitar:
```json
// ❌ ERRADO (exposto)
"credentials": {
  "googleSheetsOAuth2Api": {
    "id": "ELRcuhDH6NdgziAg"
  }
}

// ✅ CORRETO (masked)
"credentials": {
  "googleSheetsOAuth2Api": {
    "id": "{{ env.GOOGLE_SHEETS_CRED_ID }}"
  }
}
```

---

## 📊 Estrutura dos Workflows

### collect-jobs.v1.0.json

```
Schedule Trigger (5pm)
    ↓
Download Resume (PDF)
    ↓
Extract Text
    ↓
Get Filters (Sheets)
    ↓
Create Search URL
    ↓
Fetch LinkedIn
    ↓
Extract Links
    ↓
Loop → Fetch Job Page
    ↓
Parse HTML
    ↓
AI Scoring (Gemini)
    ↓
Parse AI Output
    ↓
Score Filter (>= 50)
    ↓
Append to Sheets + Telegram
```

---

## 🚀 Deployment

### Local/Dev

1. Importe workflow
2. Configure credenciais
3. Clique em "Test"
4. Aguarde execução
5. Verifique logs

### Staging

1. Mesmo workflow, diferentes credenciais
2. Use Sheets de teste
3. Monitor por 1 semana
4. Ajuste conforme necessário

### Production

1. Backup workflow atual
2. Deploy versão nova
3. Monitor durante 24h
4. Se OK, marque como "Active"
5. Mantenha backup por 30 dias

---

## 📈 Versionamento

- **Major (v1.0.0):** Quebra compatibilidade
- **Minor (v1.1.0):** Nova feature, compatível
- **Patch (v1.0.1):** Bug fix

### Quando Atualizar Versão?

- **v1.0.1:** Corrigir parsing quebrado
- **v1.1.0:** Adicionar novo node (e.g., RAG)
- **v2.0.0:** Redesenhar fluxo completamente

---

## 🧪 Testes

### Checklist Antes de Commitar

- [ ] Workflow testado em dev
- [ ] Nenhuma credencial exposta
- [ ] Nodes renomeados claramente
- [ ] Comentários adicionados se necessário
- [ ] CHANGELOG.md atualizado
- [ ] PR tem descrição clara

### Checklist Antes de Deploy

- [ ] Code review aprovado
- [ ] CI/CD passou (lint, tests)
- [ ] Testado em staging
- [ ] Backup do workflow atual
- [ ] Logs monitorados após deploy

---

## 🐛 Troubleshooting

### Workflow não começa

```
1. Verificar se "Active" está ligado
2. Verificar trigger (Schedule, Webhook, Manual)
3. Checar credenciais configuradas
4. Ver logs de erro no n8n UI
5. Exportar e importar novamente
```

### Erros de parsing

```
1. LinkedIn pode ter mudado HTML
2. Atualize seletores em selectors.json
3. Teste com "Test" antes de ativar
4. Se mudar, crie versão nova (v1.1.0)
```

### Credenciais expiradas

```
1. Regenere credenciais no Google Cloud / Telegram
2. Reconfigure em n8n UI
3. Teste workflow
4. Se OK, deploy
```

---

## 📞 Suporte

Problema com workflow?

1. Verificar [CHANGELOG.md](./CHANGELOG.md)
2. Verificar logs em n8n UI
3. Comparar com versão anterior no GitHub
4. Abrir issue se necessário

---

## 📚 Referências

- [n8n Documentation](https://docs.n8n.io)
- [n8n API Reference](https://docs.n8n.io/api/)
- [Workflow Best Practices](https://docs.n8n.io/workflows/overview/)
