import 'dotenv/config';
import { logger } from './logger/index.js';
import type { AppConfig } from './types/index.js';
import { getJobsFromSheets, type SheetsConfig } from './integration/sheets.js';
import { applyBatch } from './automation/candidature.js';
import { validateAppConfig } from './utils/validators.js';

/**
 * Main application entry point
 * LinkedIn Assistant - Automated job application system
 */

async function loadConfig(): Promise<AppConfig> {
  const requiredVars = [
    'LINKEDIN_EMAIL',
    'LINKEDIN_PASSWORD',
    'GOOGLE_SHEETS_API_KEY',
    'GOOGLE_SHEETS_ID',
  ];

  const missing = requiredVars.filter((v) => !process.env[v]);
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }

  const config: AppConfig = {
    linkedin: {
      email: process.env.LINKEDIN_EMAIL!,
      password: process.env.LINKEDIN_PASSWORD!,
    },
    sheets: {
      apiKey: process.env.GOOGLE_SHEETS_API_KEY!,
      spreadsheetId: process.env.GOOGLE_SHEETS_ID!,
      jobsSheet: process.env.GOOGLE_SHEETS_JOBS_SHEET || 'Vagas',
      applicationsSheet:
        process.env.GOOGLE_SHEETS_APPLICATIONS_SHEET || 'Candidaturas',
    },
    app: {
      maxApplicationsPerDay: Number(
        process.env.MAX_APPLICATIONS_PER_DAY || '50'
      ),
      maxRetries: Number(process.env.RETRY_ATTEMPTS || '3'),
      headless: process.env.HEADLESS !== 'false',
      browserTimeout: Number(process.env.BROWSER_TIMEOUT || '30000'),
      proxyUrl: process.env.PROXY_URL,
    },
  };

  // Valida configuração com Zod
  return validateAppConfig(config);
}

async function main() {
  logger.info('🚀 LinkedIn Assistant iniciando...');

  try {
    // 1. Carrega e valida configuração
    const config = await loadConfig();
    logger.info('✅ Configuração validada');

    // 2. Prepara Sheets config
    const sheetsConfig: SheetsConfig = {
      apiKey: config.sheets.apiKey,
      spreadsheetId: config.sheets.spreadsheetId,
      jobsSheet: config.sheets.jobsSheet,
      applicationsSheet: config.sheets.applicationsSheet,
      manualReviewSheet: process.env.GOOGLE_SHEETS_MANUAL_REVIEW_SHEET || 'ManualReview',
    };

    // 3. Busca vagas pendentes
    const filters = {
      minScore: parseInt(process.env.MIN_JOB_SCORE || '70', 10),
      location: process.env.JOB_LOCATION || 'Brasil - Remoto',
      jobType: process.env.JOB_TYPE || 'Engenharia de Dados',
    };

    logger.info({ filters }, '📋 Buscando vagas...');
    const jobs = await getJobsFromSheets(sheetsConfig, filters);

    if (jobs.length === 0) {
      logger.info('✅ Nenhuma vaga pendente para candidatura');
      return;
    }

    logger.info({ count: jobs.length }, `📌 ${jobs.length} vaga(s) encontrada(s)`);

    // 4. Limita quantidade por dia
    const limitedJobs = jobs.slice(0, config.app.maxApplicationsPerDay);

    if (limitedJobs.length < jobs.length) {
      logger.warn(
        { limit: config.app.maxApplicationsPerDay, total: jobs.length },
        '⚠️ Limitando candidaturas por dia'
      );
    }

    // 5. Executa candidaturas em lote
    const results = await applyBatch(limitedJobs, config, sheetsConfig);

    // 6. Relatório final
    const summary = {
      total: results.length,
      applied: results.filter(r => r.status === 'applied').length,
      failed: results.filter(r => r.status === 'failed').length,
      skipped: results.filter(r => r.status === 'skipped').length,
    };

    logger.info(summary, '✅ Execução concluída');

    // Exit code baseado em falhas
    const exitCode = summary.failed > 0 ? 1 : 0;
    process.exit(exitCode);
  } catch (error) {
    logger.error(error, '❌ Erro fatal');
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main };
