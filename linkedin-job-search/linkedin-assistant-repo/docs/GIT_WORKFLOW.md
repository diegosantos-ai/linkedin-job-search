# 📊 Git Workflow - LinkedIn Assistant

## Branch Strategy

### Main Branches
- **`main`** - Produção estável, deploy automático
- **`develop`** - Integração de features, staging

### Feature Branches (Temáticas)
```
feature/authentication      # Nova feature
fix/login-bug              # Bug fix
refactor/sheets-api        # Refatoração
docs/setup-guide           # Documentação
ci/github-actions          # CI/CD improvements
test/e2e-playwright        # Testes
```

## Workflow Passo a Passo

### 1️⃣ Criar Branch Temática

```bash
# Sync com develop
git checkout develop
git pull origin develop

# Criar branch do tipo de tarefa
git checkout -b feature/automation-core
# ou
git checkout -b fix/form-detection
# ou
git checkout -b refactor/logger-setup
```

### 2️⃣ Desenvolver & Commitar

**Mensagem de commit clara e temática:**
```bash
git commit -m "feat(automation): implement form auto-detection"
git commit -m "fix(sheets-api): handle sheet not found error"
git commit -m "refactor(logger): simplify pino configuration"
git commit -m "test(e2e): add playwright tests for login flow"
git commit -m "docs(setup): add environment setup guide"
```

**Formato:** `type(scope): message`

**Types:** feat, fix, refactor, test, docs, ci, perf, style

### 3️⃣ Push & PR

```bash
git push -u origin feature/automation-core
# Abrir PR no GitHub (develop ← feature branch)
```

**PR Template:**
```markdown
## 📝 Descrição
O que foi implementado/corrigido

## 🎯 Tipo
- [ ] Feature (nova funcionalidade)
- [ ] Fix (correção de bug)
- [ ] Refactor (melhoria de código)
- [ ] Test (testes)
- [ ] Docs (documentação)

## ✅ Checklist
- [ ] Testes passam (`npm test`)
- [ ] Sem avisos de lint (`npm run lint`)
- [ ] Documentação atualizada
- [ ] Zero credenciais em código
- [ ] Commits com mensagens claras

## 🔗 Issues
Fecha: #123
```

### 4️⃣ Review & Merge

- Mínimo 1 review antes de merge
- CI/CD deve passar (testes + lint)
- Squash merges para manter histórico limpo

```bash
# Merge em develop via GitHub UI (squash merge)
# Depois, delete remote branch automaticamente
```

### 5️⃣ Sync & Delete Local

```bash
# Volta para develop e sync
git checkout develop
git pull origin develop

# Delete branch local
git branch -d feature/automation-core

# Delete remote (se não foi deletado automaticamente)
git push origin --delete feature/automation-core
```

---

## Exemplo Completo: Feature de Formulários Dinâmicos

```bash
# 1. Sync
git checkout develop && git pull

# 2. Criar branch
git checkout -b feature/dynamic-form-detection

# 3. Desenvolver com múltiplos commits temáticos
git add src/automation/form-detector.ts
git commit -m "feat(form-detector): implement basic form detection"

git add src/types/form.ts
git commit -m "feat(form-detector): add TypeScript types for forms"

git add tests/form-detector.test.ts
git commit -m "test(form-detector): add unit tests"

# 4. Push
git push -u origin feature/dynamic-form-detection

# 5. Criar PR no GitHub
# (Review feedback vem...)

# 6. Fazer ajustes se necessário
git add src/automation/form-detector.ts
git commit -m "fix(form-detector): handle nested fieldsets"
git push

# 7. Após aprovação, merge é feito via GitHub
# 8. Delete
git checkout develop && git pull
git branch -d feature/dynamic-form-detection
```

---

## ⚡ Dicas Rápidas

### Listar branches locais
```bash
git branch
```

### Ver branches remotos
```bash
git branch -a
```

### Antes de começar nova feature
```bash
git checkout develop && git pull origin develop
```

### Rebase antes de PR (opcional, para histórico limpo)
```bash
git rebase develop
# Se houver conflitos:
git rebase --continue  # Após resolver
```

### Desfazer último commit (não pushado)
```bash
git reset --soft HEAD~1
```

---

## 🚀 CI/CD Automático

Ao fazer push, o GitHub Actions executa:
1. ✅ Testes (`npm test`)
2. ✅ Lint (`npm run lint`)
3. ✅ Build (`npm run build`)
4. ✅ Type check (`npm run type-check`)

Se falhar, você vê na PR. Corrija e faça push novamente.

---

## 📌 Regras Importantes

❌ **NÃO PERMITIDO:**
- Push direto em `main` ou `develop`
- Commits sem mensagens claras
- Credenciais no código
- Branches não deletadas após merge

✅ **OBRIGATÓRIO:**
- PR antes de merge em `develop`
- Testes passando
- Mensagens de commit no padrão
- Branch name temático (feature/fix/refactor/etc)

---

## 🆘 Troubleshooting

**Conflito de merge?**
```bash
git pull origin develop
# Resolver conflitos nos arquivos
git add .
git commit -m "chore: resolve merge conflicts"
git push
```

**Acidentalmente pushei em develop?**
```bash
git reset --soft HEAD~1
# Criar nova branch e fazer PR
git checkout -b feature/my-feature
git push -u origin feature/my-feature
```

**Preciso pegar mudanças de develop na minha branch?**
```bash
git fetch origin
git rebase origin/develop
# Se houver conflitos, resolva e continue
git rebase --continue
```
