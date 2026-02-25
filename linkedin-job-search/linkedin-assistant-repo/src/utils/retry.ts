import { logger } from '../logger/index.js';
import { delay } from './delay.js';

/**
 * Retry logic com exponential backoff
 */

export interface RetryOptions {
  maxAttempts: number;
  initialDelayMs: number;
  multiplier: number;
  maxDelayMs: number;
}

/**
 * Executa função com retry e exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions,
  context?: string
): Promise<T> {
  let lastError: Error | unknown;
  let delayMs = options.initialDelayMs;

  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    try {
      logger.debug({ attempt, context }, 'Tentando executar...');
      const result = await fn();

      if (attempt > 1) {
        logger.info({ attempt, context }, '✅ Sucesso após retry');
      }

      return result;
    } catch (error) {
      lastError = error;

      if (attempt === options.maxAttempts) {
        logger.error(
          { attempt, maxAttempts: options.maxAttempts, error, context },
          '❌ Todas as tentativas falharam'
        );
        break;
      }

      logger.warn(
        { attempt, maxAttempts: options.maxAttempts, nextRetryIn: delayMs, error, context },
        '⚠️ Tentativa falhou, aguardando retry...'
      );

      await delay(delayMs);

      // Exponential backoff
      delayMs = Math.min(delayMs * options.multiplier, options.maxDelayMs);
    }
  }

  throw lastError;
}

/**
 * Verifica se erro é retryable
 */
export function isRetryableError(error: any): boolean {
  if (!error) return false;

  const retryablePatterns = [
    'timeout',
    'network',
    'ECONNREFUSED',
    'ENOTFOUND',
    'ETIMEDOUT',
    'rate limit',
    'too many requests',
  ];

  const errorMessage = error.message?.toLowerCase() || '';
  const errorCode = error.code?.toLowerCase() || '';
  const errorString = String(error).toLowerCase();

  return retryablePatterns.some(pattern => {
    const p = pattern.toLowerCase();
    return errorMessage.includes(p) || errorCode.includes(p) || errorString.includes(p);
  });
}

/**
 * Determina se deve fazer retry baseado no erro
 */
export function shouldRetry(error: any, attempt: number, maxAttempts: number): boolean {
  if (attempt >= maxAttempts) {
    return false;
  }

  return isRetryableError(error);
}
