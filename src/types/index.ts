/**
 * Global Types for LinkedIn Assistant
 */

/**
 * Job data structure from Google Sheets
 */
export interface JobListing {
  id: string;
  title: string;
  link: string;
  company: string;
  location: string;
  salary?: string;
  description?: string;
  postedDate?: string;
  rawData: Record<string, any>;
}

/**
 * Application result
 */
export interface ApplicationResult {
  jobId: string;
  status: 'applied' | 'failed' | 'skipped' | 'pending';
  appliedAt?: Date;
  error?: string;
  retries: number;
  formData?: Record<string, any>;
  reviewUrl?: string;
}

/**
 * Form detection result
 */
export interface FormField {
  name: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file' | 'hidden' | 'email' | 'phone';
  label?: string;
  required: boolean;
  value?: string;
  options?: string[];
  selector: string;
}

export interface FormAnalysis {
  fields: FormField[];
  submitSelector: string;
  hasError: boolean;
  errorMessage?: string;
}

/**
 * Configuration
 */
export interface AppConfig {
  linkedin: {
    email: string;
    password: string;
  };
  sheets: {
    apiKey: string;
    spreadsheetId: string;
    jobsSheet: string;
    applicationsSheet: string;
    manualReviewSheet: string;
  };
  app: {
    maxApplicationsPerDay: number;
    maxRetries: number;
    headless: boolean;
    browserTimeout: number;
    proxyUrl?: string;
  };
}

/**
 * Logging context
 */
export interface LogContext {
  jobId?: string;
  timestamp?: Date;
  duration?: number;
  userId?: string;
  [key: string]: any;
}
