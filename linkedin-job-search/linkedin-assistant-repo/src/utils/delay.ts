/**
 * Delay utilities para simular comportamento humano
 */

/**
 * Cria delay aleatório entre min e max (ms) com distribuição uniforme
 */
export function randomDelay(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Gera um número aleatório com distribuição normal (Gaussiana)
 * Usando o método Box-Muller transform
 */
export function gaussianRandom(mean: number = 0, stdev: number = 1): number {
  const u = 1 - Math.random(); // Converter [0,1) para (0,1]
  const v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * stdev + mean;
}

/**
 * Promise de delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Delay com variação aleatória baseado em um valor base
 * Simula uma pausa humana mais realista usando distribuição normal
 */
export async function humanDelay(baseMs: number = 2000, variance: number = 0.5): Promise<void> {
  const stdev = baseMs * variance;
  const actualDelay = Math.round(gaussianRandom(baseMs, stdev));
  // Limita o delay entre 30% e 200% do baseMs para evitar anomalias extremas
  const clampedDelay = Math.max(baseMs * 0.3, Math.min(baseMs * 2, actualDelay));
  await delay(Math.max(100, clampedDelay)); // Mínimo 100ms
}

/**
 * Pausa longa (5s a 15s) para simular leitura de conteúdo ou rolar página longa
 */
export async function readingDelay(): Promise<void> {
  await humanDelay(8000, 0.4); // Média 8s, com grande variação
}

/**
 * Delay entre digitações (simula typing humano com erros/pausas leves)
 */
export async function typingDelay(): Promise<void> {
  // Maioria das teclas é rápida, algumas poucas têm pausa maior
  if (Math.random() < 0.05) {
    await delay(randomDelay(200, 500)); // Pequena pausa pra pensar
  } else {
    await delay(Math.max(30, Math.round(gaussianRandom(80, 20))));
  }
}
