# 🎯 TASK.md - LinkedIn Assistant: Automação de Candidaturas

> **Projeto:** LinkedIn Job Search → LinkedIn Assistant  
> **Objetivo:** Transformar coletor de vagas em assistente inteligente que se candida automaticamente  
> **Status:** Phase 1 (ANALYSIS)  
> **Last Updated:** 2026-02-04

---

## 📋 Scope & Vision

### O Que É
Um sistema de automação de candidaturas em vagas do LinkedIn que:
- ✅ Coleta vagas via n8n → Google Sheets
- 🎯 **NOVO:** Acessa links das vagas, preenche formulários e se candida automaticamente
- 📊 Registra todas as candidaturas em aba dedicada no Sheets
- 🔄 Fornece relatórios de sucesso/falha com logs

### O Que NÃO É
- ❌ Scraper puro de dados
- ❌ Violador de ToS do LinkedIn
- ❌ Sistema sem tratamento de erros

---

## 🔄 Methodology: 4-Phase Development

### Phase 1: ANALYSIS ✅ [IN PROGRESS]
**Goal:** Entender landscapes, restrições, e oportunidades  
**Duration:** ~2 dias  
**Deliverables:**
- [x] Documentação de estratégia autenticação LinkedIn → [ANALYSIS.md](docs/ANALYSIS.md)
- [x] Mapeamento de fluxo RPA → [ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [x] Análise de segurança → [SECURITY.md](docs/SECURITY.md)
- [x] Documento de riscos & compliance → [ANALYSIS.md](docs/ANALYSIS.md)
- [x] Estrutura do projeto definida → [PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md)
- [x] Versionamento n8n estratégia → [N8N_WORKFLOWS.md](docs/N8N_WORKFLOWS.md)

**Decisões Confirmadas:**
1. **Autenticação:** Playwright (headless browser RPA) - mais seguro que credenciais diretas
2. **Candidatura:** Preenchimento automático + RAG com respostas frequentes + fallback manual para revisar
3. **Filtros:** Remoto, Brasil, Engenharia de Dados (aplicar antes de automação)
4. **Campos importantes:** Título, Empresa, Localização, Link, Score, Tentativas, Logs, Status
5. **Arquitetura:** n8n orquestrador + Node.js/TypeScript scripts + CI/CD com testes (GitHub Actions)
6. **Versionamento n8n:** Snapshots em Git + versionamento nativo no n8n (manual export antes de mudanças)
7. **RAG Database:** Base de respostas frequentes com similarity matching (cosine distance)

---

### Phase 2: PLANNING
**Goal:** Arquitetura detalhada e quebra de tarefas  
**Deliverables:**
- [ ] Arquitetura do sistema (diagrama)
- [ ] Schema do banco de dados (Sheets + logs internos)
- [ ] Especificação de fluxos (sucesso, falha, retry)
- [ ] Plano de branches Git & workflow
- [ ] Documento de dependências

---

### Phase 3: SOLUTIONING
**Goal:** Design de solução sem código  
**Deliverables:**
- [ ] Wireflows de candidatura (form detection, preenchimento)
- [ ] Strategy de error handling
- [ ] Plano de security (credenciais, tokens)
- [ ] Design pattern diagrams

---

### Phase 4: IMPLEMENTATION
**Goal:** Código, testes, deploy  
**Deliverables:**
- [ ] Node.js/Python scripts para automação
- [ ] Integração n8n ↔ scripts
- [ ] Testes unitários & E2E (Playwright)
- [ ] CI/CD pipeline
- [ ] Documentação final + deployment

---

## 🛠️ Tech Stack (Proposed)

| Layer | Tech | Reason |
|-------|------|--------|
| **Orchestration** | n8n | Já usando; low-code |
| **RPA/Automation** | Playwright + Node.js | Headless, confiável, testável |
| **Data** | Google Sheets API | Já integrado |
| **Secrets** | dotenv + GitHub Secrets | Seguro, simples |
| **CI/CD** | GitHub Actions | Integrado ao repo |
| **Logging** | Winston/Pino | Estruturado, debug |

---

## 📂 Project Structure

```
linkedin-assistant/
├── src/
│   ├── automation/          # Core RPA logic
│   │   ├── candidature.ts   # Fluxo de candidatura
│   │   ├── form-detector.ts # Detecção dinâmica de forms
│   │   └── browser.ts       # Gerenciamento Playwright
│   ├── integration/
│   │   ├── sheets.ts        # Google Sheets API
│   │   └── n8n.ts           # Webhook n8n
│   ├── logger/
│   │   └── index.ts         # Winston setup
│   └── types/
│       └── index.ts         # TypeScript types
├── config/
│   ├── .env.example
│   ├── security.json
│   └── limits.json
├── workflows/
│   ├── collect-jobs.json    # n8n export
│   └── trigger-automation.json
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/
│   ├── ARCHITECTURE.md
│   ├── SECURITY.md
│   └── TROUBLESHOOTING.md
├── .github/
│   └── workflows/
│       └── ci-cd.yml        # GitHub Actions
├── package.json
├── tsconfig.json
├── .gitignore
├── .env.example
├── README.md
└── TASK.md
```

---

## 🔐 Security Considerations

**Critical Areas:**
1. **Credenciais:** Armazenar via GitHub Secrets, não em código
2. **Rate Limiting:** Respeitar limites do LinkedIn (não ban)
3. **User-Agent:** Rotacionar para não detectar bot
4. **Captcha:** Plano para captchas (manual? solver?)
5. **2FA:** Se LinkedIn exigir autenticação multi-factor

---

## 📊 Data Schema

### Aba "Vagas" (Existente)
```
ID | Título | Link | Empresa | Localização | Data | ...
```

### Aba "Candidaturas" (NOVA)
```
ID | VagaID | Status | DataCandidatura | Resposta | Erro | Tentativas | Log
```

---

## 🚀 Success Criteria

- ✅ Automação se candida em 80%+ das vagas sem erro
- ✅ Registro completo em Sheets de cada candidatura
- ✅ Logging detalhado para debug
- ✅ CI/CD pipeline verde
- ✅ Zero credenciais em código

---

## 📅 Timeline (Estimate)

| Phase | Duration | Dates |
|-------|----------|-------|
| Phase 1: ANALYSIS | 2 dias | Feb 4-6 |
| Phase 2: PLANNING | 1 dia | Feb 7 |
| Phase 3: SOLUTIONING | 1-2 dias | Feb 8-9 |
| Phase 4: IMPLEMENTATION | 3-5 dias | Feb 10-15 |

---

## 🔗 References

- LinkedIn ToS: https://www.linkedin.com/legal/terms-and-conditions
- Playwright Docs: https://playwright.dev
- n8n Docs: https://docs.n8n.io
- GitHub Actions: https://docs.github.com/actions

---

## 📝 Notes

- Sempre testar em staging antes de produção
- Manter backups de workflows n8n
- Documentar toda tentativa de integração com LinkedIn API (pode mudar)
