# 📚 Guia Rápido - Onde Encontrar o Quê

## 🎯 Se você quer...

### Entender o Projeto
- **Começar aqui:** [README.md](README.md)
- **Visão geral:** [TASK.md](TASK.md)
- **Design técnico:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

### Setup & Instalação
- **Guia passo-a-passo:** [docs/SETUP.md](docs/SETUP.md)
- **Troubleshooting:** [docs/SETUP.md#troubleshooting](docs/SETUP.md)
- **Google Sheets setup:** [docs/SETUP.md#2-configurar-google-sheets-api](docs/SETUP.md)

### Entender as Decisões Técnicas
- **Análise detalhada:** [docs/ANALYSIS.md](docs/ANALYSIS.md)
- **Arquitetura:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **Estrutura de pastas:** [docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md)

### Segurança & Credenciais
- **Security guide:** [docs/SECURITY.md](docs/SECURITY.md)
- **Onde não mexer:** [docs/SECURITY.md#1-credentials-management](docs/SECURITY.md)

### Git & Branches
- **Como fazer branches:** [docs/GIT_WORKFLOW.md](docs/GIT_WORKFLOW.md)
- **Padrão de commits:** [docs/GIT_WORKFLOW.md#2-desenvolver--commitar](docs/GIT_WORKFLOW.md)
- **Exemplo completo:** [docs/GIT_WORKFLOW.md#exemplo-completo](docs/GIT_WORKFLOW.md)

### n8n Workflows
- **Como usar workflows:** [workflows/README.md](workflows/README.md)
- **Versionar workflows:** [docs/N8N_WORKFLOWS.md](docs/N8N_WORKFLOWS.md)
- **Histórico de mudanças:** [workflows/CHANGELOG.md](workflows/CHANGELOG.md)

### Escrever Código
- **Tipos globais:** [src/types/index.ts](src/types/index.ts)
- **Logger setup:** [src/logger/index.ts](src/logger/index.ts)
- **Entry point:** [src/index.ts](src/index.ts)

### Configurações
- **Variáveis de ambiente:** [.env.example](.env.example)
- **RAG responses:** [config/rag-database.json](config/rag-database.json)
- **Rate limits:** [config/limits.json](config/limits.json)
- **CSS selectors:** [config/selectors.json](config/selectors.json)

### Testes
- **Estrutura:** [docs/PROJECT_STRUCTURE.md#-estratégia-de-testes](docs/PROJECT_STRUCTURE.md)
- **CI/CD:** [.github/workflows/ci-cd.yml](.github/workflows/ci-cd.yml)

---

## 📁 Estrutura Visual

```
linkedin-assistant/
│
├── 📖 README.md                    ← Comece aqui
├── 🎯 TASK.md                      ← Roadmap completo
│
├── 📂 docs/                        ← Toda documentação
│   ├── SETUP.md                    ← Como instalar
│   ├── ARCHITECTURE.md             ← Design técnico
│   ├── ANALYSIS.md                 ← Decisões técnicas
│   ├── SECURITY.md                 ← Segurança
│   ├── GIT_WORKFLOW.md             ← Como usar Git
│   ├── N8N_WORKFLOWS.md            ← Como usar n8n
│   ├── PROJECT_STRUCTURE.md        ← Pastas & config
│   └── PHASE1_COMPLETE.md          ← Sumário Phase 1
│
├── 📂 src/                         ← Código TypeScript
│   ├── types/                      ← Tipos globais
│   ├── logger/                     ← Pino logger
│   ├── automation/                 ← Core (vazio agora)
│   ├── integration/                ← Integrações (vazio)
│   └── index.ts                    ← Entry point
│
├── ⚙️ config/                       ← Configurações
│   ├── rag-database.json           ← RAG responses
│   ├── limits.json                 ← Rate limiting
│   └── selectors.json              ← CSS selectors
│
├── 🔄 workflows/                   ← n8n workflows
│   ├── README.md                   ← Como usar
│   ├── CHANGELOG.md                ← Histórico
│   └── collect-jobs.v1.0.json      ← Seu workflow
│
├── 🧪 tests/                       ← Testes (estrutura)
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── ⚡ .github/workflows/
│   └── ci-cd.yml                   ← GitHub Actions
│
├── 📦 package.json                 ← Dependências
├── 🔧 tsconfig.json                ← TypeScript
├── .gitignore                      ← O que não commitar
└── .env.example                    ← Template de vars
```

---

## 🚀 Fluxo Típico de Trabalho

### Para Começar Novo Feature

1. **Leia:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
2. **Setup:** [docs/SETUP.md](docs/SETUP.md)
3. **Branch:** [docs/GIT_WORKFLOW.md](docs/GIT_WORKFLOW.md)
4. **Código:** Siga [docs/ANALYSIS.md](docs/ANALYSIS.md) para decisões
5. **Testes:** [docs/PROJECT_STRUCTURE.md#-estratégia-de-testes](docs/PROJECT_STRUCTURE.md)
6. **PR:** Siga [docs/GIT_WORKFLOW.md#3️⃣-push--pr](docs/GIT_WORKFLOW.md)

### Para Entender Decisões

1. **Qual foi a decisão?** → [docs/ANALYSIS.md](docs/ANALYSIS.md)
2. **Como implementar?** → [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
3. **Qual a estrutura?** → [docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md)
4. **É seguro?** → [docs/SECURITY.md](docs/SECURITY.md)

### Para Deployar Mudanças

1. **Branch temática:** [docs/GIT_WORKFLOW.md](docs/GIT_WORKFLOW.md)
2. **Testes passam?** [.github/workflows/ci-cd.yml](.github/workflows/ci-cd.yml)
3. **Secrets OK?** [docs/SECURITY.md](docs/SECURITY.md)
4. **n8n updated?** [docs/N8N_WORKFLOWS.md](docs/N8N_WORKFLOWS.md)
5. **Merge & Deploy**

---

## ✅ Checklist: Primeiro Dia

- [ ] Clonar repo
- [ ] Ler [README.md](README.md)
- [ ] Ler [docs/SETUP.md](docs/SETUP.md)
- [ ] Instalar dependências (`npm install`)
- [ ] Criar `.env`
- [ ] Configurar Google Sheets API
- [ ] Rodar `npm run build` (sem erros?)
- [ ] Verificar Git branches (`git branch -a`)
- [ ] Ler [docs/GIT_WORKFLOW.md](docs/GIT_WORKFLOW.md)

## ⚠️ NÃO ESQUEÇA

- ❌ Nunca commitar `.env` com credenciais reais
- ❌ Nunca expor secrets em logs
- ❌ Nunca mexer em `main` branch direto
- ✅ Sempre fazer PR antes de merge em `develop`
- ✅ Sempre rodar testes antes de push
- ✅ Sempre seguir padrão de commits

---

## 🆘 Precisa de Ajuda?

| Problema | Solução |
|----------|---------|
| "Não sei por onde começar" | Ler [TASK.md](TASK.md) |
| "Como instalar?" | Ver [docs/SETUP.md](docs/SETUP.md) |
| "Qual é a arquitetura?" | Ler [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| "Como fazer branch?" | Seguir [docs/GIT_WORKFLOW.md](docs/GIT_WORKFLOW.md) |
| "Segurança?" | Consultar [docs/SECURITY.md](docs/SECURITY.md) |
| "n8n workflow?" | Ver [workflows/README.md](workflows/README.md) |
| "Erro no setup?" | [docs/SETUP.md#troubleshooting](docs/SETUP.md) |

---

**Última atualização:** 2026-02-04  
**Status:** ✅ Phase 1 Complete  
**Próximo:** Phase 2 (Planning)
