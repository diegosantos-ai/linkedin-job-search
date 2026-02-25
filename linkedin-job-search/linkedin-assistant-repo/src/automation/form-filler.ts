import type { Page } from 'playwright';
import { logger } from '../logger/index.js';
import type { FormField, FormAnalysis } from '../types/index.js';
import { findRAGAnswer, type RAGResult } from './rag-matcher.js';
import { addToManualReview, type SheetsConfig } from '../integration/sheets.js';
import { delay, randomDelay } from '../utils/delay.js';

/**
 * Form Filler - Preenche formulários de candidatura
 * Usa RAG para respostas automáticas e envia campos incertos para revisão manual
 */

export interface FillResult {
  filledFields: string[];
  manualReviewFields: string[];
  errors: string[];
  totalFields: number;
  fillRate: number; // %
}

/**
 * Preenche formulário usando RAG + manual review
 */
export async function fillForm(
  page: Page,
  formAnalysis: FormAnalysis,
  jobId: string,
  company: string,
  sheetsConfig: SheetsConfig
): Promise<FillResult> {
  logger.info({ jobId, fieldsCount: formAnalysis.fields.length }, 'Iniciando preenchimento do formulário...');

  const result: FillResult = {
    filledFields: [],
    manualReviewFields: [],
    errors: [],
    totalFields: formAnalysis.fields.length,
    fillRate: 0,
  };

  for (const field of formAnalysis.fields) {
    try {
      await fillSingleField(page, field, jobId, company, sheetsConfig, result);
      await delay(randomDelay(100, 300)); // Delay realista entre campos
    } catch (error) {
      const errorMsg = `Erro ao preencher campo ${field.name}: ${error}`;
      logger.error(error, errorMsg);
      result.errors.push(errorMsg);
    }
  }

  result.fillRate = (result.filledFields.length / result.totalFields) * 100;

  logger.info({
    filled: result.filledFields.length,
    manualReview: result.manualReviewFields.length,
    errors: result.errors.length,
    fillRate: `${result.fillRate.toFixed(0)}%`,
  }, 'Preenchimento concluído');

  return result;
}

/**
 * Preenche um campo individual
 */
async function fillSingleField(
  page: Page,
  field: FormField,
  jobId: string,
  company: string,
  sheetsConfig: SheetsConfig,
  result: FillResult
): Promise<void> {
  logger.debug({ fieldName: field.name, fieldType: field.type }, 'Processando campo...');

  // Busca resposta no RAG
  const ragResult: RAGResult = await findRAGAnswer(field);

  if (ragResult.matched && !ragResult.shouldAskUser) {
    // Confiança alta: preenche automaticamente
    const answer = ragResult.match!.answer;
    await fillFieldWithValue(page, field, answer);
    result.filledFields.push(field.name);
    
    logger.info({
      field: field.name,
      confidence: `${(ragResult.match!.confidence * 100).toFixed(0)}%`,
    }, '✅ Campo preenchido automaticamente');
  } else {
    // Confiança baixa ou campo desconhecido: envia para revisão manual
    await addToManualReview(sheetsConfig, {
      jobId,
      company,
      fieldName: field.name,
      fieldLabel: field.label || field.name,
      question: field.label || field.name,
      suggestedAnswer: ragResult.match?.answer,
      confidence: ragResult.match?.confidence,
    });

    result.manualReviewFields.push(field.name);
    
    logger.warn({
      field: field.name,
      reason: ragResult.reason,
    }, '⚠️ Campo enviado para revisão manual');
  }
}

/**
 * Preenche campo com valor específico
 */
async function fillFieldWithValue(
  page: Page,
  field: FormField,
  value: string
): Promise<void> {
  try {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        await page.fill(field.selector, value);
        break;

      case 'textarea':
        await page.fill(field.selector, value);
        break;

      case 'select':
        // Tenta encontrar opção por texto ou valor
        const options = field.options || [];
        const matchingOption = options.find(opt => 
          opt.toLowerCase().includes(value.toLowerCase()) ||
          value.toLowerCase().includes(opt.toLowerCase())
        );
        
        if (matchingOption) {
          await page.selectOption(field.selector, matchingOption);
        } else {
          throw new Error(`Opção "${value}" não encontrada em select`);
        }
        break;

      case 'checkbox':
        if (value.toLowerCase() === 'true' || value.toLowerCase() === 'yes' || value.toLowerCase() === 'sim') {
          await page.check(field.selector);
        }
        break;

      case 'radio':
        await page.check(field.selector);
        break;

      default:
        logger.warn({ fieldType: field.type }, 'Tipo de campo não suportado');
    }
  } catch (error) {
    logger.error(error, `Erro ao preencher campo ${field.name}`);
    throw error;
  }
}

/**
 * Submete formulário
 */
export async function submitForm(page: Page, submitSelector: string): Promise<boolean> {
  logger.info('Submetendo formulário...');

  try {
    await page.click(submitSelector);
    await delay(2000); // Aguarda processamento

    // Verifica se houve erro
    const errorElement = await page.$('[role="alert"]');
    if (errorElement) {
      const errorText = await errorElement.textContent();
      logger.error({ error: errorText }, 'Erro ao submeter formulário');
      return false;
    }

    logger.info('✅ Formulário submetido com sucesso');
    return true;
  } catch (error) {
    logger.error(error, 'Erro ao submeter formulário');
    return false;
  }
}
