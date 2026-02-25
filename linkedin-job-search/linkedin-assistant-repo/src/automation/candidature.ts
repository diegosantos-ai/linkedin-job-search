import type { Page } from 'playwright';
import { logger } from '../logger/index.js';
import type { JobListing, ApplicationResult, AppConfig } from '../types/index.js';
import { launchBrowser, createContext, createPage, closeBrowser } from './browser.js';
import { loginLinkedIn } from './handlers/login.js';
import { detectCaptcha, waitForCaptchaSolution } from './handlers/captcha.js';
import { detectForm } from './form-detector.js';
import { fillForm, submitForm } from './form-filler.js';
import { recordApplication, type SheetsConfig } from '../integration/sheets.js';
import { retry } from '../utils/retry.js';
import { delay, humanDelay } from '../utils/delay.js';

/**
 * Candidature - Fluxo principal de automação de candidatura
 * Orquestra todo o processo: login → navegação → detecção → preenchimento → submit
 */

export interface CandidatureOptions {
  job: JobListing;
  config: AppConfig;
  sheetsConfig: SheetsConfig;
}

/**
 * Executa candidatura completa para uma vaga
 */
export async function applyCandidature(options: CandidatureOptions): Promise<ApplicationResult> {
  const { job, config, sheetsConfig } = options;

  logger.info({ jobId: job.id, company: job.company, title: job.title }, '🚀 Iniciando candidatura...');

  const result: ApplicationResult = {
    jobId: job.id,
    status: 'pending',
    retries: 0,
  };

  let browser;
  let page: Page | undefined;

  try {
    // 1. Lança browser
    browser = await launchBrowser(config);
    const context = await createContext(browser);
    page = await createPage(context);

    // 2. Faz login no LinkedIn
    await loginLinkedIn(page, {
      email: config.linkedin.email,
      password: config.linkedin.password,
    });

    await humanDelay(2000); // Delay após login

    // 3. Navega para a vaga
    logger.info({ url: job.link }, 'Navegando para a vaga...');
    await page.goto(job.link, { waitUntil: 'networkidle', timeout: 30000 });

    // 4. Verifica captcha
    const captchaDetection = await detectCaptcha(page);
    if (captchaDetection.detected) {
      logger.warn('⚠️ Captcha detectado, aguardando resolução...');
      const resolved = await waitForCaptchaSolution(page, 120000);
      
      if (!resolved) {
        result.status = 'failed';
        result.error = 'Captcha não resolvido no tempo limite';
        await recordApplication(sheetsConfig, result);
        return result;
      }
    }

    // 5. Clica em "Candidatar-se" ou "Easy Apply"
    const applyButton = await page.$('button[aria-label*="Candidatar"]') ||
                        await page.$('button[aria-label*="Easy Apply"]');
    
    if (!applyButton) {
      throw new Error('Botão de candidatura não encontrado');
    }

    await applyButton.click();
    await delay(2000); // Aguarda modal abrir

    // 6. Detecta formulário
    const formAnalysis = await detectForm(page);
    
    if (formAnalysis.hasError || formAnalysis.fields.length === 0) {
      throw new Error('Formulário não detectado ou vazio');
    }

    logger.info({ fieldsCount: formAnalysis.fields.length }, 'Formulário detectado');

    // 7. Preenche formulário com RAG
    const fillResult = await fillForm(page, formAnalysis, job.id, job.company, sheetsConfig);

    logger.info({
      filled: fillResult.filledFields.length,
      manualReview: fillResult.manualReviewFields.length,
      fillRate: `${fillResult.fillRate.toFixed(0)}%`,
    }, 'Formulário preenchido');

    // 8. Se fill rate muito baixo, não submete
    if (fillResult.fillRate < 50) {
      logger.warn('⚠️ Fill rate muito baixo, candidatura marcada para revisão manual');
      result.status = 'skipped';
      result.error = `Fill rate baixo: ${fillResult.fillRate.toFixed(0)}%`;
      await recordApplication(sheetsConfig, result);
      return result;
    }

    // 9. Submete formulário
    await humanDelay(1500);
    const submitted = await submitForm(page, formAnalysis.submitSelector);

    if (submitted) {
      result.status = 'applied';
      result.appliedAt = new Date();
      result.formData = {
        filledFields: fillResult.filledFields,
        manualReviewFields: fillResult.manualReviewFields,
        fillRate: fillResult.fillRate,
      };
      
      logger.info({ jobId: job.id }, '✅ Candidatura realizada com sucesso!');
    } else {
      result.status = 'failed';
      result.error = 'Erro ao submeter formulário';
    }

    // 10. Registra resultado
    await recordApplication(sheetsConfig, result);

    return result;
  } catch (error) {
    logger.error(error, '❌ Erro durante candidatura');
    
    result.status = 'failed';
    result.error = error instanceof Error ? error.message : String(error);
    
    await recordApplication(sheetsConfig, result);
    return result;
  } finally {
    // Cleanup
    if (browser) {
      await closeBrowser();
    }
  }
}

/**
 * Executa candidaturas em lote com retry
 */
export async function applyBatch(
  jobs: JobListing[],
  config: AppConfig,
  sheetsConfig: SheetsConfig
): Promise<ApplicationResult[]> {
  logger.info({ jobsCount: jobs.length }, '📋 Iniciando lote de candidaturas...');

  const results: ApplicationResult[] = [];

  for (const job of jobs) {
    try {
      // Executa com retry
      const result = await retry(
        () => applyCandidature({ job, config, sheetsConfig }),
        {
          maxAttempts: config.app.maxRetries,
          initialDelayMs: 5000,
          multiplier: 2,
          maxDelayMs: 120000,
        },
        `Candidatura ${job.id}`
      );

      results.push(result);

      // Delay entre candidaturas (rate limiting)
      const delayMs = Math.random() * (15000 - 5000) + 5000; // 5-15s
      logger.debug({ nextIn: `${(delayMs / 1000).toFixed(0)}s` }, 'Aguardando antes da próxima...');
      await delay(delayMs);
    } catch (error) {
      logger.error({ jobId: job.id, error }, 'Falha em todas as tentativas');
      
      results.push({
        jobId: job.id,
        status: 'failed',
        retries: config.app.maxRetries,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  logger.info({
    total: results.length,
    applied: results.filter(r => r.status === 'applied').length,
    failed: results.filter(r => r.status === 'failed').length,
    skipped: results.filter(r => r.status === 'skipped').length,
  }, '📊 Lote concluído');

  return results;
}
