import { google } from 'googleapis';
import { logger } from '../logger/index.js';
import type { JobListing, ApplicationResult } from '../types/index.js';

/**
 * Google Sheets API Integration
 * Gerencia leitura/escrita em Google Sheets para jobs e candidaturas
 */

const sheets = google.sheets('v4');

export interface SheetsConfig {
  apiKey: string;
  spreadsheetId: string;
  jobsSheet: string;
  applicationsSheet: string;
  manualReviewSheet: string;
}

/**
 * Salva listagem de vagas extraídas e enriquecidas
 */
export async function saveJobsToSheets(
  config: SheetsConfig,
  jobs: any[]
): Promise<void> {
  logger.info({ count: jobs.length }, 'Salvando novas vagas no Sheets...');

  if (jobs.length === 0) return;

  try {
    const rows = jobs.map(job => [
      `job-${Date.now()}-${Math.floor(Math.random() * 1000)}`, // ID
      job.title || '',
      job.link || job.url || '',
      job.company || '',
      job.location || '',
      job.enriched_data?.fit_score || 0,
      new Date().toISOString(), // Scraped Date
      'Pending', // Application Status
      job.applicants || '',
      job.enriched_data?.experience_level || '',
      job.enriched_data?.modality || '',
      job.enriched_data?.tech_stack?.join(', ') || ''
    ]);

    await sheets.spreadsheets.values.append({
      key: config.apiKey,
      spreadsheetId: config.spreadsheetId,
      // Usando A:L para acomodar os novos campos extraídos pela IA
      range: `${config.jobsSheet}!A:L`,
      valueInputOption: 'RAW',
      requestBody: {
        values: rows,
      },
    });

    logger.info('✅ Vagas salvas com sucesso no Sheets');
  } catch (error) {
    logger.error(error, 'Erro ao salvar vagas no Sheets');
    throw error;
  }
}

/**
 * Busca vagas do Google Sheets
 */
export async function getJobsFromSheets(
  config: SheetsConfig,
  filters?: { minScore?: number; location?: string }
): Promise<JobListing[]> {
  logger.info('Buscando vagas no Google Sheets...');

  try {
    const response = await sheets.spreadsheets.values.get({
      key: config.apiKey,
      spreadsheetId: config.spreadsheetId,
      range: `${config.jobsSheet}!A:H`, // A até H (ID, Title, Link, Company, Location, Score, Date, Status)
    });

    const rows = response.data.values || [];

    if (rows.length === 0) {
      logger.warn('Nenhuma vaga encontrada no Sheets');
      return [];
    }

    // Primeira linha são headers
    const [, ...dataRows] = rows;

    const jobs: JobListing[] = dataRows.map((row, index) => ({
      id: row[0] || `job-${index}`,
      title: row[1] || '',
      link: row[2] || '',
      company: row[3] || '',
      location: row[4] || '',
      rawData: {
        score: Number(row[5]) || 0,
        postedDate: row[6] || '',
        applicationStatus: row[7] || 'Not Applied',
      },
    }));

    // Aplica filtros
    let filtered = jobs;

    if (filters?.minScore) {
      filtered = filtered.filter(j => (j.rawData.score || 0) >= filters.minScore!);
    }

    if (filters?.location) {
      filtered = filtered.filter(j =>
        j.location.toLowerCase().includes(filters.location!.toLowerCase())
      );
    }

    logger.info({ total: jobs.length, filtered: filtered.length }, 'Vagas carregadas do Sheets');
    return filtered;
  } catch (error) {
    logger.error(error, 'Erro ao buscar vagas no Sheets');
    throw error;
  }
}

/**
 * Registra candidatura no Google Sheets
 */
export async function recordApplication(
  config: SheetsConfig,
  application: ApplicationResult
): Promise<void> {
  logger.info({ jobId: application.jobId }, 'Registrando candidatura no Sheets...');

  try {
    const row = [
      `app-${Date.now()}`, // ID
      application.jobId,
      application.status,
      application.appliedAt?.toISOString() || '',
      application.retries,
      application.error || '',
      JSON.stringify(application.formData || {}),
      application.reviewUrl || '',
    ];

    await sheets.spreadsheets.values.append({
      key: config.apiKey,
      spreadsheetId: config.spreadsheetId,
      range: `${config.applicationsSheet}!A:H`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [row],
      },
    });

    logger.info('✅ Candidatura registrada com sucesso');
  } catch (error) {
    logger.error(error, 'Erro ao registrar candidatura');
    throw error;
  }
}

/**
 * Adiciona campo à lista de revisão manual
 */
export async function addToManualReview(
  config: SheetsConfig,
  data: {
    jobId: string;
    company: string;
    fieldName: string;
    fieldLabel: string;
    question: string;
    suggestedAnswer?: string;
    confidence?: number;
  }
): Promise<void> {
  logger.info({ jobId: data.jobId, field: data.fieldName }, 'Adicionando à lista de revisão manual...');

  try {
    const row = [
      `review-${Date.now()}`,
      data.jobId,
      data.company,
      data.fieldName,
      data.fieldLabel,
      data.question,
      data.suggestedAnswer || '',
      data.confidence ? `${(data.confidence * 100).toFixed(0)}%` : '',
      'Pending', // Status
      new Date().toISOString(),
    ];

    await sheets.spreadsheets.values.append({
      key: config.apiKey,
      spreadsheetId: config.spreadsheetId,
      range: `${config.manualReviewSheet}!A:J`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [row],
      },
    });

    logger.info('✅ Campo adicionado à fila de revisão manual');
  } catch (error) {
    logger.error(error, 'Erro ao adicionar à revisão manual');
    throw error;
  }
}

/**
 * Atualiza status de uma vaga
 */
export async function updateJobStatus(
  _config: SheetsConfig,
  jobId: string,
  status: 'Applied' | 'Failed' | 'Pending' | 'Manual Review'
): Promise<void> {
  logger.debug({ jobId, status }, 'Atualizando status da vaga...');

  try {
    // TODO: Implementar busca da linha específica e update
    // Por enquanto apenas loga
    logger.info({ jobId, status }, 'Status atualizado (placeholder)');
  } catch (error) {
    logger.error(error, 'Erro ao atualizar status');
  }
}
