# Visão Geral do Código - LinkedIn Job Assistant

## 📋 Índice

- [Arquitetura](#arquitetura)
- [Módulos Principais](#módulos-principais)
- [Fluxo de Execução](#fluxo-de-execução)
- [Componentes Detalhados](#componentes-detalhados)

---

## Arquitetura

```
src/
├── automation/         # Núcleo da automação RPA
│   ├── browser.ts      # Gerenciamento de sessão de browser
│   ├── candidature.ts  # Orquestrador principal
│   ├── form-detector.ts # Detecção dinâmica de formulários
│   ├── form-filler.ts  # Preenchimento com RAG
│   ├── rag-matcher.ts  # Matching de respostas
│   └── handlers/       # Handlers especializados
│       ├── login.ts    # Autenticação LinkedIn
│       └── captcha.ts  # Detecção e espera de captcha
├── integration/        # Integrações externas
│   └── sheets.ts       # Google Sheets API
├── utils/              # Utilitários
│   ├── delay.ts        # Delays humanizados
│   ├── retry.ts        # Retry com backoff exponencial
│   └── validators.ts   # Validação de inputs (Zod)
├── logger/             # Logger estruturado (Pino)
├── types/              # Definições de tipos TypeScript
└── index.ts            # Entrypoint principal
```

---

## Módulos Principais

### 🤖 Automation Core

#### `browser.ts` - Gerenciador de Browser
**Responsabilidade:** Ciclo de vida de sessões Playwright com anti-detecção.

```typescript
launchBrowser(config: AppConfig): Promise<Browser>
createContext(browser: Browser): Promise<BrowserContext>
createPage(context: BrowserContext): Promise<Page>
closeBrowser(): Promise<void>
```

**Features:**
- Remove flags de automação (`webdriver=false`)
- User-Agent randomizado (3 variantes)
- Headless configurável
- Timeout configurável

---

#### `candidature.ts` - Orquestrador Principal
**Responsabilidade:** Fluxo completo de candidatura.

```typescript
applyCandidature(options: CandidatureOptions): Promise<ApplicationResult>
applyBatch(jobs: JobListing[], config, sheetsConfig): Promise<ApplicationResult[]>
```

**Fluxo:**
1. Launch browser + login
2. Navega para vaga
3. Detecta captcha (se necessário)
4. Clica em "Candidatar-se"
5. Detecta formulário
6. Preenche com RAG
7. Submete (se fill rate > 50%)
8. Registra resultado

**Decisões:**
- Fill rate < 50% → **skip** (não submete)
- Captcha não resolvido → **fail**
- Retry automático via `retry()` utility

---

#### `form-detector.ts` - Detector de Formulários
**Responsabilidade:** Análise dinâmica de formulários LinkedIn.

```typescript
detectForm(page: Page): Promise<FormAnalysis>
extractFieldInfo(element: ElementHandle): Promise<FormField>
```

**Detecta:**
- `<input>` (text, email, tel, date, number, checkbox, radio)
- `<textarea>`
- `<select>`
- Labels associados
- Campos required
- Botão de submit

**Output:**
```typescript
{
  fields: FormField[];
  submitSelector: string;
  hasError: boolean;
}
```

---

#### `form-filler.ts` - Preenchedor de Formulários
**Responsabilidade:** Auto-preenchimento com RAG + fallback manual.

```typescript
fillForm(page, formAnalysis, jobId, company, sheetsConfig): Promise<FillResult>
fillSingleField(page, field, jobId, company, sheetsConfig): Promise<FillAction>
fillFieldWithValue(page, field, value): Promise<void>
submitForm(page, submitSelector): Promise<boolean>
```

**Lógica:**
1. Para cada campo:
   - Query RAG com `findRAGAnswer()`
   - Se **confidence ≥ 0.80** → auto-fill
   - Se **confidence < 0.80** → envia para `ManualReview` tab
2. Calcula fill rate
3. Submete se > 50%

**Features:**
- Delays humanizados entre campos
- Suporte a todos tipos de input
- Detecção de erros pós-submit

---

#### `rag-matcher.ts` - RAG Matcher
**Responsabilidade:** Matching de perguntas com respostas via similaridade.

```typescript
findRAGAnswer(question: string, database: RAGEntry[]): RAGMatchResult
calculateSimilarity(q1: string, q2: string): number
addToRAGDatabase(db: RAGEntry[], newEntry): void
```

**Algoritmo:**
1. **Jaccard Similarity:**
   - Tokeniza strings
   - Calcula `|A ∩ B| / |A ∪ B|`
2. **Substring Bonus:**
   - +0.10 se substring exata encontrada
3. **Decisão:**
   - ≥ 0.80 → `auto-fill`
   - ≥ 0.60 → `suggest`
   - < 0.60 → `manual-review`

**Database:** `config/rag-database.json` (10 respostas iniciais)

---

### 🔌 Integration

#### `sheets.ts` - Google Sheets API
**Responsabilidade:** CRUD de vagas e candidaturas.

```typescript
getJobsFromSheets(config, filters?): Promise<JobListing[]>
recordApplication(config, result: ApplicationResult): Promise<void>
addToManualReview(config, reviewItem: ManualReviewItem): Promise<void>
updateJobStatus(config, jobId: string, status: string): Promise<void>
```

**Tabs:**
- **Vagas:** Input (id, title, link, company, location, score, status)
- **Candidaturas:** Output (jobId, status, appliedAt, error, retries)
- **ManualReview:** Campos incertos (10 colunas: ID, jobId, company, fieldName, label, question, suggestedAnswer, confidence%, status, timestamp)

**Filtros:**
- `minScore` (default: 70)
- `location` (ex: "Brasil - Remoto")
- `jobType` (ex: "Engenharia de Dados")

---

### 🛠️ Utilities

#### `delay.ts` - Delays Humanizados
```typescript
randomDelay(min: number, max: number): Promise<void>
humanDelay(baseMs: number): Promise<void>  // ±30% variance
typingDelay(): Promise<void>  // 50-150ms
```

---

#### `retry.ts` - Exponential Backoff
```typescript
retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions,
  operationName: string
): Promise<T>
```

**Configuração:**
- `maxAttempts`: 1-5 (default: 3)
- `initialDelayMs`: 1000ms
- `multiplier`: 2 (dobra a cada retry)
- `maxDelayMs`: 120000ms (2min)

**Erros Retryable:**
- Timeout
- Network
- ECONNREFUSED

---

#### `validators.ts` - Validação com Zod
```typescript
validateJobListing(data: unknown)
validateApplicationResult(data: unknown)
validateAppConfig(data: unknown)
isLinkedInUrl(url: string): boolean
isValidScore(score: number): boolean
```

---

### 🔐 Handlers

#### `login.ts` - Autenticação
```typescript
loginLinkedIn(page: Page, credentials): Promise<void>
isAuthenticated(page: Page): Promise<boolean>
```

**Flow:**
1. Navega para `/login`
2. Preenche email (delay 500-1500ms)
3. Preenche senha (delay 500-1500ms)
4. Clica em "Sign in"
5. Aguarda redirecionamento
6. Detecta checkpoint/captcha

---

#### `captcha.ts` - Captcha Handler
```typescript
detectCaptcha(page: Page): Promise<CaptchaDetection>
waitForCaptchaSolution(page: Page, timeout: number): Promise<boolean>
```

**Detecta:**
- iframes de reCAPTCHA
- URLs de checkpoint (`/checkpoint/`)
- Texto "security check"

**Espera:** Polling a cada 2s, timeout 2min (configurable)

---

## Fluxo de Execução

### 1️⃣ Inicialização
```
index.ts
  ├─> Carrega env vars
  ├─> validateAppConfig()
  ├─> getJobsFromSheets() com filtros
  └─> Limita por maxApplicationsPerDay
```

### 2️⃣ Batch Processing
```
applyBatch()
  └─> Para cada job:
        ├─> retry(applyCandidature())
        └─> delay(5-15s) entre jobs
```

### 3️⃣ Candidatura Individual
```
applyCandidature()
  ├─> launchBrowser()
  ├─> loginLinkedIn()
  ├─> page.goto(job.link)
  ├─> detectCaptcha()
  │     └─> Se detectado: waitForCaptchaSolution()
  ├─> Clica "Candidatar-se"
  ├─> detectForm()
  ├─> fillForm()
  │     └─> Para cada campo:
  │           ├─> findRAGAnswer()
  │           ├─> Se conf≥0.80: fillFieldWithValue()
  │           └─> Senão: addToManualReview()
  ├─> Se fillRate > 50%: submitForm()
  └─> recordApplication()
```

---

## Componentes Detalhados

### RAG Database Structure
```json
{
  "id": "q1",
  "question": "Por que você quer trabalhar aqui?",
  "answer": "Tenho grande interesse em...",
  "category": "motivation",
  "keywords": ["motivação", "interesse", "empresa"],
  "confidence": 0.85,
  "tags": ["soft-skill", "common"]
}
```

### ManualReview Tab Columns
| Column | Type | Description |
|--------|------|-------------|
| ID | string | `review-{timestamp}` |
| Job ID | string | ID da vaga |
| Company | string | Nome da empresa |
| Field Name | string | Nome do campo HTML |
| Field Label | string | Label visual |
| Question | string | Pergunta detectada |
| Suggested Answer | string | Resposta sugerida (se conf≥0.60) |
| Confidence | number | 0-100% |
| Status | string | `pending` / `approved` / `rejected` |
| Timestamp | string | ISO 8601 |

---

## Configuração (Env Vars)

```bash
# LinkedIn
LINKEDIN_EMAIL=user@example.com
LINKEDIN_PASSWORD=password123

# Google Sheets
GOOGLE_SHEETS_API_KEY=your-api-key
GOOGLE_SHEETS_SPREADSHEET_ID=your-spreadsheet-id
GOOGLE_SHEETS_JOBS_SHEET=Vagas
GOOGLE_SHEETS_APPLICATIONS_SHEET=Candidaturas
GOOGLE_SHEETS_MANUAL_REVIEW_SHEET=ManualReview

# App
MAX_APPLICATIONS_PER_DAY=50
MAX_RETRIES=3
MIN_JOB_SCORE=70
JOB_LOCATION=Brasil - Remoto
JOB_TYPE=Engenharia de Dados
HEADLESS=true
BROWSER_TIMEOUT=30000
```

---

## Testing

### Unit Tests
- `rag-matcher.test.ts`: Testa similaridade Jaccard e decisões de confiança
- `retry.test.ts`: Testa backoff exponencial e detecção de erros retryable
- `validators.test.ts`: Testa validação Zod de inputs

### Integration Tests
- Google Sheets API (CRUD operations)
- RAG matching com database real

### E2E Tests
- Fluxo completo de candidatura (Playwright)
- Detecção de formulários
- Login + captcha handling

---

## Logging

Usando **Pino** com níveis:
- `info`: Progresso normal
- `warn`: Situações recuperáveis (ex: fill rate baixo)
- `error`: Erros críticos
- `debug`: Detalhes técnicos

Logs estruturados em JSON com contexto (jobId, company, fieldsCount, etc.)

---

## Rate Limiting

**Estratégias:**
1. **Daily Limit:** `maxApplicationsPerDay` (default: 50)
2. **Delays entre candidaturas:** 5-15s randomizados
3. **Delays humanizados:** ±30% variance em todas ações
4. **Retry com backoff:** Exponencial (1s → 2s → 4s → ...)

---

## Anti-Detection

**Técnicas aplicadas:**
- Remove `navigator.webdriver` flag
- User-Agent randomizado
- Delays humanizados (não constantes)
- Typing delays (50-150ms por caractere)
- Randomização de intervalos entre ações

---

## Error Handling

**Categorias:**
1. **Retryable:** Timeout, Network, ECONNREFUSED → retry automático
2. **Non-retryable:** Invalid data, captcha timeout → fail imediato
3. **Fill rate baixo:** < 50% → skip (não submete)
4. **Captcha não resolvido:** → fail + notificação

**Todos erros logados com contexto completo.**
