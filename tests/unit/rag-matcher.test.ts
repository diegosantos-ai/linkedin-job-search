import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateSimilarity, findRAGAnswer, addToRAGDatabase } from '../automation/rag-matcher';
import ragDatabase from '../../config/rag-database.json';

describe('RAG Matcher - Similarity Calculation', () => {
  it('deve retornar 1.0 para strings idênticas', () => {
    const similarity = calculateSimilarity('Qual sua experiência?', 'Qual sua experiência?');
    expect(similarity).toBe(1.0);
  });

  it('deve retornar 0.0 para strings completamente diferentes', () => {
    const similarity = calculateSimilarity('Python', 'JavaScript');
    expect(similarity).toBeLessThan(0.3);
  });

  it('deve calcular Jaccard corretamente', () => {
    // "tenho python" vs "conheco python" = {tenho, python} vs {conheco, python}
    // Intersecção = {python} = 1
    // União = {tenho, python, conheco} = 3
    // Jaccard = 1/3 ≈ 0.33
    const similarity = calculateSimilarity('tenho python', 'conheco python');
    expect(similarity).toBeGreaterThan(0.3);
    expect(similarity).toBeLessThan(0.5);
  });

  it('deve dar bonus para substring exata', () => {
    const withBonus = calculateSimilarity('motivação trabalhar', 'Por que quer trabalhar conosco?');
    const withoutBonus = calculateSimilarity('xyz abc', 'Por que quer trabalhar conosco?');
    expect(withBonus).toBeGreaterThan(withoutBonus);
  });
});

describe('RAG Matcher - Find Answer', () => {
  it('deve retornar auto-fill com confiança ≥ 0.80', () => {
    const result = findRAGAnswer('Por que você quer trabalhar aqui?', ragDatabase);
    
    expect(result.action).toBe('auto-fill');
    expect(result.confidence).toBeGreaterThanOrEqual(0.80);
    expect(result.suggestedAnswer).toBeTruthy();
  });

  it('deve retornar suggest com confiança entre 0.60 e 0.80', () => {
    // Pergunta similar mas não idêntica
    const result = findRAGAnswer('Fale sobre sua motivação', ragDatabase);
    
    expect(['suggest', 'auto-fill']).toContain(result.action);
    expect(result.confidence).toBeGreaterThanOrEqual(0.60);
  });

  it('deve retornar manual-review com confiança < 0.60', () => {
    const result = findRAGAnswer('Qual seu número de RG?', ragDatabase);
    
    expect(result.action).toBe('manual-review');
    expect(result.confidence).toBeLessThan(0.60);
    expect(result.bestMatch).toBeUndefined();
  });

  it('deve retornar resposta vazia para database vazio', () => {
    const result = findRAGAnswer('Teste', []);
    
    expect(result.action).toBe('manual-review');
    expect(result.confidence).toBe(0);
  });
});

describe('RAG Matcher - Add to Database', () => {
  it('deve adicionar nova entrada corretamente', () => {
    const dbCopy = [...ragDatabase];
    const initialLength = dbCopy.length;

    addToRAGDatabase(dbCopy, {
      question: 'Qual linguagem você prefere?',
      answer: 'TypeScript',
      category: 'technical',
    });

    expect(dbCopy.length).toBe(initialLength + 1);
    
    const newEntry = dbCopy[dbCopy.length - 1];
    expect(newEntry.id).toBe(`custom-${initialLength + 1}`);
    expect(newEntry.question).toBe('Qual linguagem você prefere?');
    expect(newEntry.answer).toBe('TypeScript');
    expect(newEntry.category).toBe('technical');
    expect(newEntry.keywords).toEqual(expect.arrayContaining(['qual', 'linguagem']));
    expect(newEntry.confidence).toBe(0.85);
  });
});
