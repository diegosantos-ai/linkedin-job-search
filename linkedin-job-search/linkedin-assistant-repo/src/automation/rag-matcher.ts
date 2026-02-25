import { logger } from '../logger/index.js';
import ragDatabase from '../../config/rag-database.json' assert { type: 'json' };
import type { FormField } from '../types/index.js';

/**
 * RAG (Retrieval-Augmented Generation) Matcher
 * Compara perguntas de formulários com base de respostas
 * usando similarity matching
 */

export interface RAGMatch {
  question: string;
  answer: string;
  confidence: number;
  responseId: string;
  category: string;
}

export interface RAGResult {
  matched: boolean;
  match?: RAGMatch;
  shouldAskUser: boolean;
  reason?: string;
}

/**
 * Busca resposta na base RAG para um campo do formulário
 */
export async function findRAGAnswer(field: FormField): Promise<RAGResult> {
  const question = field.label || field.name;

  if (!question) {
    return {
      matched: false,
      shouldAskUser: true,
      reason: 'Campo sem label/nome identificável',
    };
  }

  logger.debug({ question }, 'Buscando match RAG...');

  // Busca por similaridade
  const matches = ragDatabase.responses
    .map(response => ({
      ...response,
      similarity: calculateSimilarity(question.toLowerCase(), response.question.toLowerCase()),
    }))
    .filter(m => m.similarity > 0)
    .sort((a, b) => b.similarity - a.similarity);

  if (matches.length === 0) {
    logger.debug('Nenhum match encontrado na base RAG');
    return {
      matched: false,
      shouldAskUser: true,
      reason: 'Pergunta não encontrada na base de conhecimento',
    };
  }

  const bestMatch = matches[0];
  const effectiveConfidence = Math.min(bestMatch.confidence, bestMatch.similarity);

  logger.debug({
    question,
    matchedTo: bestMatch.question,
    similarity: bestMatch.similarity,
    confidence: effectiveConfidence,
  }, 'Match encontrado');

  // Threshold de confiança para auto-fill
  const MIN_AUTO_FILL_CONFIDENCE = 0.80;

  if (effectiveConfidence >= MIN_AUTO_FILL_CONFIDENCE) {
    return {
      matched: true,
      match: {
        question: bestMatch.question,
        answer: bestMatch.answer,
        confidence: effectiveConfidence,
        responseId: bestMatch.id,
        category: bestMatch.category,
      },
      shouldAskUser: false,
    };
  }

  // Confidence médio: sugere resposta mas marca para review
  if (effectiveConfidence >= 0.60) {
    return {
      matched: true,
      match: {
        question: bestMatch.question,
        answer: bestMatch.answer,
        confidence: effectiveConfidence,
        responseId: bestMatch.id,
        category: bestMatch.category,
      },
      shouldAskUser: true,
      reason: 'Confiança média - requer validação',
    };
  }

  // Confidence baixo: não usa, solicita manual
  return {
    matched: false,
    shouldAskUser: true,
    reason: `Confiança baixa (${(effectiveConfidence * 100).toFixed(0)}%)`,
  };
}

/**
 * Calcula similaridade entre duas strings
 * Usa Jaccard similarity baseado em palavras
 */
function calculateSimilarity(str1: string, str2: string): number {
  // Tokeniza em palavras
  const words1 = new Set(str1.split(/\s+/).filter(w => w.length > 2));
  const words2 = new Set(str2.split(/\s+/).filter(w => w.length > 2));

  if (words1.size === 0 || words2.size === 0) {
    return 0;
  }

  // Calcula Jaccard similarity
  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);

  const jaccardSimilarity = intersection.size / union.size;

  // Bonus se substring direta
  const substringBonus = str1.includes(str2) || str2.includes(str1) ? 0.2 : 0;

  return Math.min(1.0, jaccardSimilarity + substringBonus);
}

/**
 * Adiciona nova resposta à base RAG (para aprendizado contínuo)
 */
export function addToRAGDatabase(
  question: string,
  _answer: string,
  category: string = 'custom'
): void {
  logger.info({ question, category }, 'Nova resposta adicionada à base RAG');

  // TODO: Implementar persistência (salvar em arquivo JSON ou DB)
  // Por enquanto apenas loga para tracking
}
