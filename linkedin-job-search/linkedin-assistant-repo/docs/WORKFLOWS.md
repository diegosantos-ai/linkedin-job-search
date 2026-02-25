# 🔄 Workflow Specifications - LinkedIn Assistant

> **Document:** Especificação detalhada de fluxos (sucesso, falha, retry)  
> **Phase:** 2 (PLANNING)  
> **Last Updated:** 2026-02-04

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [State Machine Principal](#state-machine-principal)
- [Fluxo de Sucesso](#fluxo-de-sucesso)
- [Fluxos de Falha](#fluxos-de-falha)
- [Estratégias de Retry](#estratégias-de-retry)
- [Casos Especiais](#casos-especiais)
- [Decisões Críticas](#decisões-críticas)

---

## Visão Geral

O LinkedIn Assistant implementa uma **state machine** complexa para lidar com todos os cenários possíveis durante a candidatura. Cada estado tem transições bem definidas e ações associadas.

---

## State Machine Principal

```
┌──────────────┐
│   PENDING    │ ◄─── Estado inicial (vaga elegível)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ INITIALIZING │ ◄─── Launch browser, setup
└──────┬───────┘
       │
       ├─────► [ERROR] Browser launch failed ──► FAILED (retry se < maxRetries)
       │
       ▼
┌──────────────┐
│   LOGGING_IN │ ◄─── Autenticação LinkedIn
└──────┬───────┘
       │
       ├─────► [SUCCESS] Já logado ──────────┐
       ├─────► [SUCCESS] Login OK ───────────┤
       ├─────► [ERROR] Credenciais inválidas ──► FAILED (não retry)
       ├─────► [ERROR] 2FA requerido ────────────► FAILED (manual)
       │                                       │
       ▼                                       │
┌──────────────┐                              │
│  NAVIGATING  │ ◄────────────────────────────┘
│  TO JOB PAGE │
└──────┬───────┘
       │
       ├─────► [ERROR] 404 Not Found ──────────────► FAILED (não retry)
       ├─────► [ERROR] Page timeout ───────────────► FAILED (retry)
       ├─────► [SUCCESS] Job page loaded ──────────┐
       │                                            │
       ▼                                            │
┌──────────────┐                                   │
│   CHECKING   │ ◄─────────────────────────────────┘
│   CAPTCHA    │
└──────┬───────┘
       │
       ├─────► [NO CAPTCHA] ─────────────────────┐
       ├─────► [CAPTCHA DETECTED] ───┐           │
       │                              │           │
       ▼                              ▼           │
┌──────────────┐           ┌──────────────┐      │
│   WAITING    │           │  CAPTCHA     │      │
│   CAPTCHA    │           │  RESOLVED    │      │
│  RESOLUTION  │           │              │      │
└──────┬───────┘           └──────┬───────┘      │
       │                          │               │
       ├─► [TIMEOUT] ──► FAILED   │               │
       │                          │               │
       └──────────────────────────┴───────────────┘
                                  │
                                  ▼
                        ┌──────────────┐
                        │   CLICKING   │
                        │  "APPLY BTN" │
                        └──────┬───────┘
                               │
       ┌───────────────────────┼───────────────────────┐
       │                       │                       │
       ▼                       ▼                       ▼
[Easy Apply Modal]    [External Site]        [Already Applied]
       │                       │                       │
       ▼                       ▼                       ▼
┌──────────────┐      ┌──────────────┐       ┌──────────────┐
│  DETECTING   │      │   SKIPPING   │       │   SKIPPING   │
│     FORM     │      │  (External)  │       │  (Duplicate) │
└──────┬───────┘      └──────┬───────┘       └──────┬───────┘
       │                     │                      │
       │                     ├──────────────────────┘
       │                     │
       ▼                     ▼
┌──────────────┐      ┌──────────────┐
│   FILLING    │      │   SKIPPED    │ ◄─── Estado final
│     FORM     │      └──────────────┘
└──────┬───────┘
       │
       ├─────► [Fill Rate < 50%] ──────► SKIPPED
       ├─────► [Required fields empty] ─► SKIPPED
       │
       ▼
┌──────────────┐
│  SUBMITTING  │
└──────┬───────┘
       │
       ├─────► [SUCCESS] Submitted ──────► SUCCESS ◄─── Estado final
       ├─────► [ERROR] Validation error ─► FAILED (retry)
       ├─────► [ERROR] Network error ────► FAILED (retry)
       │
       ▼
┌──────────────┐
│   SUCCESS    │ ◄─── Estado final
└──────────────┘
```

---

## Fluxo de Sucesso

### Cenário: Aplicação Completa (Happy Path)

**Pré-condições:**
- Vaga elegível (Score >= 70, Brasil, < 3 tentativas)
- LinkedIn acessível
- Credenciais válidas
- Sem captcha (ou captcha resolvido)
- Formulário Easy Apply
- Fill rate >= 50%

**Sequência de Estados:**

```
1. PENDING
   └─► Action: n8n triggers automation with job data

2. INITIALIZING
   └─► Action: Launch Playwright browser
   └─► Log: "Browser launched (Chromium 110.0, headless=true)"
   └─► Duration: ~2-3s

3. LOGGING_IN
   └─► Action: Check if already logged (cookies)
   └─► If not: Fill email/password + submit
   └─► Log: "Login successful"
   └─► Duration: ~3-5s (cached) ou ~8-10s (fresh login)

4. NAVIGATING
   └─► Action: page.goto(jobUrl)
   └─► Wait: networkidle
   └─► Log: "Job page loaded (Google Brasil - Engenheiro de Dados)"
   └─► Duration: ~2-4s

5. CHECKING_CAPTCHA
   └─► Action: Search for captcha elements (iframe[src*=recaptcha])
   └─► Result: Not detected
   └─► Log: "No captcha detected"
   └─► Duration: ~0.5s

6. CLICKING_APPLY_BUTTON
   └─► Action: Click button containing "Candidatar-se"
   └─► Wait: Modal appears
   └─► Log: "Easy Apply modal opened"
   └─► Duration: ~1-2s

7. DETECTING_FORM
   └─► Action: Scan for inputs, selects, textareas
   └─► Result: Found 12 fields (8 required)
   └─► Log: "Form detected: 12 fields (8 required)"
   └─► Duration: ~1s

8. FILLING_FORM
   └─► Action: For each field:
       - Match label with RAG DB
       - If match found → fill with answer
       - Else if known field (email, phone) → fill with real data
       - Apply typing delays (50-150ms/char)
   └─► Result: 10/12 filled (83.33%)
   └─► Log: "Form filled: 10/12 (83.33%), RAG matches: 5"
   └─► Duration: ~15-25s (depends on fields)

9. SUBMITTING
   └─► Action: Click submit button
   └─► Wait: Success message or redirect
   └─► Log: "Form submitted successfully"
   └─► Duration: ~2-3s

10. SUCCESS
    └─► Action: 
        - Close browser
        - Write to Sheets (aba Candidaturas)
        - Update Vagas (Tentativas++, Status=success)
    └─► Log: "Application complete (total: 45s)"
    └─► Final state
```

**Dados Registrados:**
```json
{
  "id": "app_1643980900_b4e1",
  "jobId": "job_1643980800_a3f2",
  "status": "success",
  "fillRate": 83.33,
  "fieldsDetected": 12,
  "fieldsFilled": 10,
  "ragUsed": true,
  "ragMatches": 5,
  "captchaDetected": false,
  "executionTime": 45
}
```

---

## Fluxos de Falha

### 1. Captcha Não Resolvido

**Trigger:** Captcha detectado e não resolvido dentro do timeout.

```
CHECKING_CAPTCHA
   └─► Captcha detected (type: recaptcha)
   └─► Log: "Captcha detected, waiting for manual resolution..."
   
WAITING_CAPTCHA_RESOLUTION
   └─► Wait up to 120s
   └─► Check every 5s if captcha iframe gone
   └─► Timeout reached
   └─► Log: "Captcha timeout after 120s"
   
FAILED
   └─► Error: "Captcha not solved within timeout"
   └─► ErrorType: "captcha"
   └─► Action: Close browser, write to Sheets
   └─► Retry: YES (if attempts < 3)
```

**Dados Registrados:**
```json
{
  "id": "app_1643980900_b4e1",
  "jobId": "job_1643980800_a3f2",
  "status": "failed",
  "captchaDetected": true,
  "captchaResolved": false,
  "error": "Captcha not solved within 120s",
  "errorType": "captcha",
  "executionTime": 125
}
```

**Retry Strategy:** 
- Próxima tentativa: +30min (evitar rate limiting)
- Max 3 tentativas
- Se ainda falhar → marcar vaga como "failed" permanentemente

---

### 2. Formulário Não Detectado

**Trigger:** Após clicar "Candidatar-se", não encontra campos de formulário.

```
CLICKING_APPLY_BUTTON
   └─► Click successful
   └─► Wait for modal (timeout: 10s)
   └─► Modal not appeared
   └─► Log: "Apply button clicked but no modal"
   
DETECTING_FORM
   └─► Scan for form elements
   └─► No inputs/selects/textareas found
   └─► Log: "Form not detected on page"
   
FAILED
   └─► Error: "Form not found after clicking apply"
   └─► ErrorType: "form_not_found"
   └─► Screenshot saved: form_not_found_{jobId}.png
   └─► Retry: YES
```

**Possíveis Causas:**
- Vaga expirou / foi removida
- LinkedIn mudou seletores
- Redirect para site externo
- JavaScript não carregou

**Retry Strategy:**
- Imediata (1 tentativa)
- Se falhar novamente → aguardar 1 hora
- Max 3 tentativas

---

### 3. Fill Rate Baixo (< 50%)

**Trigger:** Formulário detectado mas poucos campos preenchidos.

```
FILLING_FORM
   └─► 12 fields detected
   └─► Only 5 filled (41.67%)
   └─► Log: "Fill rate below threshold (41.67% < 50%)"
   
SKIPPED
   └─► Status: "skipped"
   └─► Reason: "Fill rate too low"
   └─► Action: Do not submit, close browser
   └─► Retry: NO (não retryable)
```

**Dados Registrados:**
```json
{
  "id": "app_1643980900_b4e1",
  "jobId": "job_1643980800_a3f2",
  "status": "skipped",
  "fillRate": 41.67,
  "fieldsDetected": 12,
  "fieldsFilled": 5,
  "error": "Fill rate below 50%",
  "errorType": null,
  "executionTime": 30
}
```

**Ação Recomendada:**
- Analisar logs para identificar campos não preenchidos
- Adicionar novas entradas na RAG DB
- Não tentar novamente esta vaga

---

### 4. Network Error / Timeout

**Trigger:** Erro de conexão durante navegação ou submissão.

```
NAVIGATING / SUBMITTING
   └─► Network request failed
   └─► Error: "TimeoutError: Navigation timeout exceeded"
   └─► Log: "Network timeout after 30s"
   
FAILED
   └─► Error: "Navigation timeout"
   └─► ErrorType: "timeout"
   └─► Retry: YES (retryable)
```

**Retry Strategy:**
- Exponential backoff: 1s → 2s → 4s → 8s
- Max 3 retries
- Se persistir → marcar como failed

---

### 5. Login Failed

**Trigger:** Credenciais inválidas ou 2FA requerido.

```
LOGGING_IN
   └─► Fill email/password
   └─► Submit
   └─► Wait for redirect
   └─► Error message: "Email ou senha incorretos"
   └─► Log: "Login failed: invalid credentials"
   
FAILED
   └─► Error: "Login failed"
   └─► ErrorType: "login_failed"
   └─► Retry: NO (non-retryable)
   └─► Alert: Send notification (email/Slack)
```

**Ação Recomendada:**
- Verificar credenciais no .env
- Resolver 2FA manualmente
- Pausar automação até resolver

---

### 6. Já Aplicou Anteriormente

**Trigger:** LinkedIn detecta que já se candidatou a esta vaga.

```
CLICKING_APPLY_BUTTON
   └─► Click
   └─► Message: "Você já se candidatou a esta vaga"
   └─► Log: "Already applied to this job"
   
SKIPPED
   └─► Status: "skipped"
   └─► Reason: "Already applied"
   └─► Retry: NO
```

**Dados Registrados:**
```json
{
  "status": "skipped",
  "error": "Already applied",
  "executionTime": 10
}
```

---

### 7. Site Externo (Não Easy Apply)

**Trigger:** Vaga redireciona para site externo da empresa.

```
CLICKING_APPLY_BUTTON
   └─► Click
   └─► Redirect to external URL (e.g., greenhouse.io, lever.co)
   └─► Log: "External application site detected"
   
SKIPPED
   └─► Status: "skipped"
   └─► Reason: "External site"
   └─► Form Type: "External"
   └─► Retry: NO
```

**Solução Futura:**
- Implementar suporte para sites externos comuns (Greenhouse, Lever, Workday)
- Por ora: skip

---

### 8. Rate Limit Atingido

**Trigger:** Limite diário/horário de candidaturas atingido.

```
PENDING
   └─► Check rate limiter
   └─► Daily count: 50/50
   └─► Log: "Daily application limit reached"
   
SKIPPED
   └─► Status: "skipped"
   └─► Reason: "Rate limit"
   └─► ErrorType: "rate_limit"
   └─► Action: Pause automation for 24h
```

---

## Estratégias de Retry

### Decisão de Retry

```typescript
function shouldRetry(error: Error, attempts: number, maxRetries: number): boolean {
  if (attempts >= maxRetries) return false;
  
  const retryableErrors = [
    'TimeoutError',
    'NetworkError',
    'ECONNREFUSED',
    'ENOTFOUND',
    'ERR_NETWORK'
  ];
  
  const isRetryable = retryableErrors.some(errType => 
    error.message.includes(errType)
  );
  
  return isRetryable;
}
```

### Backoff Exponencial

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      
      if (!shouldRetry(error, attempt, maxRetries)) {
        throw error;
      }
      
      const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s, 8s
      logger.warn(`Retry ${attempt}/${maxRetries} after ${delay}ms`, { error });
      await sleep(delay);
    }
  }
  
  throw new Error(`Max retries (${maxRetries}) exceeded`);
}
```

### Retry Schedule

| Tentativa | Delay | Motivo |
|-----------|-------|--------|
| 1 | 0s | Primeira tentativa (imediata) |
| 2 | 1s | Erro temporário (network) |
| 3 | 2s | Persistente (exponential) |
| 4 | 4s | Último retry |
| - | - | Desiste e marca como failed |

**Exceções:**
- **Captcha:** Retry após 30min (não imediato)
- **Rate Limit:** Retry após 24h (pause automação)
- **Login Failed:** Não retry (requer intervenção)

---

## Casos Especiais

### Multi-Step Forms

**Cenário:** Formulário em várias etapas (wizard).

```
DETECTING_FORM (Step 1)
   └─► Detect fields in current modal
   └─► Fill fields
   └─► Click "Próximo"
   
DETECTING_FORM (Step 2)
   └─► Detect new fields
   └─► Fill fields
   └─► Click "Próximo"
   
DETECTING_FORM (Step N)
   └─► Detect final fields
   └─► Fill fields
   └─► Click "Enviar"
   
SUBMITTING
   └─► Wait for success
```

**Implementação:**
```typescript
let currentStep = 1;
let allFields: FormField[] = [];

while (true) {
  const stepFields = await detectForm(page);
  allFields.push(...stepFields.fields);
  
  await fillForm(page, stepFields.fields, ragDB);
  
  const nextButton = await page.$('button:has-text("Próximo")');
  if (!nextButton) break; // Última etapa
  
  await nextButton.click();
  await page.waitForSelector('form', { timeout: 5000 });
  currentStep++;
}

// Calculate total fill rate
const totalDetected = allFields.length;
const totalFilled = allFields.filter(f => f.value).length;
const fillRate = (totalFilled / totalDetected) * 100;
```

---

### Campos Dinâmicos

**Cenário:** Campos que aparecem condicionalmente (ex: "Tem experiência com X?" → se "Sim" → "Quantos anos?").

```
FILLING_FORM
   └─► Fill checkbox "Tem experiência com Python?" = Yes
   └─► Wait 500ms (campo dinâmico aparecer)
   └─► Re-detect form (buscar novos campos)
   └─► Fill new field "Quantos anos?" = "5 anos"
```

**Implementação:**
```typescript
for (const field of fields) {
  await fillField(page, field);
  
  // Wait for potential dynamic fields
  await page.waitForTimeout(500);
  
  // Re-scan for new fields
  const newFields = await detectForm(page);
  if (newFields.fields.length > fields.length) {
    const dynamicFields = newFields.fields.slice(fields.length);
    logger.info(`Dynamic fields detected: ${dynamicFields.length}`);
    fields.push(...dynamicFields);
  }
}
```

---

### Validação em Tempo Real

**Cenário:** LinkedIn valida campos em tempo real (ex: email inválido).

```
FILLING_FORM
   └─► Fill email field
   └─► Wait 300ms
   └─► Check for error message below field
   └─► If error: Log warning, mark field as failed
```

**Implementação:**
```typescript
async function fillAndValidate(page: Page, field: FormField, value: string) {
  await page.fill(field.selector, value);
  await page.waitForTimeout(300);
  
  const error = await page.$(`${field.selector} + .error-message`);
  if (error) {
    const errorText = await error.textContent();
    logger.warn(`Field validation failed: ${field.label}`, { error: errorText });
    return false;
  }
  
  return true;
}
```

---

## Decisões Críticas

### Submeter ou Não Submeter?

**Decision Tree:**

```
if (fillRate < MIN_FILL_RATE_TO_SUBMIT) {
  return SKIP; // Não submete
}

if (requiredFields.some(f => !f.value)) {
  return SKIP; // Campo obrigatório vazio
}

if (captchaDetected && !captchaResolved) {
  return FAIL; // Captcha não resolvido
}

if (formType === 'EXTERNAL') {
  return SKIP; // Site externo
}

if (alreadyApplied) {
  return SKIP; // Já aplicou
}

return SUBMIT; // Tudo OK, submete!
```

### Thresholds Configuráveis

```typescript
// config/limits.json
{
  "MIN_FILL_RATE_TO_SUBMIT": 50,
  "MIN_REQUIRED_FIELDS_FILLED": 100, // % dos campos required
  "MAX_EXECUTION_TIME": 180000, // 3 min
  "CAPTCHA_TIMEOUT": 120000 // 2 min
}
```

---

## Monitoramento de Estados

### Métricas por Estado

| Estado | Métrica | Target |
|--------|---------|--------|
| SUCCESS | Taxa de sucesso | > 70% |
| SKIPPED | Taxa de skip | < 20% |
| FAILED | Taxa de falha | < 10% |
| CAPTCHA | Frequência | < 5% |
| TIMEOUT | Frequência | < 3% |

### Alertas

**Condições de Alerta:**
- Taxa de falha > 15% (últimas 10 aplicações)
- Taxa de captcha > 10%
- Nenhum sucesso nas últimas 5 tentativas
- Login failed (alerta crítico)

**Ações:**
- Enviar notificação (email/Slack)
- Pausar automação (se crítico)
- Gerar relatório de debug

---

**Status:** ✅ Workflows Especificados  
**Próximo:** Documentar Git workflow e dependências
