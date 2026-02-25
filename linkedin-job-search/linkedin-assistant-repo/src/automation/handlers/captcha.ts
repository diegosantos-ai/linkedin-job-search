import type { Page } from 'playwright';
import { logger } from '../../logger/index.js';
import selectors from '../../../config/selectors.json' assert { type: 'json' };

/**
 * Handler de detecção e tratamento de Captcha
 * Identifica quando captcha aparece e pausa para intervenção manual
 */

export interface CaptchaDetection {
  detected: boolean;
  type?: 'recaptcha' | 'hcaptcha' | 'funcaptcha' | 'unknown';
  message?: string;
}

/**
 * Detecta se há captcha na página
 */
export async function detectCaptcha(page: Page): Promise<CaptchaDetection> {
  logger.debug('Verificando presença de captcha...');

  try {
    // Verifica reCAPTCHA
    const recaptchaFrame = await page.$(selectors.linkedIn.detection.captchaFrame);
    if (recaptchaFrame) {
      logger.warn('⚠️ reCAPTCHA detectado');
      return {
        detected: true,
        type: 'recaptcha',
        message: 'reCAPTCHA detectado - intervenção manual necessária',
      };
    }

    // Verifica challenge de verificação
    const captchaChallenge = await page.$(selectors.linkedIn.detection.captchaChallenge);
    if (captchaChallenge) {
      logger.warn('⚠️ Challenge de verificação detectado');
      return {
        detected: true,
        type: 'recaptcha',
        message: 'Challenge detectado',
      };
    }

    // Verifica por URL de checkpoint
    const url = page.url();
    if (url.includes('/checkpoint/')) {
      logger.warn('⚠️ LinkedIn checkpoint detectado (possível captcha)');
      return {
        detected: true,
        type: 'unknown',
        message: 'LinkedIn checkpoint - verificação necessária',
      };
    }

    // Verifica por texto indicando verificação
    const bodyText = await page.textContent('body');
    if (bodyText?.toLowerCase().includes('verify') || 
        bodyText?.toLowerCase().includes('unusual activity')) {
      logger.warn('⚠️ Texto de verificação detectado');
      return {
        detected: true,
        type: 'unknown',
        message: 'Atividade suspeita detectada pelo LinkedIn',
      };
    }

    return { detected: false };
  } catch (error) {
    logger.error(error, 'Erro ao detectar captcha');
    return {
      detected: false,
      message: 'Erro na detecção',
    };
  }
}

/**
 * Aguarda resolução manual de captcha
 * Retorna true se resolvido, false se timeout
 */
export async function waitForCaptchaSolution(
  page: Page,
  timeoutMs: number = 120000 // 2 minutos padrão
): Promise<boolean> {
  logger.warn('⏸️ Aguardando resolução manual de captcha...');
  logger.info(`⏳ Timeout: ${timeoutMs / 1000}s`);

  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const detection = await detectCaptcha(page);
    
    if (!detection.detected) {
      logger.info('✅ Captcha resolvido!');
      return true;
    }

    // Aguarda 2 segundos antes de verificar novamente
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  logger.error('❌ Timeout aguardando resolução de captcha');
  return false;
}

/**
 * Notifica usuário sobre captcha (para integração futura)
 */
export async function notifyUserAboutCaptcha(
  jobId: string,
  captchaType: string
): Promise<void> {
  logger.warn(
    { jobId, captchaType },
    '📧 Notificação: Captcha detectado - intervenção manual necessária'
  );

  // TODO: Integração com Telegram/Email/Webhook
  // Enviar notificação para usuário resolver captcha
}
