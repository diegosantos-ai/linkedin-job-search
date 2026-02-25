# 📋 N8N Workflows - Versionamento & Exportação

## Estrutura de Workflows

### Workflow 1: collect-jobs.json
**Descrição:** Coleta vagas do LinkedIn e armazena no Sheets  
**Trigger:** Agenda diária (5pm)  
**Output:** Aba "Vagas" no Google Sheets

**Nodes:**
1. Schedule Trigger (5pm)
2. Download resume (PDF)
3. Extract resume text
4. Get filter criteria (Sheets)
5. Create LinkedIn search URL
6. Fetch jobs from LinkedIn
7. Extract job links
8. Loop & fetch each job
9. Parse job details
10. AI scoring (Gemini)
11. Append to Sheets

---

### Workflow 2: trigger-automation.json (NEW)
**Descrição:** Dispara automação de candidaturas via webhook  
**Trigger:** HTTP POST de script Node.js  
**Payload:**
```json
{
  "jobIds": [123, 456, 789],
  "filters": {
    "minScore": 50,
    "location": "Brasil",
    "workType": "Remoto"
  }
}
```

**Nodes:**
1. Webhook Trigger (POST /apply)
2. Validate payload
3. Get job details from Sheets
4. Call Node.js automation service
5. Wait for results
6. Update Sheets with candidature results
7. Notify user (Telegram/Email)

---

## Como Exportar & Versionar

### 1. Export de n8n

**Via UI:**
```
1. Abra o workflow em n8n
2. Clique em "..." (menu)
3. Select "Download"
4. Arquivo JSON baixa
```

**Via API:**
```bash
curl -X GET "https://your-n8n.com/api/v1/workflows/{workflowId}" \
  -H "X-N8N-API-KEY: your-api-key" \
  -o workflow.json
```

### 2. Estrutura no Git

```
workflows/
├── README.md                      # Este arquivo
├── collect-jobs.v1.0.json         # Job collector
├── trigger-automation.v1.0.json   # Application trigger
├── CHANGELOG.md                   # Version history
└── exports/
    ├── backup-2026-02-04.json    # Automated backup (daily)
    └── backup-2026-02-03.json
```

### 3. Commit Temático

**Primeira vez (novo workflow):**
```bash
git add workflows/trigger-automation.v1.0.json
git commit -m "feat(workflows): add automation trigger workflow"
git push -u origin feature/n8n-automation-trigger
```

**Atualização de workflow:**
```bash
git add workflows/collect-jobs.v1.1.json
git commit -m "refactor(workflows): improve job description parsing"
git push
```

### 4. CHANGELOG.md

```markdown
# n8n Workflows Changelog

## [1.1.0] - 2026-02-10
### Added
- New workflow: trigger-automation.json
- Webhook trigger for automatic applications
- RAG integration for form filling

### Changed
- collect-jobs.v1.1: Better error handling
- Improved LinkedIn job parsing

### Fixed
- Handle missing job company field

---

## [1.0.0] - 2026-02-04
### Added
- Initial collect-jobs.json workflow
- Daily schedule trigger
- AI scoring with Gemini
- Google Sheets integration
```

---

## ⚠️ Cuidados ao Exportar

### ❌ ANTES DE COMMITAR

**Nunca exponha:**
- Credenciais autenticadas
- API keys
- IDs sensíveis

**Verificar:**
```bash
# Scan para secrets
grep -i "password\|api_key\|secret" collect-jobs.json
# Deve voltar vazio!
```

### ✅ COMO SUBSTITUIR SECRETS

**No JSON antes de git add:**
```json
// ❌ ERRADO:
{
  "credentials": {
    "googleSheetsOAuth2Api": {
      "id": "ELRcuhDH6NdgziAg",  // 🔴 Exposado!
      "name": "Google Sheets account"
    }
  }
}

// ✅ CORRETO:
{
  "credentials": {
    "googleSheetsOAuth2Api": {
      "id": "{{ env.GOOGLE_SHEETS_CRED_ID }}",
      "name": "Google Sheets account"
    }
  }
}
```

---

## 🔄 Fluxo Completo de Atualização

### Cenário: Você mudou o workflow collect-jobs.json

```bash
# 1. Teste no n8n UI completamente
#    (Active mode, test execution, etc)

# 2. Crie versão local no seu PC
#    Clique em "..." → "Download" no n8n

# 3. Inspect o JSON (buscar secrets)
cat collect-jobs.json | grep -i "password"  # Deve estar vazio

# 4. Renomeie se mudou major version
mv collect-jobs.json collect-jobs.v1.1.json

# 5. Commit
git checkout -b refactor/job-parsing-improvement
git add workflows/collect-jobs.v1.1.json docs/CHANGELOG.md
git commit -m "refactor(workflows): improve HTML parsing robustness"

# 6. Push
git push -u origin refactor/job-parsing-improvement

# 7. Crie PR no GitHub
#    (Mande link para review)

# 8. Após merge, delete branch
git checkout develop && git pull
git branch -d refactor/job-parsing-improvement
```

---

## 📱 Alternativa: Webhook Automático

Se quiser sincronizar automaticamente n8n → GitHub, use:

**GitHub Action (optional):**
```yaml
name: Backup n8n Workflows

on:
  schedule:
    - cron: '0 0 * * *'  # Daily at midnight

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Fetch workflows from n8n
        run: |
          curl -X GET "https://your-n8n.com/api/v1/workflows" \
            -H "X-N8N-API-KEY: ${{ secrets.N8N_API_KEY }}" \
            -o workflows/backup-$(date +%Y-%m-%d).json
      
      - name: Commit & push
        run: |
          git config user.name "bot"
          git config user.email "bot@example.com"
          git add workflows/
          git commit -m "chore(workflows): auto backup from n8n"
          git push
```

**Mas recomendo:**
- ❌ NÃO use automático para produção
- ✅ SIM para backups
- ✅ SIM faça manual para cada mudança importante

---

## 🚀 Deploy de Novo Workflow

Quando você quer usar workflow atualizado em produção:

```bash
# 1. Tenha aprovação no PR
# 2. Merge em develop
# 3. Em n8n (manual):
#    - Delete workflow antigo
#    - Import JSON novo
#    - Test completamente
#    - Ative (Active = true)

# 4. Monitore logs por 24h
# 5. Se OK, merge develop → main
```

---

## 📞 Troubleshooting

**"Workflow não inicia após import"**
```bash
# Verifique:
# 1. Todas as credenciais estão configuradas
# 2. Nodes têm IDs únicos
# 3. Connections estão válidas
# 4. Revise logs do n8n
```

**"Arquivo JSON muito grande"**
```bash
# Comprima:
gzip collect-jobs.json
# Descomprima:
gunzip collect-jobs.json.gz
```

**"Conflito de merge no workflow"**
```bash
# Evite: múltiplas pessoas editando ao mesmo tempo
# Padrão: 1 pessoa por workflow por vez
# Comunique no chat se vai mexer
```
