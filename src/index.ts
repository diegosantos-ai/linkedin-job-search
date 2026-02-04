import 'dotenv/config';
import { logger } from './logger/index.js';
import type { AppConfig } from './types/index.js';

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

  return {
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
    },
  };
}

async function main() {
  try {
    logger.info('🚀 LinkedIn Assistant starting...');

    const config = await loadConfig();
    logger.debug({ config: { sheets: { spreadsheetId: '***' } } }, 'Config loaded');

    logger.info('Phase 1: ANALYSIS in progress...');
    logger.info('📋 Tasks:');
    logger.info('  - Understand LinkedIn automation strategies');
    logger.info('  - Map form detection & filling flows');
    logger.info('  - Define error handling strategy');
    logger.info('  - Document security considerations');

    logger.info('✨ Application initialized successfully');
    logger.info('📖 See TASK.md for project roadmap');
    logger.info('🔗 Repository: https://github.com/diegosantos-ai/linkedin-assistant');
  } catch (error) {
    logger.error(error, 'Fatal error during startup');
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main };
