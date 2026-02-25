import type { Page } from 'playwright';
import { logger } from '../../logger/index.js';
import selectors from '../../../config/selectors.json' assert { type: 'json' };

/**
 * Handler de autenticação no LinkedIn
 * Realiza login com delays realistas para evitar detecção
 */

export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Faz login no LinkedIn
 */
export async function loginLinkedIn(
  page: Page,
  credentials: LoginCredentials
): Promise<void> {
  logger.info('Iniciando login no LinkedIn...');

  try {
    // Navega para página de login
    await page.goto('https://www.linkedin.com/login', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    logger.debug('Página de login carregada');

    // Preenche email
    await page.fill(selectors.linkedIn.loginForm.email, credentials.email);
    await delay(randomDelay(500, 1500));

    // Preenche senha
    await page.fill(selectors.linkedIn.loginForm.password, credentials.password);
    await delay(randomDelay(500, 1500));

    // Clica no botão de login
    await page.click(selectors.linkedIn.loginForm.submitBtn);
    logger.debug('Formulário de login submetido');

    // Aguarda navegação
    await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 });

    // Verifica se login foi bem-sucedido
    const currentUrl = page.url();
    if (currentUrl.includes('/feed') || currentUrl.includes('/mynetwork')) {
      logger.info('✅ Login realizado com sucesso');
    } else if (currentUrl.includes('/checkpoint')) {
      throw new Error('Captcha ou verificação detectada');
    } else {
      throw new Error('Login falhou - URL inesperada: ' + currentUrl);
    }
  } catch (error) {
    logger.error(error, 'Erro durante login no LinkedIn');
    throw error;
  }
}

/**
 * Verifica se usuário está autenticado
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  try {
    const url = page.url();
    return url.includes('/feed') || url.includes('/mynetwork') || url.includes('/jobs');
  } catch {
    return false;
  }
}

/**
 * Delay com variação aleatória (simula comportamento humano)
 */
function randomDelay(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Promise de delay
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
