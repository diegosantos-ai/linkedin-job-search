# 📊 Data Schema - LinkedIn Assistant

> **Document:** Especificação completa do schema de dados  
> **Phase:** 2 (PLANNING)  
> **Last Updated:** 2026-02-04

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Google Sheets Structure](#google-sheets-structure)
- [Aba "Vagas"](#aba-vagas)
- [Aba "Candidaturas"](#aba-candidaturas)
- [Aba "Config"](#aba-config-opcional)
- [RAG Database Schema](#rag-database-schema)
- [Logs Schema](#logs-schema)
- [Validações](#validações)
- [Índices e Performance](#índices-e-performance)

---

## Visão Geral

O LinkedIn Assistant usa **Google Sheets** como banco de dados principal por:
- ✅ Fácil visualização e edição manual
- ✅ Integração nativa com n8n
- ✅ Não requer infraestrutura adicional
- ✅ Audit trail automático (histórico de edições)
- ✅ Permissões granulares do Google

**Limitações a considerar:**
- Max 5 milhões de células por planilha
- Max 40.000 novas linhas por dia (API quota)
- Latência de rede (não ideal para queries complexas)

**Solução futura:** Migrar para PostgreSQL/MongoDB quando escalar.

---

## Google Sheets Structure

**Nome da Planilha:** `LinkedIn Job Search - Automação`

**Abas:**
1. **Vagas** - Jobs coletados pelo n8n (read-only para automation)
2. **Candidaturas** - Registro de todas as aplicações (write-only para automation)
3. **Config** - Configurações de rate limiting, filtros, etc (optional)
4. **RAG Insights** - Análise de campos mais comuns (future)

---

## Aba "Vagas"

### Estrutura

| Coluna | Nome | Tipo | Requerido | Descrição | Exemplo |
|--------|------|------|-----------|-----------|---------|
| A | ID | String | ✅ | Unique identifier da vaga | `job_1234567890` |
| B | Título | String | ✅ | Título da vaga | "Engenheiro de Dados Sênior" |
| C | Link | URL | ✅ | URL completa da vaga no LinkedIn | `https://www.linkedin.com/jobs/view/123456/` |
| D | Empresa | String | ✅ | Nome da empresa | "Google Brasil" |
| E | Localização | String | ✅ | Local da vaga | "Brasil - Remoto" |
| F | Score | Number | ✅ | Score de match (0-100) | 85 |
| G | Data Coleta | DateTime | ✅ | Timestamp de quando foi coletada | `2026-02-04 10:30:00` |
| H | Tipo | String | ✅ | Categoria da vaga | "Engenharia de Dados" |
| I | Descrição | Text | ❌ | Descrição completa da vaga | "Buscamos profissional..." |
| J | Tentativas | Number | ✅ | Contador de tentativas de aplicação | 0, 1, 2, 3 |
| K | Última Tentativa | DateTime | ❌ | Data da última tentativa | `2026-02-04 14:30:00` |
| L | Status Aplicação | Enum | ✅ | Status da última aplicação | `pending`, `success`, `failed`, `skipped` |
| M | Observações | Text | ❌ | Notas manuais | "Candidatura requer portfólio" |

### Formato de Dados

**ID:**
- Formato: `job_{timestamp}_{random}`
- Exemplo: `job_1643980800_a3f2`
- Gerado pelo n8n na coleta

**Score:**
- Range: 0-100
- Decimal permitido (ex: 85.5)
- Calculado pelo workflow n8n baseado em keywords matching

**Data Coleta / Última Tentativa:**
- Formato: `YYYY-MM-DD HH:MM:SS`
- Timezone: UTC-3 (Brasília)
- Gerado automaticamente

**Status Aplicação:**
- `pending`: Ainda não tentou aplicar
- `success`: Aplicação enviada com sucesso
- `failed`: Falha na aplicação (erro técnico)
- `skipped`: Pulou (fill rate < 50% ou já aplicou)

### Regras de Negócio

**Filtro de Elegibilidade (aplicado pelo n8n antes de chamar automation):**
```
Eligible IF:
  - Score >= 70
  - Localização CONTAINS "Brasil" OR "Remoto"
  - Tipo = "Engenharia de Dados"
  - Tentativas < 3
  - Status != "success"
```

**Atualização após Aplicação:**
- Incrementar `Tentativas`
- Atualizar `Última Tentativa` com timestamp atual
- Atualizar `Status Aplicação` baseado no resultado

### Exemplo de Linha

```
A: job_1643980800_a3f2
B: Engenheiro de Dados Sênior
C: https://www.linkedin.com/jobs/view/3456789/
D: Google Brasil
E: São Paulo, Brasil - Remoto
F: 92
G: 2026-02-04 10:30:00
H: Engenharia de Dados
I: Buscamos profissional com experiência em Python, SQL, Airflow...
J: 1
K: 2026-02-04 14:30:00
L: success
M: 
```

---

## Aba "Candidaturas"

### Estrutura

| Coluna | Nome | Tipo | Requerido | Descrição | Exemplo |
|--------|------|------|-----------|-----------|---------|
| A | ID | String | ✅ | Unique identifier da candidatura | `app_1643980900_b4e1` |
| B | VagaID | String (FK) | ✅ | Referência para Aba Vagas | `job_1643980800_a3f2` |
| C | Título Vaga | String | ✅ | Cópia do título (desnormalizado) | "Engenheiro de Dados Sênior" |
| D | Empresa | String | ✅ | Cópia da empresa (desnormalizado) | "Google Brasil" |
| E | Status | Enum | ✅ | Resultado da aplicação | `success`, `failed`, `skipped` |
| F | Data Candidatura | DateTime | ✅ | Timestamp da tentativa | `2026-02-04 14:30:00` |
| G | Tentativa Nº | Number | ✅ | Qual tentativa foi (1, 2, 3) | 1 |
| H | Campos Detectados | Number | ✅ | Total de campos no formulário | 12 |
| I | Campos Preenchidos | Number | ✅ | Quantos foram preenchidos | 10 |
| J | Fill Rate (%) | Number | ✅ | Percentual de preenchimento | 83.33 |
| K | RAG Usado | Boolean | ✅ | Se usou RAG para preencher | `TRUE`, `FALSE` |
| L | RAG Matches | Number | ✅ | Quantos campos foram preenchidos via RAG | 5 |
| M | Formulário Tipo | String | ❌ | Tipo de formulário detectado | "LinkedIn Easy Apply", "External" |
| N | Captcha Detectado | Boolean | ✅ | Se houve captcha | `TRUE`, `FALSE` |
| O | Captcha Resolvido | Boolean | ❌ | Se captcha foi resolvido | `TRUE`, `FALSE` |
| P | Tempo Execução (s) | Number | ✅ | Duração total em segundos | 45 |
| Q | Erro | Text | ❌ | Mensagem de erro (se failed) | "Captcha timeout after 120s" |
| R | Erro Tipo | Enum | ❌ | Categoria do erro | `captcha`, `network`, `timeout`, `form_not_found` |
| S | Log URL | URL | ❌ | Link para logs detalhados (S3/Cloud) | `https://s3.../logs/app_123.json` |
| T | User Agent | String | ❌ | User-Agent usado | `Mozilla/5.0 ...` |
| U | Browser Version | String | ❌ | Versão do Playwright | `Chromium 110.0.5481.65` |
| V | Observações | Text | ❌ | Notas adicionais | "Formulário multi-step detectado" |

### Formato de Dados

**ID:**
- Formato: `app_{timestamp}_{random}`
- Exemplo: `app_1643980900_b4e1`

**Status:**
- `success`: Formulário submetido com sucesso
- `failed`: Erro técnico impediu submissão
- `skipped`: Não submeteu (fill rate < 50% ou outras razões)

**Fill Rate:**
- Calculado: `(Campos Preenchidos / Campos Detectados) * 100`
- Arredondado para 2 casas decimais
- Exemplo: 10/12 = 83.33%

**RAG Usado:**
- `TRUE`: Pelo menos 1 campo preenchido com RAG
- `FALSE`: Todos campos preenchidos com dados reais ou vazios

**Erro Tipo:**
- `captcha`: Captcha não resolvido
- `network`: Erro de conexão/timeout
- `timeout`: Timeout geral da execução
- `form_not_found`: Formulário não detectado na página
- `validation`: Campos não passaram validação do LinkedIn
- `rate_limit`: Limite de candidaturas atingido
- `login_failed`: Falha no login

**Tempo Execução:**
- Medido do início (launch browser) até o fim (close browser)
- Em segundos (inteiro)

### Regras de Negócio

**Decisão de Submissão:**
```
Submit IF:
  - Fill Rate >= 50%
  - Captcha Resolvido = TRUE (se detectado)
  - Campos Required todos preenchidos
  
Skip IF:
  - Fill Rate < 50%
  - Captcha não resolvido
  - Formulário externo (não Easy Apply)
```

**Logging:**
- SEMPRE criar linha na aba Candidaturas (mesmo se failed/skipped)
- Logs detalhados em arquivo separado (JSON) para debug
- URL do log armazenada na coluna `Log URL`

### Exemplo de Linha

```
A: app_1643980900_b4e1
B: job_1643980800_a3f2
C: Engenheiro de Dados Sênior
D: Google Brasil
E: success
F: 2026-02-04 14:30:00
G: 1
H: 12
I: 10
J: 83.33
K: TRUE
L: 5
M: LinkedIn Easy Apply
N: FALSE
O: 
P: 45
Q: 
R: 
S: https://s3.amazonaws.com/logs/app_1643980900_b4e1.json
T: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...
U: Chromium 110.0.5481.65
V: 
```

---

## Aba "Config" (Opcional)

Configurações globais que podem ser editadas manualmente sem rebuild.

| Key | Value | Tipo | Descrição |
|-----|-------|------|-----------|
| MAX_APPLICATIONS_PER_DAY | 50 | Number | Limite diário de aplicações |
| MAX_APPLICATIONS_PER_HOUR | 15 | Number | Limite por hora |
| MIN_FILL_RATE_TO_SUBMIT | 50 | Number | % mínimo para submeter |
| MIN_JOB_SCORE | 70 | Number | Score mínimo para considerar vaga |
| MAX_RETRIES_PER_JOB | 3 | Number | Máximo de tentativas por vaga |
| HEADLESS_MODE | TRUE | Boolean | Executar browser em headless |
| BROWSER_TIMEOUT | 30000 | Number | Timeout em ms |
| DELAY_BETWEEN_APPLICATIONS_MIN | 5000 | Number | Delay mínimo entre candidaturas (ms) |
| DELAY_BETWEEN_APPLICATIONS_MAX | 15000 | Number | Delay máximo entre candidaturas (ms) |
| ENABLE_RAG | TRUE | Boolean | Habilitar RAG matching |
| CAPTCHA_TIMEOUT | 120000 | Number | Timeout para resolver captcha (ms) |
| LOG_LEVEL | info | String | Nível de logging (debug, info, warn, error) |

**Leitura pelo automation:**
```typescript
const config = await sheets.spreadsheets.values.get({
  spreadsheetId,
  range: 'Config!A:B'
});
const configMap = new Map(config.data.values);
const maxDaily = Number(configMap.get('MAX_APPLICATIONS_PER_DAY'));
```

---

## RAG Database Schema

**Arquivo:** `config/rag-database.json`

```typescript
interface RAGEntry {
  id: string;
  question: string;
  answer: string;
  tags: string[];
  category?: string;
  confidence?: number; // 0-1, usado para ranking
}

interface RAGDatabase {
  version: string;
  lastUpdated: string; // ISO 8601
  entries: RAGEntry[];
}
```

### Exemplo

```json
{
  "version": "1.0.0",
  "lastUpdated": "2026-02-04T14:30:00Z",
  "entries": [
    {
      "id": "q1",
      "question": "Quantos anos de experiência você tem?",
      "answer": "5 anos de experiência profissional",
      "tags": ["experiencia", "anos", "seniority", "tempo"],
      "category": "experience",
      "confidence": 0.9
    },
    {
      "id": "q2",
      "question": "Qual sua disponibilidade para início?",
      "answer": "Imediata",
      "tags": ["disponibilidade", "inicio", "start", "quando"],
      "category": "availability",
      "confidence": 1.0
    },
    {
      "id": "q3",
      "question": "Você tem experiência com Python?",
      "answer": "Sim, 5 anos de experiência com Python em projetos de engenharia de dados",
      "tags": ["python", "linguagem", "programacao", "experiencia"],
      "category": "skills",
      "confidence": 0.95
    }
  ]
}
```

### Categorias Sugeridas

- `experience`: Anos de experiência, seniority
- `skills`: Tecnologias, ferramentas, linguagens
- `education`: Formação acadêmica
- `availability`: Disponibilidade, início
- `salary`: Pretensão salarial (usar com cautela)
- `location`: Preferências de local
- `other`: Perguntas genéricas

### Matching Algorithm

Veja implementação em `src/automation/rag-matcher.ts`.

**Jaccard Similarity:**
```
similarity(A, B) = |A ∩ B| / |A ∪ B|

Onde:
A = set de tokens da pergunta do formulário
B = set de tokens da pergunta no RAG DB
```

**Exemplo:**
```
Question (form): "Você possui experiência com Python?"
Question (RAG):  "Você tem experiência com Python?"

Tokens A: {"voce", "possui", "experiencia", "com", "python"}
Tokens B: {"voce", "tem", "experiencia", "com", "python"}

Intersection: {"voce", "experiencia", "com", "python"} = 4
Union: {"voce", "possui", "tem", "experiencia", "com", "python"} = 6

Similarity = 4/6 = 0.67 ✅ (acima do threshold de 0.4)
```

---

## Logs Schema

**Formato:** JSON Lines (cada linha = 1 log entry)

**Storage:** S3, Google Cloud Storage, ou local filesystem

**Arquivo por execução:** `logs/{date}/{applicationId}.json`

### Estrutura do Log

```typescript
interface LogEntry {
  timestamp: string; // ISO 8601
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context: {
    applicationId: string;
    jobId: string;
    company: string;
    step?: string; // 'login', 'navigation', 'form_detection', 'filling', 'submission'
    [key: string]: any; // Campos adicionais
  };
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
}
```

### Exemplo

```json
{
  "timestamp": "2026-02-04T14:30:00.123Z",
  "level": "info",
  "message": "Browser launched successfully",
  "context": {
    "applicationId": "app_1643980900_b4e1",
    "jobId": "job_1643980800_a3f2",
    "company": "Google Brasil",
    "step": "browser_launch",
    "headless": true,
    "browserVersion": "Chromium 110.0.5481.65"
  }
}
```

```json
{
  "timestamp": "2026-02-04T14:30:45.789Z",
  "level": "warn",
  "message": "Fill rate below threshold, skipping submission",
  "context": {
    "applicationId": "app_1643980900_b4e1",
    "jobId": "job_1643980800_a3f2",
    "company": "Google Brasil",
    "step": "decision",
    "fillRate": 45,
    "threshold": 50,
    "fieldsDetected": 12,
    "fieldsFilled": 5
  }
}
```

```json
{
  "timestamp": "2026-02-04T14:32:00.456Z",
  "level": "error",
  "message": "Captcha timeout exceeded",
  "context": {
    "applicationId": "app_1643980900_b4e1",
    "jobId": "job_1643980800_a3f2",
    "company": "Google Brasil",
    "step": "captcha_detection",
    "captchaType": "recaptcha",
    "timeout": 120000
  },
  "error": {
    "message": "Captcha not solved within 120s",
    "code": "CAPTCHA_TIMEOUT"
  }
}
```

---

## Validações

### Validação de Entrada (Zod Schemas)

**Vaga Input:**
```typescript
const JobSchema = z.object({
  id: z.string().regex(/^job_\d+_[a-z0-9]+$/),
  title: z.string().min(1).max(200),
  url: z.string().url().includes('linkedin.com'),
  company: z.string().min(1).max(100),
  location: z.string().min(1),
  score: z.number().min(0).max(100),
  dateCollected: z.string().datetime(),
  type: z.string(),
  attempts: z.number().min(0).max(3).default(0),
  status: z.enum(['pending', 'success', 'failed', 'skipped']).default('pending')
});
```

**Application Result:**
```typescript
const ApplicationResultSchema = z.object({
  status: z.enum(['success', 'failed', 'skipped']),
  fillRate: z.number().min(0).max(100),
  fieldsDetected: z.number().min(0),
  fieldsFilled: z.number().min(0),
  ragUsed: z.boolean(),
  ragMatches: z.number().min(0).optional(),
  captchaDetected: z.boolean(),
  captchaResolved: z.boolean().optional(),
  executionTime: z.number().min(0),
  error: z.string().optional(),
  errorType: z.enum(['captcha', 'network', 'timeout', 'form_not_found', 'validation', 'rate_limit', 'login_failed']).optional()
});
```

### Validação de Saída (antes de gravar no Sheets)

**Verificações:**
- IDs únicos (não duplicar)
- Timestamps válidos (não futuro)
- Fill rate coerente (fieldsFilled <= fieldsDetected)
- Status válido (enum)
- URLs bem formadas

**Implementação:**
```typescript
function validateBeforeWrite(data: ApplicationResult): void {
  const result = ApplicationResultSchema.safeParse(data);
  if (!result.success) {
    logger.error('Validation failed', { errors: result.error.errors });
    throw new Error('Invalid data');
  }
  
  // Custom validations
  if (data.fieldsFilled > data.fieldsDetected) {
    throw new Error('fieldsFilled cannot exceed fieldsDetected');
  }
  
  if (data.fillRate !== (data.fieldsFilled / data.fieldsDetected * 100)) {
    throw new Error('fillRate calculation mismatch');
  }
}
```

---

## Índices e Performance

### Google Sheets Performance

**Limitações:**
- API quota: 500 requests/100s/user
- Max 40.000 append operations/day
- Latência: ~200-500ms por request

**Otimizações:**

1. **Batch Operations:** Usar `batchUpdate` ao invés de múltiplos `update`
   ```typescript
   await sheets.spreadsheets.values.batchUpdate({
     spreadsheetId,
     requestBody: {
       data: [
         { range: 'Vagas!J2', values: [[attempts + 1]] },
         { range: 'Vagas!K2', values: [[new Date().toISOString()]] }
       ],
       valueInputOption: 'RAW'
     }
   });
   ```

2. **Caching:** Cachear leitura de Config (TTL 1 hora)
   ```typescript
   const configCache = new Map<string, { value: any, expiry: number }>();
   ```

3. **Append Only:** Nunca deletar, apenas adicionar novas linhas
   - Aba Candidaturas usa apenas `append`
   - Aba Vagas usa `update` apenas para Tentativas/Status

4. **Índices Virtuais:** Manter Map em memória de VagaID → Row Number
   ```typescript
   const vagaIndex = new Map<string, number>(); // jobId → row
   ```

### Migração Futura para SQL

Quando atingir limites do Sheets (~10k candidaturas):

**Schema PostgreSQL:**
```sql
CREATE TABLE jobs (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  url TEXT NOT NULL,
  company VARCHAR(100) NOT NULL,
  location VARCHAR(100),
  score INT CHECK (score >= 0 AND score <= 100),
  date_collected TIMESTAMP NOT NULL,
  type VARCHAR(50),
  attempts INT DEFAULT 0,
  last_attempt TIMESTAMP,
  status VARCHAR(20) CHECK (status IN ('pending', 'success', 'failed', 'skipped')),
  observations TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE applications (
  id VARCHAR(50) PRIMARY KEY,
  job_id VARCHAR(50) REFERENCES jobs(id),
  status VARCHAR(20) NOT NULL,
  date_applied TIMESTAMP NOT NULL,
  attempt_number INT NOT NULL,
  fields_detected INT NOT NULL,
  fields_filled INT NOT NULL,
  fill_rate DECIMAL(5,2) NOT NULL,
  rag_used BOOLEAN NOT NULL,
  rag_matches INT,
  form_type VARCHAR(50),
  captcha_detected BOOLEAN NOT NULL,
  captcha_resolved BOOLEAN,
  execution_time INT NOT NULL,
  error TEXT,
  error_type VARCHAR(50),
  log_url TEXT,
  user_agent TEXT,
  browser_version VARCHAR(50),
  observations TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_score ON jobs(score);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_job_id ON applications(job_id);
```

---

## Backup e Recovery

### Estratégia de Backup

1. **Google Sheets Native:**
   - Histórico automático de 30 dias (Google Drive)
   - Restore via "Ver histórico de versões"

2. **Export Periódico:**
   - n8n workflow para export diário para CSV
   - Armazenar em S3/Google Cloud Storage
   - Formato: `backups/{date}/vagas.csv`, `backups/{date}/candidaturas.csv`

3. **Database Snapshots (se migrar para SQL):**
   - Backup diário automático
   - Retention: 30 dias
   - Teste de restore semanal

### Recovery Plan

**Cenário 1: Dados corrompidos**
- Restore do último backup (CSV)
- Re-import para Sheets via script

**Cenário 2: Acidentalmente deletou linhas**
- Usar histórico de versões do Google Sheets
- Restore para timestamp anterior

**Cenário 3: Perda total da planilha**
- Criar nova planilha
- Importar do último CSV backup
- Atualizar spreadsheetId nos configs

---

**Status:** ✅ Schema Completo  
**Próximo:** Implementar validações Zod + integração Sheets API
