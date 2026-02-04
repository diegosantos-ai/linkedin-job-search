/**
 * Delay utilities para simular comportamento humano
 */

/**
 * Cria delay aleatório entre min e max (ms)
 */
export function randomDelay(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Promise de delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Delay com variação aleatória baseado em um valor base
 */
export async function humanDelay(baseMs: number = 1000, variance: number = 0.3): Promise<void> {
  const varianceMs = baseMs * variance;
  const actualDelay = baseMs + randomDelay(-varianceMs, varianceMs);
  await delay(Math.max(100, actualDelay)); // Mínimo 100ms
}

/**
 * Delay entre digitações (simula typing humano)
 */
export async function typingDelay(): Promise<void> {
  await delay(randomDelay(50, 150));
}
