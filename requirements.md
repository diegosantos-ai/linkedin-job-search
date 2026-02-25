# Requirements Document: LinkedIn Job Search Bot Avançado

## Introduction

Esta especificação define os requisitos para elevar a efetividade do bot de busca de vagas no LinkedIn (focando em Engenheiro de Dados Júnior/Pleno, Analista de Dados, Automação e IA).

O objetivo é integrar melhores práticas de web scraping (contorno de bloqueios, proxies rotativos, stealth) e inteligência artificial para parsear descrições e garantir alta qualidade captada, evitando banimentos da conta.

## Glossary

- **Rotating Proxy**: Serviço que altera o endereço IP a cada requisição ou intervalo de tempo para evitar bloqueios.
- **Stealth Browsing**: Técnicas que mascaram a automação (ex: Playwright Stealth) fazendo a ferramenta parecer um navegador humano real.
- **Data Parsing**: Extração de dados não estruturados (ex: descrição da vaga) para um formato estruturado (ex: JSON contendo hard skills, soft skills, salário).

## Requirements

### Requirement 1: Contorno de Bloqueios e Estabilidade

**User Story:** Como operador do sistema, quero que o scraper não seja bloqueado pelo LinkedIn, para garantir consistência e volume na captação de vagas.

#### Acceptance Criteria

1. THE Scraper SHALL utilizar Proxies Rotativos Residenciais.
2. THE Scraper SHALL utilizar injetores de Stealth (ex: `playwright-extra` com `puppeteer-extra-plugin-stealth`).
3. THE Scraper SHALL implementar rate limiting e delays randômicos humanizados (5 a 15 segundos entre interações).
4. WHEN detectado CAPTCHA ou bloqueio temporário, THE Scraper SHALL pausar a execução e logar um alerta crítico.

### Requirement 2: Filtros Precisos e Qualidade de Vagas

**User Story:** Como candidato, quero captar apenas vagas relevantes de alta qualidade nas áreas de Dados e IA (Júnior/Pleno), para otimizar meu tempo.

#### Acceptance Criteria

1. THE Scraper SHALL buscar vagas combinando os termos: "Engenheiro de Dados", "Analista de Dados", "Automação", "Inteligência Artificial", "Data Engineer".
2. THE Scraper SHALL filtrar as buscas pelo nível de experiência (Júnior e Pleno).
3. THE Scraper SHALL priorizar vagas recentes (Últimas 24h a 1 semana) e com menos de 50 candidatos (early apply).

### Requirement 3: Extração Inteligente com IA

**User Story:** Como analista, quero que a descrição da vaga seja resumida e categorizada automaticamente, para identificar rapidamente se a vaga tem "fit" com o meu perfil.

#### Acceptance Criteria

1. THE Scraper SHALL extrair HTML da descrição da vaga e enviar para uma API de IA (ex: OpenAI GPT-4o-mini ou Claude 3.5 Sonnet).
2. THE System SHALL estruturar a resposta extraindo: Tecnologias Exigidas, Anos de Experiência, Regime (Remoto/Híbrido) e Salário (quando disponível).

### Requirement 4: Armazenamento Estruturado

**User Story:** Como usuário, quero consultar e acompanhar o histórico de vagas que o bot encontrou.

#### Acceptance Criteria

1. THE System SHALL armazenar as vagas validadas em um banco de dados (SQLite/PostgreSQL) ou planilha estruturada.
2. THE System SHALL garantir que não existam vagas duplicadas (upsert baseado em Job ID).
