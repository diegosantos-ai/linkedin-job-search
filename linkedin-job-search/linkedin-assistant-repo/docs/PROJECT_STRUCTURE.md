# 🗂️ Estrutura do Projeto Detalhada

## Organização de Pastas

```
linkedin-assistant/
│
├── 📂 .github/
│   └── workflows/
│       └── ci-cd.yml              # GitHub Actions pipeline
│
├── 📂 src/                         # Código-fonte principal
│   ├── automation/
│   │   ├── browser.ts             # Gerenciamento Playwright
│   │   ├── candidature.ts         # Fluxo principal de candidatura
│   │   ├── form-detector.ts       # Detecta campos de formulário
│   │   ├── form-filler.ts         # Preenche formulários (RAG + manual)
│   │   ├── rag-matcher.ts         # Matching com RAG database
│   │   └── handlers/
│   │       ├── login.ts           # Login no LinkedIn
│   │       ├── captcha.ts         # Detecção/handling de captcha
│   │       └── network.ts         # Retry logic, rate limiting
│   │
│   ├── integration/
│   │   ├── sheets.ts              # Google Sheets API client
│   │   ├── n8n.ts                 # Webhook para n8n
│   │   └── logger.ts              # Logging to storage
│   │
│   ├── logger/
│   │   ├── index.ts               # Pino setup
│   │   └── formatters.ts          # Custom formatters
│   │
│   ├── types/
│   │   ├── index.ts               # Global types
│   │   ├── forms.ts               # Form-related types
│   │   ├── jobs.ts                # Job listing types
│   │   └── config.ts              # Config types
│   │
│   ├── utils/
│   │   ├── retry.ts               # Retry com backoff exponencial
│   │   ├── delay.ts               # Rate limiting delays
│   │   ├── validators.ts          # Input validation
│   │   ├── strings.ts             # Text utilities
│   │   └── errors.ts              # Custom error classes
│   │
│   └── index.ts                   # Main entry point
│
├── 📂 config/
│   ├── .env.example               # Template de variáveis
│   ├── .env.test                  # Vars para testes
│   ├── limits.json                # Rate limits config
│   ├── rag-database.json          # RAG base inicial
│   └── selectors.json             # CSS/XPath LinkedIn selectors
│
├── 📂 workflows/
│   ├── collect-jobs.v1.0.json     # n8n: coletor de vagas
│   ├── trigger-automation.v1.0.json
│   │   # n8n: webhook para automação
│   ├── CHANGELOG.md               # Versionamento workflows
│   └── exports/
│       ├── backup-2026-02-04.json
│       └── backup-2026-02-03.json
│
├── 📂 tests/
│   ├── unit/
│   │   ├── form-detector.test.ts
│   │   ├── rag-matcher.test.ts
│   │   ├── validators.test.ts
│   │   └── utils.test.ts
│   │
│   ├── integration/
│   │   ├── sheets-api.test.ts
│   │   ├── n8n-webhook.test.ts
│   │   └── browser-automation.test.ts
│   │
│   └── e2e/
│       ├── complete-application.test.ts
│       ├── login-logout.test.ts
│       └── error-handling.test.ts
│
├── 📂 docs/
│   ├── ARCHITECTURE.md            # Design de sistema
│   ├── SECURITY.md                # Segurança & secrets
│   ├── ANALYSIS.md                # Phase 1 findings
│   ├── N8N_WORKFLOWS.md           # Versionamento n8n
│   ├── GIT_WORKFLOW.md            # Branch strategy
│   ├── TROUBLESHOOTING.md         # FAQs & debug
│   └── SETUP.md                   # Como rodar locally
│
├── 📂 logs/                        # Runtime logs (gitignored)
│   ├── 2026-02-04T05-00-00.json
│   └── 2026-02-04T05-15-30.json
│
├── .env.example                   # Template variáveis globais
├── .env                           # Real (gitignored)
├── .gitignore
├── .eslintrc.json                 # Lint rules
├── .prettierrc.json               # Format rules
├── package.json                   # Dependencies
├── tsconfig.json                  # TypeScript config
├── vitest.config.ts               # Test runner config
├── playwright.config.ts           # E2E test config
├── README.md                      # Project overview
├── TASK.md                        # Roadmap & status
└── LICENSE                        # MIT
```

---

## 📦 Dependências por Tipo

### Production
```json
{
  "@google-cloud/sheets": "^2.1.1",
  "axios": "^1.6.8",
  "dotenv": "^16.3.1",
  "playwright": "^1.41.2",
  "pino": "^8.17.2",
  "pino-pretty": "^10.3.1"
}
```

