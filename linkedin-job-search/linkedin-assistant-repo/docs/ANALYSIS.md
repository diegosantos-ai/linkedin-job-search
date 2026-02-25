# 🔍 PHASE 1: ANALYSIS - LinkedIn Assistant

## Decisões Confirmadas & Especificações

### 1. Autenticação & RPA Strategy

#### Escolha: Playwright (Headless Browser RPA)

**Por quê Playwright?**
- ✅ Mais seguro que credenciais diretas
- ✅ Simula usuário real (menos detecção de bot)
- ✅ Testável (E2E automático)
- ✅ Suporte a headless
- ✅ Integração com CI/CD

**Fluxo:**
```
1. n8n Trigger
   ↓
2. Node.js service recebe job IDs
   ↓
3. Playwright abre browser
   ├─ Faz login LinkedIn
   ├─ Navega para job page
   ├─ Detecta formulário
   ├─ Preenche campos (RAG + manual)
   └─ Submete candidatura
   ↓
4. Log result → Sheets
```

---

### 2. Lógica de Candidatura com RAG

#### Arquitetura de Preenchimento Inteligente

```
┌─────────────────────────────────────┐
│   Form Detectado na Página          │
└────────────┬────────────────────────┘
             │
             ▼
      ┌──────────────┐
      │ Campos do    │
      │ Formulário   │
      └──────┬───────┘
             │
    ┌────────┴────────┐
    │                 │
    ▼                 ▼
┌─────────┐    ┌──────────────┐
│ RAG DB  │    │ Detecta valor│
│ (Base   │    │ automático?  │
│ de      │    └──┬───────┬───┘
│ respos) │       │       │
└────┬────┘      SIM      NÃO
     │            │        │
     ▼            │        ▼
┌──────────┐      │    ┌─────────┐
│ Query    │      │    │ Pergunta│
│ similar  │      │    │ tem     │
│ encontrou        │    │ resposta│
└────┬─────┘      │    │ clara?  │
     │            │    └──┬──┬───┘
     ▼            │       │  │
 ┌─────────┐      │      SIM NÃO
 │ Resposta│◄─────┘       │   │
 │ RAG     │              ▼   ▼
 └────┬────┘         ┌──────┐┌──────┐
      │              │Preenche
      │              │automático
      │              └──────┐│Queue
      │                     ││manual
      │                     │└──────┐
      └─────────────────────┘       │
                                    ▼
                            ┌────────────────┐
                            │ Manual Review   │
                            │ List (user)     │
                            └────────────────┘
```

#### RAG Database (Primeiros Dados)

```json
{
  "responses": [
    {
      "question": "Por que você está interessado em trabalhar conosco?",
      "answer": "Sou apaixonado por Engenharia de Dados...",
      "category": "motivation"
    },
    {
      "question": "Qual é sua experiência com Python?",
      "answer": "Tenho 5+ anos de experiência...",
      "category": "technical"
    },
    {
      "question": "Você tem experiência com SQL?",
      "answer": "Sim, domino SQL avançado...",
      "category": "technical"
    }
  ]
}
```

**Implementação:**
```typescript
// pseudo-code
const similarQuestion = findSimilarQuestion(formQuestion, ragDB);
if (similarQuestion.confidence > 0.8) {
  return similarQuestion.answer; // Auto-fill
} else {
  return queueForManualReview(formQuestion); // User decides
}
```

---

### 3. Filtros de Elegibilidade

#### Antes de iniciar automação:

```javascript
const isEligible = (job) => {
  return (
    job.location.includes("Brasil") &&
    job.workType.includes("Remoto") &&
    job.category.includes("Engenharia de Dados") &&
    !job.isAlreadyApplied // Verifica se já se candidatou
  );
};
```

**Campos esperados no Sheets (Vagas):**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| ID | Text | Unique ID |
| **Título** | Text | Job title |
| **Empresa** | Text | Company name |
| **Link** | URL | LinkedIn job URL |
| Localização | Text | "Brasil", "Remoto", etc |
| Tipo de Trabalho | Text | "Remoto", "Híbrido", "Presencial" |
| Categoria | Text | "Engenharia de Dados", etc |
| Score | Number | AI matching score (0-100) |
| Data Coleta | Date | When job was found |
| Status Aplicação | Select | Not Applied / Applied / Failed / Manual Review |

---

### 4. Schema: Aba "Candidaturas"

**Novo - vamos criar:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| ID | Text | Unique ID |
| **VagaID** | Text | Foreign key → Vagas.ID |
| **Empresa** | Text | Company name (denormalized) |
| **Status** | Select | ✅ Applied / ⚠️ Failed / ⏳ Pending / 🔍 Manual Review |
| Data Candidatura | Date | When application was sent |
| Tentativas | Number | Retry count (1, 2, 3) |
| Último Erro | Text | Error message (if failed) |
| Campos Preenchidos | JSON | Form data sent |
| Campos Não Preenchidos | JSON | Fields that needed manual review |
| Log | Text | Detailed log output |
| URL Review | URL | Link to job for manual follow-up |

---

### 5. Versionamento de Workflows n8n

#### Estratégia Recomendada:

