import { z } from 'zod';

/**
 * Validadores de input usando Zod
 * Garante type-safety e validação de dados
 */

/**
 * Schema de Job Listing
 */
export const JobListingSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  link: z.string().url().includes('linkedin.com'),
  company: z.string().min(1),
  location: z.string().optional(),
  salary: z.string().optional(),
  description: z.string().optional(),
  postedDate: z.string().optional(),
  rawData: z.record(z.any()).optional(),
});

/**
 * Schema de Application Result
 */
export const ApplicationResultSchema = z.object({
  jobId: z.string(),
  status: z.enum(['applied', 'failed', 'skipped', 'pending']),
  appliedAt: z.date().optional(),
  error: z.string().optional(),
  retries: z.number().int().min(0),
  formData: z.record(z.any()).optional(),
  reviewUrl: z.string().url().optional(),
});

/**
 * Schema de configuração de app
 */
export const AppConfigSchema = z.object({
  linkedin: z.object({
    email: z.string().email(),
    password: z.string().min(6),
  }),
  sheets: z.object({
    apiKey: z.string().min(1),
    spreadsheetId: z.string().min(1),
    jobsSheet: z.string().default('Vagas'),
    applicationsSheet: z.string().default('Candidaturas'),
  }),
  app: z.object({
    maxApplicationsPerDay: z.number().int().positive().default(50),
    maxRetries: z.number().int().min(1).max(5).default(3),
    headless: z.boolean().default(true),
    browserTimeout: z.number().int().positive().default(30000),
  }),
});

/**
 * Valida job listing
 */
export function validateJobListing(data: unknown) {
  return JobListingSchema.parse(data);
}

/**
 * Valida application result
 */
export function validateApplicationResult(data: unknown) {
  return ApplicationResultSchema.parse(data);
}

/**
 * Valida configuração de app
 */
export function validateAppConfig(data: unknown) {
  return AppConfigSchema.parse(data);
}

/**
 * Valida se URL é do LinkedIn
 */
export function isLinkedInUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname.includes('linkedin.com');
  } catch {
    return false;
  }
}

/**
 * Valida score de vaga
 */
export function isValidScore(score: number): boolean {
  return score >= 0 && score <= 100;
}
