# 🏗️ ARCHITECTURE - LinkedIn Assistant

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    LinkedIn Assistant                        │
└─────────────────────────────────────────────────────────────┘

         Google Sheets
         ┌──────────────┐
         │ Vagas        │ (in)  ← n8n collects jobs
         │ Candidaturas │ (out) ← Our system writes
         └──────────────┘
              ▲
              │
         ┌────┴──────────────────────────────┐
         │                                    │
      ┌──▼──┐                          ┌─────▼──┐
      │ n8n │◄──── Trigger Webhook ────│ Node.js│
      │ +   │                          │  RPA   │
      │ Job │                          │ Engine │
      │Collector                       └───┬────┘
      └─────┘                              │
                                           │
                                    ┌──────▼───────┐
                                    │  Playwright  │
                                    │  Browser     │
                                    │  (Headless)  │
                                    └──────┬───────┘
                                           │
                                      LinkedIn.com
                                      (Job Pages)
```

## Component Architecture

### 1. Data Layer
- **Google Sheets API** - Source of truth for jobs
- **Local SQLite** (optional) - Logs & retry queue
- **Environment Variables** - Secrets management

### 2. Orchestration Layer (n8n)
```json
{
  "name": "Job Collector + Trigger",
  "steps": [
    "Scrape LinkedIn jobs → Sheets",
    "Webhook: POST to http://localhost:3000/apply",
    "Receive: { jobIds: [...] }",
    "Workflow ends"
  ]
}
```

### 3. Automation Engine (Node.js + Playwright)

#### Module Structure
```
src/
├── automation/
│   ├── browser.ts          # Browser session management
│   ├── candidature.ts      # Main application flow
│   ├── form-detector.ts    # Detect & analyze forms
│   ├── form-filler.ts      # Fill forms intelligently
│   └── handlers/
│       ├── login.ts        # LinkedIn login
│       └── captcha.ts      # Captcha handling (if needed)
│
├── integration/
│   ├── sheets.ts           # Google Sheets API
│   └── n8n.ts              # n8n webhook integration
│
├── logger/
│   └── index.ts            # Pino logger setup
│
├── types/
│   ├── index.ts            # Global types
│   └── forms.ts            # Form-related types
│
├── utils/
│   ├── retry.ts            # Retry logic
│   ├── delay.ts            # Rate limiting
│   └── validators.ts       # Input validation
│
└── index.ts                # Main entry
```

## Data Flow: Application Process

```
1. n8n Triggers (POST /apply)
   ├─ Payload: { jobIds: [123, 456] }
   └─ Auth: API Key header

2. Node.js receives & validates
   ├─ Check rate limit (max 50/day)
   ├─ Get job details from Sheets
   └─ Queue for processing

3. For each job:
   ├─ Launch browser (Playwright)
   ├─ Navigate to job link
   ├─ Detect form fields
   ├─ Fill fields (auto or manual)
   ├─ Submit application
   └─ Log result to Sheets

4. Update Sheets
   ├─ Status: ✅ Applied / ⚠️ Failed / ⏳ Pending
   ├─ Timestamp
   ├─ Error message (if failed)
   └─ Retry count

5. Return to n8n (optional webhook)
   └─ Summary: { applied: 10, failed: 2, pending: 1 }
```

## Error Handling Strategy

```
┌──────────────────────────┐
│   Application Attempt    │
└────────────┬─────────────┘
             │
      ┌──────▼────────┐
      │  Success?     │
      └──┬────────┬───┘
         │        │
        YES      NO
         │        │
         ▼        └─────────┐
      Update         ┌──────▼──────┐
      Sheets ✅      │ Retriable?  │
                     └──┬────────┬─┘
                        │        │
                       YES      NO
                        │        │
         ┌──────────────┘        │
         │                       │
         ▼                       ▼
    Queue Retry     Log Error & Skip
    (exponential   (Manual Review)
    backoff)
