# Estado do Projeto: LinkedIn Job Search Bot Avançado

**Status**: ✅ Sessão 2 Concluída — Workflow n8n Operacional
**Data**: 25/02/2026

## Fase Atual
`FASE 3 - OPERAÇÃO` — Workflow n8n rodando, planilha sendo populada.

## Último Marco Atingido
Workflow `collect-jobs.v1.0.json` corrigido e funcional com:
- Filtro de keywords técnicas hardcodado (sem dependência de aba "Filter")
- IA retorna apenas `score` + `techStack` (sem cover letter, sem lixo)
- Parser robusto que limpa markdown do Gemini antes de parsear JSON
- Google Sheets salva somente: ID, Title, Link, Company, Location, Fit Score IA, Date, Status, Experience Level, Modality, Tech Stack
- Score Filter >= 60 (não salva vagas irrelevantes)

## Próxima Tarefa P0
Monitorar a próxima execução diária (05:00) e verificar se as vagas da planilha são exclusivamente técnicas.

## Objetivos Alcançados
- [x] Camada de Stealth (playwright-extra + stealth plugin)
- [x] Delays Humanos e Gaussianos
- [x] Refatoração de Busca Precisa (Junior/Pleno + Low Competition)
- [x] Integração IA (Gemini/OpenAI) para Parsing e Scoring
- [x] Persistência em Google Sheets (Formato Limpo — somente vagas)
- [x] Unificação de Repositório no GitHub Correto
- [x] CI/CD (GitHub Actions) estabilizado — testes unitários passando
- [x] Workflow n8n corrigido — keywords hardcodadas, parser robusto, planilha limpa

## Pendências Abertas
- [ ] Verificar execução diária automática no n8n e qualidade das vagas coletadas
- [ ] Se aparecerem vagas não-técnicas, adicionar mais termos negativos no keyword filter
- [ ] Considerar adicionar notificação via Telegram quando score >= 80

## Entregáveis do Projeto
- [x] requirements.md (Requisitos de negócio)
- [x] design.md (Arquitetura, Banco, Componentes)
- [x] task.md (Backlog de Tarefas)
- [x] workflows/collect-jobs.v1.0.json (Workflow n8n operacional)

## Histórico de Handoffs (Sessões)

### Sessão 1 — [25/02/2026]
Arquitetura e planejamento inicial. Pesquisa sobre contorno de bloqueios do LinkedIn e extração de vagas de dados/IA. Templates gerados.

### Sessão 2 — [25/02/2026]
**Foco:** Correção do CI e do Workflow n8n
- Corrigidos imports JSON com sintaxe incompatível (`assert`/`with` → `createRequire`)
- Corrigidos caminhos de importação ESM nos testes unitários
- Corrigida interface `RetryOptions` nos testes
- Corrigida lógica de detecção de erros retryable (suporte a `error.code`)
- Todos os testes unitários passando: `validators` (14), `rag-matcher` (2), `retry` (11)
- Workflow n8n: prompt IA simplificado (sem cover letter), parser robusto, colunas da planilha limpas, keywords de busca técnicas hardcodadas
- Score Filter ajustado para >= 60
- Push realizado para o GitHub
