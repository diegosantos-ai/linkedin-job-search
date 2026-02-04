import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { logger } from '../logger/index.js';
import type { AppConfig } from '../types/index.js';

/**
 * Gerenciador de sessão do browser Playwright
 * Responsável por criar, configurar e destruir instâncias do navegador
 */

let browserInstance: Browser | null = null;
let contextInstance: BrowserContext | null = null;

/**
 * Lança browser com configurações otimizadas
 */
export async function launchBrowser(config: AppConfig): Promise<Browser> {
  if (browserInstance) {
    logger.warn('Browser já está ativo, retornando instância existente');
    return browserInstance;
  }

  logger.info('Iniciando browser Chromium...');

  browserInstance = await chromium.launch({
    headless: config.app.headless,
    timeout: config.app.browserTimeout,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled',
    ],
  });

  logger.info('Browser iniciado com sucesso');
  return browserInstance;
}

/**
 * Cria contexto do browser com user-agent randomizado
 */
export async function createContext(browser: Browser): Promise<BrowserContext> {
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  ];

  const randomUA = userAgents[Math.floor(Math.random() * userAgents.length)];

  contextInstance = await browser.newContext({
    userAgent: randomUA,
    viewport: { width: 1920, height: 1080 },
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
  });

  logger.debug({ userAgent: randomUA }, 'Contexto criado com User-Agent');
  return contextInstance;
}

/**
 * Cria nova página no contexto
 */
export async function createPage(context: BrowserContext): Promise<Page> {
  const page = await context.newPage();
  
  // Adiciona delays realistas
  await page.addInitScript(() => {
    // Remove webdriver flag
    Object.defineProperty((window as any).navigator, 'webdriver', { get: () => false });
  });

  logger.debug('Nova página criada');
  return page;
}

/**
 * Fecha browser e limpa recursos
 */
export async function closeBrowser(): Promise<void> {
  if (contextInstance) {
    await contextInstance.close();
    contextInstance = null;
    logger.debug('Contexto fechado');
  }

  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
    logger.info('Browser fechado');
  }
}

/**
 * Cleanup em caso de erro
 */
export async function cleanup(): Promise<void> {
  try {
    await closeBrowser();
  } catch (error) {
    logger.error(error, 'Erro durante cleanup do browser');
  }
}
