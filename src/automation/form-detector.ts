import type { Page } from 'playwright';
import { logger } from '../logger/index.js';
import type { FormField, FormAnalysis } from '../types/index.js';

/**
 * Detector de formulários de candidatura do LinkedIn
 * Identifica campos, tipos e estrutura de forms dinâmicos
 */

/**
 * Detecta e analisa formulário de candidatura na página
 */
export async function detectForm(page: Page): Promise<FormAnalysis> {
  logger.debug('Detectando formulário de candidatura...');

  try {
    // Aguarda modal/form aparecer
    await page.waitForSelector('form', { timeout: 10000 });

    const fields: FormField[] = [];

    // Detecta todos os inputs
    const inputs = await page.$$('form input:not([type="hidden"])');
    
    for (const input of inputs) {
      const field = await extractFieldInfo(input, page);
      if (field) {
        fields.push(field);
      }
    }

    // Detecta textareas
    const textareas = await page.$$('form textarea');
    for (const textarea of textareas) {
      const field = await extractTextareaInfo(textarea, page);
      if (field) {
        fields.push(field);
      }
    }

    // Detecta selects
    const selects = await page.$$('form select');
    for (const select of selects) {
      const field = await extractSelectInfo(select, page);
      if (field) {
        fields.push(field);
      }
    }

    // Detecta botão de submit
    const submitBtn = await page.$('button[type="submit"]') || 
                      await page.$('button[aria-label*="Submit"]');
    
    const submitSelector = submitBtn 
      ? await submitBtn.getAttribute('aria-label') || 'button[type="submit"]'
      : 'button[type="submit"]';

    logger.info({ fieldsCount: fields.length }, 'Formulário detectado');

    return {
      fields,
      submitSelector,
      hasError: false,
    };
  } catch (error) {
    logger.error(error, 'Erro ao detectar formulário');
    return {
      fields: [],
      submitSelector: '',
      hasError: true,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Extrai informações de um campo input
 */
async function extractFieldInfo(element: any, page: Page): Promise<FormField | null> {
  try {
    const name = await element.getAttribute('name') || await element.getAttribute('id') || '';
    const type = (await element.getAttribute('type')) as FormField['type'] || 'text';
    const required = (await element.getAttribute('required')) !== null || 
                    (await element.getAttribute('aria-required')) === 'true';
    
    // Busca label associado
    const labelElement = await page.$(`label[for="${await element.getAttribute('id')}"]`);
    const label = labelElement ? await labelElement.textContent() : name;

    return {
      name,
      type,
      label: label?.trim() || undefined,
      required,
      selector: `input[name="${name}"]`,
    };
  } catch {
    return null;
  }
}

/**
 * Extrai informações de textarea
 */
async function extractTextareaInfo(element: any, page: Page): Promise<FormField | null> {
  try {
    const name = await element.getAttribute('name') || await element.getAttribute('id') || '';
    const required = (await element.getAttribute('required')) !== null;

    const labelElement = await page.$(`label[for="${await element.getAttribute('id')}"]`);
    const label = labelElement ? await labelElement.textContent() : name;

    return {
      name,
      type: 'textarea',
      label: label?.trim() || undefined,
      required,
      selector: `textarea[name="${name}"]`,
    };
  } catch {
    return null;
  }
}

/**
 * Extrai informações de select
 */
async function extractSelectInfo(element: any, page: Page): Promise<FormField | null> {
  try {
    const name = await element.getAttribute('name') || await element.getAttribute('id') || '';
    const required = (await element.getAttribute('required')) !== null;

    // Extrai opções
    const options = await element.$$eval('option', (opts: HTMLOptionElement[]) =>
      opts.map(o => o.value || o.textContent?.trim() || '')
    );

    const labelElement = await page.$(`label[for="${await element.getAttribute('id')}"]`);
    const label = labelElement ? await labelElement.textContent() : name;

    return {
      name,
      type: 'select',
      label: label?.trim() || undefined,
      required,
      options,
      selector: `select[name="${name}"]`,
    };
  } catch {
    return null;
  }
}

/**
 * Verifica se campo é reconhecido/comum
 */
export function isKnownField(field: FormField): boolean {
  const knownFields = [
    'firstName',
    'lastName',
    'email',
    'phone',
    'location',
    'resume',
    'coverLetter',
    'linkedin',
    'portfolio',
    'github',
  ];

  return knownFields.some(known => 
    field.name.toLowerCase().includes(known.toLowerCase())
  );
}
