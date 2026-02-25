# 🤖 LinkedIn Assistant

Automatizador inteligente de candidaturas em vagas do LinkedIn.

## 🎯 Features

- ✅ Coleta vagas do LinkedIn
- 🎯 **Automação de candidaturas** (em desenvolvimento)
- 📊 Registro em Google Sheets
- 🔄 Retry automático em falhas
- 📝 Logging estruturado
- 🔐 Gerenciamento seguro de credenciais

## 🚀 Quick Start

### Pré-requisitos
- Node.js 18+
- npm ou yarn
- Conta Google (para Sheets API)
- Conta LinkedIn

### Instalação

```bash
git clone https://github.com/diegosantos-ai/linkedin-assistant.git
cd linkedin-assistant
npm install
cp .env.example .env
# Editar .env com suas credenciais
```

### Desenvolvimento

```bash
npm run dev          # Modo watch
npm run lint         # Verificar código
npm run test         # Testes unitários
npm run test:e2e     # Testes E2E com Playwright
```

### Build & Deploy

```bash
npm run build        # Compilar TypeScript
npm start           # Rodar em produção
```

## 📋 Documentação

- [TASK.md](TASK.md) - Roadmap do projeto
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - Design de sistema
- [docs/SECURITY.md](docs/SECURITY.md) - Considerações de segurança

## 🤝 Git Workflow

Seguimos estratégia de branches temáticas:

```
main ← develop ← feature/task-name
                ← fix/bug-name
                ← refactor/code-name
```

**Fluxo de Commit:**
1. Branch temática → Pull Request
2. Code review + testes
3. Merge em `develop`
4. Deploy automático em `main` (após testes passarem)

## 🔐 Segurança

- Nunca commitar `.env` ou credenciais
- Usar GitHub Secrets para CI/CD
- Rotacionar tokens regularmente
- Ver [docs/SECURITY.md](docs/SECURITY.md)

## 📞 Suporte

Para issues, abra uma issue no GitHub.

---

**Status:** 🚧 Em Desenvolvimento (Phase 1: Analysis)