```

**Retry Logic:**
- Max 3 attempts per job
- Exponential backoff: 5s → 30s → 2min
- Only retry on network/timeout errors
- Skip on validation/form errors

## Security Architecture

```
┌──────────────────────────────────────┐
│     GitHub Secrets Management        │
├──────────────────────────────────────┤
│ LINKEDIN_EMAIL                       │
│ LINKEDIN_PASSWORD                    │
│ GOOGLE_SHEETS_API_KEY                │
│ N8N_API_KEY                          │
└──────────────┬───────────────────────┘
               │
         ┌─────▼──────────┐
         │  Environment   │
         │  Variables     │
         │  (dotenv)      │
         └────────────────┘
               │
         ┌─────▼──────────────────┐
         │  Application Runtime   │
         │  (Never logs secrets)  │
         └────────────────────────┘
```

## Deployment Architecture

```
GitHub (Main Branch)
    ↓
GitHub Actions (CI/CD)
    ├─ Lint + Type Check
    ├─ Unit Tests
    ├─ Build TypeScript
    └─ E2E Tests (Playwright)
    ↓ (if all pass)
Production Deployment
    ├─ Server runs Node.js app
    ├─ Listens on :3000/apply
    └─ Connects to Google Sheets
```

## Database/Persistence Layer

### Google Sheets Schema

**Tab: "Vagas" (from n8n)**
| ID | Título | Link | Empresa | Salário | Localização | Skills | Data |
|----|--------|------|---------|---------|-------------|--------|------|

**Tab: "Candidaturas" (NEW - ours)**
| ID | VagaID | DataAplicacao | Status | Tentativas | ErrorMsg | ReviewURL |
|----|--------|---------------|--------|------------|----------|-----------|

### Optional: Local SQLite (for detailed logging)
```sql
CREATE TABLE applications (
  id INTEGER PRIMARY KEY,
  job_id INTEGER,
  status VARCHAR(50),
  applied_at TIMESTAMP,
  form_data JSON,
  error_log TEXT,
  retry_count INTEGER,
  created_at TIMESTAMP
);

CREATE TABLE logs (
  id INTEGER PRIMARY KEY,
  timestamp TIMESTAMP,
  level VARCHAR(20),
  message TEXT,
  context JSON
);
```

## Performance Considerations

| Aspect | Strategy | Limit |
|--------|----------|-------|
| **Concurrent applications** | Sequential (1 at a time) | 1 browser |
| **Applications per day** | Rate limit | 50/day |
| **Form fill time** | With delays | 5-10s per form |
| **Browser timeout** | Configurable | 30s per page |
| **Memory** | Session cleanup | ~200MB base |

## Third-Party Integrations

### Google Sheets API
- **Authentication**: Service account (JSON key) or OAuth
- **Scope**: Read jobs, write candidature records
- **Rate Limit**: 300 req/min per project
- **Fallback**: Local CSV if API fails

### LinkedIn
- **Method**: Browser automation (Playwright)
- **No official API**: Due to ToS restrictions
- **Risk**: Account ban if too aggressive
- **Mitigation**: Delays, User-Agent rotation, rate limiting

### n8n
- **Webhook**: Trigger via POST
- **Auth**: API Key in header
- **Payload**: Job IDs to process
- **Response**: Application summary

---

## Technology Rationale

| Choice | Why |
|--------|-----|
| **TypeScript** | Type safety, better IDE support, fewer bugs |
| **Playwright** | Browser automation, supports headless, testable |
| **n8n** | Already in use, integrates Sheets, low-code |
| **Pino** | Structured logging, performance, JSON output |
| **Vitest** | Fast, modern test framework, ESM support |
| **GitHub Actions** | Built-in, free, no additional infrastructure |

---

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| LinkedIn detects bot | Account ban | Rate limiting, delays, user-agent rotation |
| Form structure changes | Automation breaks | Robust selectors, fallback to manual |
| Captcha required | Can't proceed | Manual intervention or captcha service |
| API rate limit hit | Delays | Queue system, backoff strategy |
| Credentials exposed | Security breach | GitHub Secrets, never log sensitive data |

---

## Future Enhancements

- 🤖 AI-powered form responses (LLM integration)
- 📧 Email notifications on application results
- 📊 Dashboard with analytics (Grafana?)
- 🔄 Webhook callbacks to n8n
- 💾 Advanced logging with ELK stack
- 🌐 Multi-region deployment
