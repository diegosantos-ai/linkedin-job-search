# 📦 Dependencies - LinkedIn Assistant

> **Document:** Especificação completa de dependências do projeto  
> **Phase:** 2 (PLANNING)  
> **Last Updated:** 2026-02-04

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Dependências de Produção](#dependências-de-produção)
- [Dependências de Desenvolvimento](#dependências-de-desenvolvimento)
- [Versões Mínimas](#versões-mínimas)
- [Justificativas](#justificativas)
- [Instalação](#instalação)
- [Atualizações](#atualizações)

---

## Visão Geral

O projeto usa **Node.js** com **TypeScript** e um conjunto cuidadosamente selecionado de dependências para automação, logging, validação e integração.

**Princípios:**
- ✅ Minimalismo: apenas o necessário
- ✅ Manutenção ativa: bibliotecas bem mantidas
- ✅ Segurança: sem vulnerabilidades conhecidas
- ✅ Performance: leve e eficiente
- ✅ TypeScript first: boa tipagem

---

## Dependências de Produção

### Automation & Browser

#### `playwright` - v1.40.0+
**Função:** Automação de browser (RPA core)

**Características:**
- Suporta Chromium, Firefox, WebKit
- Headless + headed modes
- Anti-detection capabilities
- Screenshot + recording

**Por quê?**
- ✅ Mais estável que Puppeteer
- ✅ Melhor API para waitForSelector, retry
- ✅ Cross-browser (futuro: testar Firefox)
- ✅ Built-in network interception

**Instalação:**
```bash
npm install playwright
npx playwright install chromium
```

**Bundle size:** ~200MB (browser binaries)

**Alternativas descartadas:**
- ❌ Puppeteer: Menos features, só Chromium
- ❌ Selenium: Mais lento, API complexa
- ❌ Cypress: Focado em testes, não RPA

---

### Data & Validation

#### `zod` - v3.22.0+
**Função:** Schema validation & type inference

**Características:**
- TypeScript-first
- Runtime validation
- Automatic type inference
- Composable schemas

**Por quê?**
- ✅ Type-safe validation
- ✅ Evita runtime errors (dados inválidos)
- ✅ Integração perfeita com TypeScript
- ✅ Zero dependencies

**Uso:**
```typescript
import { z } from 'zod';

const JobSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  url: z.string().url(),
  score: z.number().min(0).max(100)
});

type Job = z.infer<typeof JobSchema>; // Auto-type
```

**Bundle size:** ~60KB

**Alternativas:**
- ❌ Joi: Não TypeScript-first
- ❌ Yup: Menos features
- ❌ class-validator: Requer decorators

---

#### `googleapis` - v126.0.0+
**Função:** Google Sheets API client

**Características:**
- Official Google library
- OAuth 2.0 + Service Account
- Batch operations
- TypeScript types inclusos

**Por quê?**
- ✅ Oficial do Google (confiável)
- ✅ Suporte a todas Google APIs (futuro: Drive, Gmail)
- ✅ Bem documentada
- ✅ Auto-refresh de tokens

**Uso:**
```typescript
import { google } from 'googleapis';

const sheets = google.sheets({ version: 'v4', auth });
await sheets.spreadsheets.values.append({ ... });
```

**Bundle size:** ~2MB (toda suite Google)

**Alternativas:**
- ❌ google-spreadsheet: Menos features
- ❌ gsheets: Não oficial

---

### Logging

#### `pino` - v8.16.0+
**Função:** High-performance JSON logger

**Características:**
- Fastest Node.js logger
- JSON structured logs
- Low overhead (~10x faster que Winston)
- Child loggers (contexto)

**Por quê?**
- ✅ Performance crítica (não bloquear RPA)
- ✅ JSON logs → fácil parse + análise
- ✅ TypeScript support
- ✅ Ecosystem (pino-pretty, pino-cloudwatch)

**Uso:**
```typescript
import pino from 'pino';

const logger = pino({
  level: 'info',
  transport: {
    target: 'pino-pretty'
  }
});

logger.info({ jobId, company }, 'Application started');
```

**Bundle size:** ~50KB

**Alternativas:**
- ❌ Winston: Mais lento (3-10x)
- ❌ Bunyan: Descontinuado
- ❌ console.log: Não estruturado, sem níveis

---

#### `pino-pretty` - v10.2.0+
**Função:** Pretty print logs (desenvolvimento)

**Características:**
- Colorized output
- Human-readable
- Apenas em dev (não em prod)

**Bundle size:** ~30KB

---

### Configuration

#### `dotenv` - v16.3.0+
**Função:** Carregar variáveis de ambiente do .env

**Características:**
- Zero config
- Suporta .env.local, .env.production
- Não sobrescreve env vars existentes

**Por quê?**
- ✅ Standard de facto
- ✅ Simple e confiável
- ✅ Seguro (não comita credenciais)

**Uso:**
```typescript
import 'dotenv/config';

const apiKey = process.env.GOOGLE_API_KEY;
```

**Bundle size:** ~10KB

---

### Utilities

#### `@types/node` - v20.10.0+
**Função:** TypeScript types para Node.js

**Características:**
- Core Node.js types
- Atualizado com cada release Node

**Dev Dependency:** ✅

**Bundle size:** 0 (apenas types)

---

## Dependências de Desenvolvimento

### TypeScript

#### `typescript` - v5.3.0+
**Função:** TypeScript compiler

**Características:**
- Strict mode
- ES2022 target
- Path aliases

**Configuração (tsconfig.json):**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "dist",
    "rootDir": "src",
    "resolveJsonModule": true
  }
}
```

**Bundle size:** N/A (build time only)

---

### Testing

#### `@playwright/test` - v1.40.0+
**Função:** E2E testing framework

**Características:**
- Built-in test runner
- Parallel execution
- Fixtures
- Screenshots + traces

**Por quê?**
- ✅ Integração nativa com Playwright
- ✅ Mais rápido que Jest + Playwright
- ✅ Retry automático
- ✅ Debugging tools

**Uso:**
```typescript
import { test, expect } from '@playwright/test';

test('login flow', async ({ page }) => {
  await page.goto('https://linkedin.com');
  await page.fill('[name=email]', 'test@test.com');
  // ...
});
```

**Bundle size:** Incluso no Playwright

---

#### `vitest` - v1.0.0+
**Função:** Unit test framework (alternativa ao Jest)

**Características:**
- Vite-powered (fast)
- Jest-compatible API
- TypeScript support nativo
- Watch mode

**Por quê?**
- ✅ Muito mais rápido que Jest
- ✅ API familiar
- ✅ Hot reload em watch mode
- ✅ TypeScript sem config adicional

**Uso:**
```typescript
import { describe, it, expect } from 'vitest';

describe('RAG Matcher', () => {
  it('should match similar questions', () => {
    const similarity = jaccardSimilarity(setA, setB);
    expect(similarity).toBeGreaterThan(0.4);
  });
});
```

**Bundle size:** N/A (dev only)

**Alternativa:**
- ❌ Jest: Mais lento, config complexa com TypeScript

---

### Linting & Formatting

#### `eslint` - v8.55.0+
**Função:** Linter JavaScript/TypeScript

**Características:**
- Rule-based
- Auto-fix
- Pluggable

**Config:** Airbnb base + TypeScript

**Instalação:**
```bash
npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

**Bundle size:** N/A (dev only)

---

#### `prettier` - v3.1.0+
**Função:** Code formatter

**Características:**
- Opinionated
- Zero config
- Integração com ESLint

**Configuração (.prettierrc):**
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

**Bundle size:** N/A (dev only)

---

## Versões Mínimas

| Ferramenta | Versão Mínima | Motivo |
|------------|---------------|--------|
| **Node.js** | 18.0.0 | Fetch API nativo, ES2022 support |
| **npm** | 9.0.0 | Package overrides, workspaces |
| **TypeScript** | 5.0.0 | Const type parameters, decorators |
| **Playwright** | 1.40.0 | Latest Chromium 119+ |

**Verificar versões:**
```bash
node --version   # v18.0.0+
npm --version    # 9.0.0+
npx tsc --version # 5.3.0+
```

---

## Justificativas

### Por que Playwright e não Puppeteer?

| Feature | Playwright | Puppeteer |
|---------|------------|-----------|
| Cross-browser | ✅ (Chromium, Firefox, WebKit) | ❌ (só Chromium) |
| Auto-wait | ✅ Built-in | ⚠️ Manual |
| Network interception | ✅ Simples | ⚠️ Complexo |
| Screenshots | ✅ Full page + element | ✅ Similar |
| Manutenção | ✅ Microsoft (ativa) | ✅ Google (ativa) |
| API | ✅ Mais intuitiva | ⚠️ Mais verbosa |

**Decisão:** Playwright vence pela melhor API e cross-browser.

---

### Por que Pino e não Winston?

| Feature | Pino | Winston |
|---------|------|---------|
| Performance | ✅ 10x mais rápido | ❌ Mais lento |
| JSON logs | ✅ Native | ✅ Via config |
| Transports | ✅ Ecosystem | ✅ Built-in |
| TypeScript | ✅ Oficial | ⚠️ @types/winston |
| Learning curve | ✅ Simples | ⚠️ Mais config |

**Decisão:** Pino pela performance crítica em RPA.

**Benchmark:**
```
pino: 10,000 logs in 50ms
winston: 10,000 logs in 450ms
```

---

### Por que Zod e não Joi/Yup?

| Feature | Zod | Joi | Yup |
|---------|-----|-----|-----|
| TypeScript-first | ✅ | ❌ | ⚠️ |
| Type inference | ✅ Auto | ❌ Manual | ⚠️ Parcial |
| Bundle size | 60KB | 150KB | 90KB |
| API | ✅ Moderno | ⚠️ Verboso | ✅ OK |
| Zero deps | ✅ | ❌ | ❌ |

**Decisão:** Zod pela type-safety automática.

---

## Instalação

### Setup Inicial

```bash
# Clone repo
git clone https://github.com/your-repo/linkedin-assistant.git
cd linkedin-assistant

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install chromium

# Setup env vars
cp .env.example .env
# Editar .env com suas credenciais

# Build TypeScript
npm run build

# Run tests
npm test
```

### Instalação por Etapas

**Produção:**
```bash
npm install --production
npx playwright install chromium
```

**Desenvolvimento:**
```bash
npm install
npm run dev
```

---

## Atualizações

### Check for Updates

```bash
npm outdated
```

### Update Strategy

**Patch & Minor:** Auto-update (seguro)
```bash
npm update
```

**Major:** Revisar changelog + testar
```bash
npm install playwright@latest
npm test  # Verificar breaking changes
```

### Dependabot

Configurado em `.github/dependabot.yml`:
```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5
```

**Ações:**
- PRs automáticos toda semana
- Review + merge se CI passa
- Major versions: revisar manualmente

---

## package.json Completo

```json
{
  "name": "linkedin-assistant",
  "version": "1.0.0",
  "description": "Automação de candidaturas LinkedIn",
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "format": "prettier --write \"src/**/*.ts\"",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "playwright": "^1.40.0",
    "zod": "^3.22.0",
    "googleapis": "^126.0.0",
    "pino": "^8.16.0",
    "dotenv": "^16.3.0"
  },
  "devDependencies": {
    "@playwright/test": "^1.40.0",
    "@types/node": "^20.10.0",
    "@typescript-eslint/eslint-plugin": "^6.13.0",
    "@typescript-eslint/parser": "^6.13.0",
    "eslint": "^8.55.0",
    "prettier": "^3.1.0",
    "pino-pretty": "^10.2.0",
    "tsx": "^4.6.0",
    "typescript": "^5.3.0",
    "vitest": "^1.0.0"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
```

---

## Segurança

### Audit

```bash
npm audit
npm audit fix
```

**Política:**
- Zero vulnerabilidades high/critical em produção
- Review manual de vulnerabilidades moderate/low

### Snyk (Opcional)

Integração com Snyk para monitoramento contínuo:
```bash
npm install -g snyk
snyk test
snyk monitor
```

---

## Licenças

Todas as dependências usam licenças permissivas:

| Package | Licença |
|---------|---------|
| playwright | Apache-2.0 |
| zod | MIT |
| googleapis | Apache-2.0 |
| pino | MIT |
| dotenv | BSD-2-Clause |
| typescript | Apache-2.0 |
| eslint | MIT |
| prettier | MIT |

**Conclusão:** ✅ Compatível com uso comercial

---

## Tamanho Total

**node_modules:** ~500MB (com browsers Playwright)

**Breakdown:**
- Playwright browsers: ~200MB
- googleapis: ~100MB
- Resto: ~200MB

**Otimizações:**
- Apenas Chromium (não Firefox/WebKit): -400MB
- Production install: -100MB (sem devDependencies)

---

## Troubleshooting

### Playwright não instala

```bash
# Força reinstalação
npx playwright install --force chromium

# Se permissões:
sudo npx playwright install chromium
```

### TypeScript errors

```bash
# Limpar cache
rm -rf node_modules dist
npm install
npm run build
```

### Google API 401

```bash
# Verificar credenciais
cat .env | grep GOOGLE_SERVICE_ACCOUNT
# Revogar e criar novo service account
```

---

**Status:** ✅ Dependencies Documentadas  
**Próximo:** Revisar todos documentos de Phase 2 e iniciar Phase 3 (SOLUTIONING)
