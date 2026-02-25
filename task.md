# Implementation Plan: LinkedIn Job Search Bot Avançado

## Overview

Este plano implementa as melhorias propostas para o projeto de captação de vagas do LinkedIn (`linkedin-assistant`), seguindo a arquitetura definida no `design.md` e os critérios do `requirements.md`.

**Linguagem de Implementação**: TypeScript (Node.js) + Playwright
**Estratégia**: Refatorar o scraper atual em 4 fases para incorporar ferramentas anti-detecção e inteligência no parsing.

## Tasks

- [x] 1. Stealth e Identidade
  - [x] Migrar Playwright comum para `playwright-extra` com `puppeteer-extra-plugin-stealth`.
  - [x] Implementar classe/módulo para gerenciar delays (funções de sleep randômico).
  - [x] Configurar injeção de Proxies (via .env para credenciais do provedor).

- [x] 2. Core Scraper Refactoring
  - [x] Refatorar a query de busca (URL Builder) para injetar precisão: keywords ("Data Engineer" OR "Analista de Dados"), seniority (1, 2 = Entry, Associate), sort (recent).
  - [x] Filtrar via UI ou Query Params para focar em vagas com `< 50 applicants`.

- [x] 3. Enrichment Integration (LLM)
  - [x] Criar wrapper para API de LLM (OpenAI ou integração nativa Gemini/Claude).
  - [x] Escrever o Prompt base para classificação (extrair skills, nível e modalidade do innerText da vaga).
  - [x] Criar lógica de pipeline que faz scraping dos metadados e manda a descrição pro LLM assíncronamente.

- [x] 4. Persistence e Storage
  - [x] Adaptar a camada de persistência para armazenar o objeto `EnrichedJob`.
  - [x] Garantir validação deduplicada (usar job ID como key no BD/Google Sheets).

- [x] 5. Checkpoint - Validar E2E
  - [x] Rodar bot e avaliar a taxa de hits e bloqueios.
  - [x] Avaliar qualidade das vagas lidas pela IA.
- [x] 6. Unificação de Repositório e Push Oficial
  - [x] Remover repositórios git aninhados.
  - [x] Configurar remote correto e proteger secrets.
  - [x] Push para repositório `linkedin-job-search`.

## Notes

- Evitar iterar rápido demais nas páginas do LinkedIn. A lentidão é amiga do scraper.
- Use logs estruturados (Pino) para verificar onde a taxa de bloqueio aumenta se ocorrer.
