import { describe, it, expect } from 'vitest';
import {
  validateJobListing,
  validateApplicationResult,
  validateAppConfig,
  isLinkedInUrl,
  isValidScore,
} from '../utils/validators';

describe('Validators - Job Listing', () => {
  it('deve validar job listing válido', () => {
    const job = {
      id: 'job-123',
      title: 'Engenheiro de Dados',
      link: 'https://www.linkedin.com/jobs/view/123456',
      company: 'Tech Corp',
      location: 'Brasil - Remoto',
    };

    expect(() => validateJobListing(job)).not.toThrow();
  });

  it('deve rejeitar job com URL inválida', () => {
    const job = {
      id: 'job-123',
      title: 'Engenheiro',
      link: 'https://google.com/invalid',
      company: 'Corp',
    };

    expect(() => validateJobListing(job)).toThrow();
  });

  it('deve rejeitar job sem ID', () => {
    const job = {
      title: 'Engenheiro',
      link: 'https://www.linkedin.com/jobs/view/123',
      company: 'Corp',
    };

    expect(() => validateJobListing(job)).toThrow();
  });
});

describe('Validators - Application Result', () => {
  it('deve validar application result válido', () => {
    const result = {
      jobId: 'job-123',
      status: 'applied' as const,
      appliedAt: new Date(),
      retries: 0,
    };

    expect(() => validateApplicationResult(result)).not.toThrow();
  });

  it('deve rejeitar status inválido', () => {
    const result = {
      jobId: 'job-123',
      status: 'invalid-status',
      retries: 0,
    };

    expect(() => validateApplicationResult(result)).toThrow();
  });

  it('deve rejeitar retries negativo', () => {
    const result = {
      jobId: 'job-123',
      status: 'failed' as const,
      retries: -1,
    };

    expect(() => validateApplicationResult(result)).toThrow();
  });
});

describe('Validators - App Config', () => {
  it('deve validar config completo', () => {
    const config = {
      linkedin: {
        email: 'user@example.com',
        password: 'password123',
      },
      sheets: {
        apiKey: 'test-key',
        spreadsheetId: 'spreadsheet-id',
        jobsSheet: 'Vagas',
        applicationsSheet: 'Candidaturas',
      },
      app: {
        maxApplicationsPerDay: 50,
        maxRetries: 3,
        headless: true,
        browserTimeout: 30000,
      },
    };

    expect(() => validateAppConfig(config)).not.toThrow();
  });

  it('deve aplicar defaults', () => {
    const config = {
      linkedin: {
        email: 'user@example.com',
        password: 'password123',
      },
      sheets: {
        apiKey: 'test-key',
        spreadsheetId: 'spreadsheet-id',
      },
      app: {},
    };

    const validated = validateAppConfig(config);
    expect(validated.app.maxApplicationsPerDay).toBe(50);
    expect(validated.app.maxRetries).toBe(3);
    expect(validated.app.headless).toBe(true);
  });

  it('deve rejeitar email inválido', () => {
    const config = {
      linkedin: {
        email: 'invalid-email',
        password: 'password123',
      },
      sheets: {
        apiKey: 'test-key',
        spreadsheetId: 'spreadsheet-id',
      },
      app: {},
    };

    expect(() => validateAppConfig(config)).toThrow();
  });
});

describe('Validators - URL Helpers', () => {
  it('deve identificar URL do LinkedIn', () => {
    expect(isLinkedInUrl('https://www.linkedin.com/jobs/view/123')).toBe(true);
    expect(isLinkedInUrl('https://linkedin.com/in/profile')).toBe(true);
  });

  it('deve rejeitar URLs de outros sites', () => {
    expect(isLinkedInUrl('https://google.com')).toBe(false);
    expect(isLinkedInUrl('https://twitter.com/jobs')).toBe(false);
  });

  it('deve rejeitar URLs malformadas', () => {
    expect(isLinkedInUrl('not-a-url')).toBe(false);
  });
});

describe('Validators - Score', () => {
  it('deve validar scores válidos', () => {
    expect(isValidScore(0)).toBe(true);
    expect(isValidScore(50)).toBe(true);
    expect(isValidScore(100)).toBe(true);
  });

  it('deve rejeitar scores fora do range', () => {
    expect(isValidScore(-1)).toBe(false);
    expect(isValidScore(101)).toBe(false);
  });
});
