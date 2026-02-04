import { describe, it, expect, vi } from 'vitest';
import { retry, isRetryableError, shouldRetry } from '../utils/retry';

describe('Retry - Error Detection', () => {
  it('deve identificar erro de timeout como retryable', () => {
    const error = new Error('Timeout exceeded');
    expect(isRetryableError(error)).toBe(true);
  });

  it('deve identificar erro de network como retryable', () => {
    const error = new Error('Network request failed');
    expect(isRetryableError(error)).toBe(true);
  });

  it('deve identificar ECONNREFUSED como retryable', () => {
    const error = Object.assign(new Error('Connection refused'), { code: 'ECONNREFUSED' });
    expect(isRetryableError(error)).toBe(true);
  });

  it('não deve identificar erro genérico como retryable', () => {
    const error = new Error('Invalid input');
    expect(isRetryableError(error)).toBe(false);
  });
});

describe('Retry - Should Retry Logic', () => {
  it('deve retornar true para erro retryable dentro do limite de tentativas', () => {
    const error = new Error('Timeout');
    expect(shouldRetry(error, 2, 5)).toBe(true);
  });

  it('deve retornar false se atingiu maxAttempts', () => {
    const error = new Error('Timeout');
    expect(shouldRetry(error, 5, 5)).toBe(false);
  });

  it('deve retornar false para erro não-retryable', () => {
    const error = new Error('Invalid data');
    expect(shouldRetry(error, 1, 5)).toBe(false);
  });
});

describe('Retry - Exponential Backoff', () => {
  it('deve executar função com sucesso na primeira tentativa', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    
    const result = await retry(fn, { maxAttempts: 3 }, 'test-op');
    
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('deve fazer retry e eventualmente ter sucesso', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('Timeout'))
      .mockRejectedValueOnce(new Error('Timeout'))
      .mockResolvedValueOnce('success');
    
    const result = await retry(fn, { maxAttempts: 3, initialDelayMs: 10 }, 'test-op');
    
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('deve lançar erro após esgotar tentativas', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('Timeout'));
    
    await expect(
      retry(fn, { maxAttempts: 2, initialDelayMs: 10 }, 'test-op')
    ).rejects.toThrow('Timeout');
    
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('deve respeitar maxDelay', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('Timeout'))
      .mockRejectedValueOnce(new Error('Timeout'))
      .mockResolvedValueOnce('success');
    
    const startTime = Date.now();
    
    await retry(fn, {
      maxAttempts: 3,
      initialDelayMs: 100,
      multiplier: 10, // 100ms → 1000ms (capped at 500ms)
      maxDelayMs: 500,
    }, 'test-op');
    
    const duration = Date.now() - startTime;
    
    // Deve ter esperado ~100ms + ~500ms = ~600ms (não 100ms + 1000ms)
    expect(duration).toBeLessThan(800);
  });
});
