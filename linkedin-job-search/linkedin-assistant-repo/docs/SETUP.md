# 🚀 Setup & Installation - LinkedIn Assistant

## Pré-requisitos

### Sistema
- Node.js 18+ ([Download](https://nodejs.org/))
- npm ou yarn
- Git
- Windows 10+ / macOS / Linux

### Contas Necessárias
- ✅ LinkedIn (para automação)
- ✅ Google Cloud (para Sheets API)
- ✅ n8n (self-hosted ou cloud)
- ✅ GitHub (para versionamento)

---

## 1️⃣ Setup Local

### Passo 1: Clonar Repositório

```bash
git clone https://github.com/diegosantos-ai/linkedin-assistant.git
cd linkedin-assistant
```

### Passo 2: Instalar Dependências

```bash
npm install
# ou
yarn install
```

### Passo 3: Configurar Variáveis de Ambiente

```bash
# Copiar template
cp .env.example .env

# Editar .env com suas credenciais (use VSCode ou editor)
# Não commitar este arquivo!
```

**Conteúdo do `.env`:**
```bash
# LinkedIn Credentials
LINKEDIN_EMAIL=seu-email@gmail.com
LINKEDIN_PASSWORD=sua-senha-aqui

# Google Sheets API
GOOGLE_SHEETS_API_KEY=xxx-yyy-zzz-aqui
GOOGLE_SHEETS_ID=1MCNDC7hyUzSZAcMD_Qi9dO28sbACNN9Nl1lygJxVlCk
GOOGLE_SHEETS_JOBS_SHEET=Vagas
GOOGLE_SHEETS_APPLICATIONS_SHEET=Candidaturas

# n8n
N8N_WEBHOOK_URL=https://seu-n8n-instance.com/webhook/apply
N8N_API_KEY=seu-api-key

# App Config
NODE_ENV=development
LOG_LEVEL=debug
MAX_APPLICATIONS_PER_DAY=5
HEADLESS=false
```

### Passo 4: Compilar TypeScript

```bash
npm run build
# Gera pasta dist/
```

---

## 2️⃣ Configurar Google Sheets API

### A. Criar Projeto no Google Cloud

1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Crie novo projeto: **Name:** "linkedin-assistant"
3. Ative APIs:
   - Google Sheets API
   - Google Drive API

### B. Criar Service Account

1. **Credentials** → **Create Credentials** → **Service Account**
2. **Name:** "linkedin-assistant-bot"
3. **Grant roles:**
   - Editor (para acesso completo)
4. Crie chave JSON:
   - **Keys** → **Create New Key** → **JSON**
   - Download arquivo `credentials.json`

### C. Compartilhar Google Sheet com Service Account

1. Copie o email da service account (tipo: `xxx@yyy.iam.gserviceaccount.com`)
2. Abra seu Google Sheet
3. Compartilhe com esse email (com permissão de Editor)

### D. Adicionar ao .env

```bash
# No .env, adicione:
GOOGLE_CREDENTIALS_PATH=./credentials.json
GOOGLE_SHEETS_ID=YOUR_SPREADSHEET_ID
```

---

## 3️⃣ Configurar n8n

### A. Importar Workflows

1. Abra n8n (local ou cloud)
2. **Workflows** → **Import**
3. Selecione arquivo JSON:
   - `workflows/collect-jobs.v1.0.json`

### B. Configurar Credenciais no n8n

Para cada node que usa API:

1. **Google Drive:**
   - Conecte sua conta Google
   
2. **Google Sheets:**
   - Selecione service account ou use OAuth
   
3. **Telegram (opcional):**
   - Crie bot no BotFather
   - Adicione token ao n8n

### C. Testar Workflow

1. Clique em "Test workflow"
2. Verifique se dados aparecem no Google Sheet
3. Debug se necessário

---

## 4️⃣ Desenvolvimento Local

### Rodar em Modo Watch (desenvolvimento)

```bash
npm run dev
# Recompila automaticamente quando você salva arquivos
```

### Rodar testes

```bash
# Testes unitários
npm run test

# Testes com coverage
npm run test:unit

# Testes E2E (Playwright)
npm run test:e2e
# ⚠️ Pode levar tempo (cria browser real)
```

### Linting & Formatting

```bash
# Verificar erros de lint
npm run lint

# Corrigir erros automaticamente
npm run lint:fix

# Formatar código
npm run format
```

### Type Check

```bash
npm run type-check
# Verifica tipos TypeScript sem compilar
```

---

## 5️⃣ Estrutura de Branches (Git Workflow)

### Criar nova feature

```bash
# Atualizar main
git checkout main
git pull origin main

# Criar branch temática
git checkout -b feature/automation-core

# Desenvolver...
git add src/automation/
git commit -m "feat(automation): implement core automation loop"
git push -u origin feature/automation-core

# Abrir PR no GitHub
# (Esperar review & merge)

# Após merge, limpar
git checkout develop && git pull
git branch -d feature/automation-core
```

### Padrão de commits

```bash
git commit -m "feat(automation): add form detection"
git commit -m "fix(rag): improve similarity matching"
git commit -m "test(e2e): add captcha detection test"
git commit -m "docs(setup): add installation guide"
git commit -m "refactor(browser): simplify session management"
```

---

## 6️⃣ Scripts Úteis

### Desenvolvimento

```bash
npm run dev              # Watch mode
npm run build           # Compilar
npm start              # Rodar aplicação
```

### Testes

```bash
npm test               # Todos os testes
npm run test:unit      # Só unitários
npm run test:e2e       # Só E2E
```

### Qualidade

```bash
npm run lint           # Verificar
npm run lint:fix       # Corrigir
npm run format         # Prettier
npm run type-check     # TypeScript check
```

---

## 7️⃣ Troubleshooting

### "Cannot find module '@google-cloud/sheets'"

```bash
npm install @google-cloud/sheets
# ou reinstale tudo:
rm -rf node_modules package-lock.json
npm install
```

### "Playwright binary not found"

```bash
npx playwright install
# Instala navegadores necessários
```

### "GOOGLE_SHEETS_API_KEY is undefined"

```bash
# Verificar se .env foi criado
ls .env
# Se não existir:
cp .env.example .env
# Editar .env e adicionar valores reais
```

### "Port 3000 already in use"

```bash
# Mudar porta no .env:
PORT=3001
# Ou matar processo
lsof -ti:3000 | xargs kill -9  # macOS/Linux
netstat -ano | findstr :3000   # Windows
```

### "LinkedIn login fails"

```bash
# Possíveis razões:
# 1. Credenciais incorretas → verificar .env
# 2. Conta bloqueada → desbloquear em LinkedIn
# 3. 2FA ativado → desativar temporariamente ou adicionar handler
# 4. IP suspeito → conectar de VPN confiável
```

### "Testes falham no CI/CD"

```bash
# Debug local:
npm run test:unit -- --reporter=verbose
npm run test:e2e -- --debug

# Se passar localmente mas falhar no GitHub Actions:
# → Pode ser diferença de ambiente (Node.js version, etc)
# → Verificar .github/workflows/ci-cd.yml
```

---

## 8️⃣ Primeiro Teste End-to-End

### Teste Simples de Login

```bash
npm run dev

# Em outro terminal:
# Criar arquivo: test-login.ts
```

```typescript
import { launchBrowser } from './src/automation/browser';
import { loginLinkedIn } from './src/automation/handlers/login';

async function test() {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  await loginLinkedIn(page, {
    email: process.env.LINKEDIN_EMAIL!,
    password: process.env.LINKEDIN_PASSWORD!,
  });
  
  console.log('✅ Login successful!');
  await browser.close();
}

test().catch(console.error);
```

```bash
npx tsx test-login.ts
```

---

## 9️⃣ Deploy em Produção

### Local Deployment

```bash
# Build otimizado
npm run build

# Rodar
npm start

# Com logs estruturados
NODE_ENV=production npm start
```

### Cloud Deployment (Exemplo: Heroku)

```bash
heroku create linkedin-assistant
heroku config:set LINKEDIN_EMAIL=xxx
heroku config:set LINKEDIN_PASSWORD=xxx
# ... etc para todos os env vars

git push heroku main
heroku logs --tail
```

### Docker (Futuro)

```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY dist ./dist
CMD ["npm", "start"]
```

```bash
docker build -t linkedin-assistant .
docker run -e LINKEDIN_EMAIL=xxx linkedin-assistant
```

---

## 🔟 Próximas Etapas

Após setup:

1. ✅ [x] Instalar dependências
2. ✅ [x] Configurar .env
3. ✅ [x] Setup Google Sheets API
4. ✅ [x] Importar workflow n8n
5. ⏳ Próximo: Implementar automação (Phase 4)
6. ⏳ Depois: Testes & CI/CD
7. ⏳ Final: Deploy produção

---

## 📞 Suporte

**Problemas?**
- Verifique [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- Abra issue no GitHub
- Consulte logs: `cat logs/*.json`

**Documentação:**
- [ARCHITECTURE.md](ARCHITECTURE.md) - Design
- [SECURITY.md](SECURITY.md) - Segurança
- [N8N_WORKFLOWS.md](N8N_WORKFLOWS.md) - Workflows n8n