**1. No Git (Snapshots):**
```
workflows/
├── collect-jobs.v1.0.json
├── trigger-automation.v1.0.json
└── CHANGELOG.md
```

**2. No n8n UI (Nativo):**
- Use versioning built-in do n8n
- Crie "backup version" antes de mudanças

**3. Fluxo de Atualização:**
```
1. Desenvolva no n8n UI
2. Teste completamente
3. Export JSON
4. Commit no Git com mensagem clara:
   git commit -m "feat(n8n): add captcha detection in job automation"
5. PR review
6. Merge em develop
7. Deploy em produção
```

**4. CHANGELOG.md:**
```markdown
# Changelog - n8n Workflows

## v1.1.0 (2026-02-10)
- feat: Add RAG integration for form filling
- fix: Handle captcha detection
- refactor: Improve error logging

## v1.0.0 (2026-02-04)
- Initial workflow setup
- Job collection from LinkedIn
- AI scoring with Gemini
```

---

### 6. Estrutura de Logs

**Arquivo de log por execução:**
```
logs/
├── 2026-02-04T05-00-00.json
├── 2026-02-04T05-15-30.json
└── ...
```

**Conteúdo de log (estruturado):**
```json
{
  "timestamp": "2026-02-04T05:00:00Z",
  "jobId": "12345",
  "company": "DataCorp",
  "vaga": "Senior Data Engineer",
  "status": "applied",
  "details": {
    "formFieldsFound": 5,
    "fieldsAutoFilled": 3,
    "fieldsSentToReview": 2,
    "timeToComplete": 4500,
    "browser": "Chromium",
    "userAgent": "Mozilla/5.0..."
  },
  "errors": null,
  "retries": 0
}
```

---

### 7. Rate Limiting & Compliance

**Respeitar LinkedIn ToS:**
- ⏸️ Máximo 50 candidaturas/dia
- ⏰ Delay entre candidaturas: 5-15 segundos
- 🔄 Máximo 3 tentativas por vaga
- 🚫 Nunca em horários suspeitos (2am-4am)
- 📊 Log tudo para auditoria

---

### 8. Error Handling Strategy

```typescript
enum ApplicationStatus {
  SUCCESS = "applied",
  FORM_ERROR = "form_error",        // Campo não reconhecido
  NETWORK_ERROR = "network_error",  // Retryable
  CAPTCHA_DETECTED = "captcha",     // Manual intervention
  ALREADY_APPLIED = "duplicate",    // Skip
  RATE_LIMIT = "rate_limit",        // Wait & retry
  UNKNOWN = "unknown_error"
}
```

**Decisão Logic:**
```
┌─────────────┐
│   Erro?     │
└──────┬──────┘
       │
   ┌───┴────┬────────────────────────┐
   │        │                        │
   RETRY?   MANUAL?                SKIP?
   (3x)     (queue)                (log)
   │        │                        │
   └────┬───┴────────────────────────┘
        │
        ▼
    Update Sheets
```

---

### 9. Riscos Identificados & Mitigação

| Risco | Impacto | Mitigation |
|-------|---------|-----------|
| **LinkedIn detecta bot** | Account ban | Delays, user-agent rotation, rate limiting |
| **Formulário muda** | Automação quebra | Robust selectors, fallback manual |
| **Captcha obrigatório** | Bloqueia progresso | Queue para manual review |
| **Dados PII no log** | Vazamento | Never log emails/phone, hash sensitive data |
| **Credenciais expostas** | Breach | GitHub Secrets only, never in .env |
| **Formulário com validação** | Rejeição | RAG con respostas validadas |

---

### 10. Próximos Passos (Phase 2)

- [ ] Detalhar arquitetura de código
- [ ] Design database schema (SQLite local)
- [ ] Definir endpoints n8n ↔ Node.js
- [ ] Planejar estrutura de testes (Unit + E2E)
- [ ] Documentar setup de secrets
- [ ] Criar wireflows de formulários

---

## 📊 Tech Stack Confirmado

| Layer | Tech | Razão |
|-------|------|--------|
| **Orchestration** | n8n | Job collector + Webhook trigger |
| **RPA/Automation** | Playwright | Headless, testável, confiável |
| **Intelligence** | RAG + LLM | Respostas automáticas quando possível |
| **Data** | Google Sheets | Source of truth |
| **Logging** | Pino + JSON | Estruturado, debug |
| **Secrets** | dotenv + GitHub Secrets | Seguro |
| **Testing** | Vitest + Playwright | Unit + E2E |
| **CI/CD** | GitHub Actions | Auto lint, test, build |
| **Language** | Node.js + TypeScript | Type-safe, fast, async |

---

## 🎯 Success Criteria (Refinado)

- ✅ Automação se candida em 80%+ das vagas sem erro
- ✅ RAG responde 70%+ das perguntas automaticamente
- ✅ 20%+ vagas vão para manual review (RAG uncertain)
- ✅ Registro completo em Sheets (Vagas + Candidaturas)
- ✅ Logs detalhados para auditoria & debug
- ✅ Zero credenciais em código
- ✅ CI/CD pipeline 100% verde
- ✅ Zero account bans do LinkedIn