### Development
```json
{
  "@playwright/test": "^1.41.2",
  "@typescript-eslint/eslint-plugin": "^6.20.0",
  "eslint": "^8.56.0",
  "prettier": "^3.1.1",
  "typescript": "^5.3.3",
  "vitest": "^1.1.1"
}
```

---

## 🔄 Fluxo de Dados

### Entrada (n8n)
```json
{
  "jobIds": [123, 456, 789],
  "filters": {
    "location": "Brasil",
    "workType": "Remoto",
    "category": "Engenharia de Dados"
  }
}
```

### Processamento (Node.js)
1. ✅ Valida payload
2. ✅ Busca detalhes de vagas no Sheets
3. ✅ Filtra elegibilidade
4. ✅ Inicia Playwright
5. ✅ Faz login LinkedIn
6. ✅ Para cada vaga:
   - Navega para link
   - Detecta formulário
   - Usa RAG para respostas
   - Preenche campos
   - Submete
7. ✅ Log de resultado
8. ✅ Atualiza Sheets

### Saída (Sheets)
```
Aba "Candidaturas":
├─ ID: "app-123"
├─ VagaID: "vaga-456"
├─ Empresa: "DataCorp"
├─ Status: "applied"
├─ Data: "2026-02-04"
├─ Tentativas: 1
├─ Erro: null
├─ Log: "Form detected and submitted successfully"
└─ URL Review: "https://linkedin.com/jobs/view/789"
```

---

## 🧪 Estratégia de Testes

### Unit Tests
```
src/utils/validators.test.ts       → Input validation
src/utils/retry.test.ts            → Backoff logic
src/automation/form-detector.test.ts
  → CSS selector parsing
  → Field type detection
src/automation/rag-matcher.test.ts
  → Question similarity (cosine distance)
  → Response ranking
```

### Integration Tests
```
tests/integration/sheets-api.test.ts
  → Read/write Sheets
  → Handle auth errors
tests/integration/n8n-webhook.test.ts
  → Webhook receive
  → Payload validation
tests/integration/browser-automation.test.ts
  → Login success
  → Handle timeouts
```

### E2E Tests
```
tests/e2e/complete-application.test.ts
  → Full flow: job → form → submit
tests/e2e/error-handling.test.ts
  → Captcha detection
  → Network errors
  → Form errors
```

---

## 📊 Config Files Details

### limits.json
```json
{
  "applicationsPerDay": 50,
  "applicationsPerHour": 10,
  "delayBetweenApplications": {
    "min": 5000,
    "max": 15000
  },
  "browserTimeout": 30000,
  "maxRetries": 3,
  "retryBackoff": {
    "initial": 5000,
    "multiplier": 2,
    "maxWait": 120000
  }
}
```

### rag-database.json
```json
{
  "version": "1.0",
  "lastUpdated": "2026-02-04",
  "responses": [
    {
      "id": "resp-001",
      "question": "Por que você está interessado em trabalhar conosco?",
      "answer": "Sou apaixonado por Engenharia de Dados e inovação...",
      "category": "motivation",
      "keywords": ["interessado", "trabalhar", "empresa"],
      "confidence": 0.95
    }
  ]
}
```

### selectors.json
```json
{
  "linkedIn": {
    "loginEmail": "input[name='session_key']",
    "loginPassword": "input[name='session_password']",
    "formContainer": "form[class*='apply']",
    "formFields": "input, textarea, select",
    "submitButton": "button[type='submit']",
    "captchaFrame": "iframe[src*='recaptcha']"
  }
}
```

---

## 🔒 Segurança de Configuração

### Hierarquia de Configuração
```
1. GitHub Secrets (produção)
   ↓ (mais prioridade)
2. process.env (runtime)
   ↓
3. .env file (desenvolvimento)
   ↓
4. .env.example (padrão)
   ↓ (menos prioridade)
5. Hardcoded defaults (fallback)
```

### Nunca commit
```
❌ .env (credenciais reais)
❌ credentials.json (Google)
❌ .env.production
❌ secrets/
```

### Sempre commit
```
✅ .env.example (template vazio)
✅ .gitignore (lista de exclusões)
✅ config/*.example.json
```

---

## 📈 Escalabilidade Futura

**Estrutura pronta para:**
- ✅ Multi-user applications (isolation por user)
- ✅ Webhook callbacks (n8n ← Node.js)
- ✅ Queue management (Bull/RabbitMQ pronto)
- ✅ Database storage (PostgreSQL ready)
- ✅ Cloud deployment (Docker ready)
- ✅ Monitoring (Prometheus metrics ready)
