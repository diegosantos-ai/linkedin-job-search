import 'dotenv/config';
import { logger } from './logger/index.js';
import { launchBrowser, createContext, createPage, closeBrowser } from './automation/browser.js';
import { buildSearchUrl, scrapeJobLinks, getJobDetails, ScraperFilters } from './automation/scraper.js';
import { parseJobDescriptionWithLLM } from './integration/llm-parser.js';
import { saveJobsToSheets } from './integration/sheets.js';
import { AppConfig } from './types/index.js';

async function runScraper() {
    logger.info('Iniciando o Stealth Scraper do LinkedIn...');

    const config: AppConfig = {
        linkedin: {
            email: process.env.LINKEDIN_EMAIL || '',
            password: process.env.LINKEDIN_PASSWORD || ''
        },
        sheets: {
            apiKey: process.env.GOOGLE_SHEETS_API_KEY || '',
            spreadsheetId: process.env.GOOGLE_SHEETS_ID || '',
            jobsSheet: process.env.GOOGLE_SHEETS_JOBS_SHEET || 'Vagas',
            applicationsSheet: process.env.GOOGLE_SHEETS_APPLICATIONS_SHEET || 'Candidaturas',
            manualReviewSheet: 'Revisa'
        },
        app: {
            maxApplicationsPerDay: Number(process.env.MAX_APPLICATIONS_PER_DAY) || 50,
            maxRetries: Number(process.env.RETRY_ATTEMPTS) || 3,
            headless: process.env.HEADLESS !== 'false',
            browserTimeout: Number(process.env.BROWSER_TIMEOUT) || 30000,
            proxyUrl: process.env.PROXY_URL,
        }
    };

    const filters: ScraperFilters = {
        keywords: '"Data Engineer" OR "Analista de Dados" OR "Desenvolvedor RPA"',
        location: 'Brasil', // Ou 'Remoto'
        experienceLevel: '1,2,3', // Entry, Associate, Mid-Senior
        timeRange: 'r86400', // Últimas 24h
    };

    try {
        const browser = await launchBrowser(config);
        const context = await createContext(browser);
        const page = await createPage(context);

        // 1. Construir a URL de Busca altamente filtrada
        const url = await buildSearchUrl(filters);
        logger.info({ url }, 'URL de busca gerada');

        // 2. Extrair Links Prontos
        const jobLinks = await scrapeJobLinks(page, url, 10); // buscando 10 como exemplo

        // 3. Obter Detalhes da Vaga
        const jobsData = [];
        for (const link of jobLinks) {
            const details = await getJobDetails(page, link);

            // Filtrar vagas com menos de 50 candidatos
            if (details.applicants === null || details.applicants < 50) {
                logger.info({ title: details.title, applicants: details.applicants, link: link }, 'Vaga excelente encontrada (Low Competition). Analisando com IA...');
                const enriched = await parseJobDescriptionWithLLM(details.description || '');

                jobsData.push({
                    ...details,
                    enriched_data: enriched
                });

                logger.info({
                    tech_stack: enriched.tech_stack.slice(0, 3).join(', ') + '...',
                    level: enriched.experience_level,
                    score: enriched.fit_score
                }, 'Resultado do Parser IA');

            } else {
                logger.debug({ title: details.title, applicants: details.applicants }, 'Vaga ignorada (Alta Concorrência)');
            }
        }

        if (jobsData.length > 0 && config.sheets.apiKey) {
            logger.info('Salvando vagas filtradas no Google Sheets...');
            await saveJobsToSheets(config.sheets, jobsData);
        } else if (jobsData.length === 0) {
            logger.warn('Nenhuma vaga atendeu aos critérios (< 50 candidatos). Nada para salvar.');
        } else {
            logger.error('API Key do Google Sheets não configurada no .env. Impossível salvar.');
        }

        // Fechar recursos
        await closeBrowser();

    } catch (err) {
        logger.error(err, 'Falha fatal durante scraping');
        await closeBrowser();
        process.exit(1);
    }
}

// In ESM, import.meta.url is a file:// URL, but process.argv[1] is a regular path.
// Simplificando o runner para rodar sempre que chamado.
runScraper();

export { runScraper };
