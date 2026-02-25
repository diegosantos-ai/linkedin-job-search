import { Page } from 'playwright';
import { logger } from '../logger/index.js';
import { humanDelay, readingDelay } from '../utils/delay.js';

export interface ScraperFilters {
    keywords: string;
    location: string;
    experienceLevel?: string; // e.g., "1,2,3"
    remote?: string; // e.g., "2" for remote
    timeRange?: string; // e.g., "r86400" for 24h
}

export async function buildSearchUrl(filters: ScraperFilters): Promise<string> {
    const baseUrl = 'https://www.linkedin.com/jobs/search/';
    const params = new URLSearchParams();

    if (filters.keywords) params.append('keywords', filters.keywords);
    if (filters.location) params.append('location', filters.location);
    if (filters.experienceLevel) params.append('f_E', filters.experienceLevel);
    if (filters.remote) params.append('f_WT', filters.remote);
    params.append('f_TPR', filters.timeRange || 'r86400');
    params.append('position', '1');
    params.append('pageNum', '0');

    return `${baseUrl}?${params.toString()}`;
}

export async function scrapeJobLinks(page: Page, url: string, maxJobs: number = 25): Promise<string[]> {
    logger.info({ url }, 'Iniciando extração de vagas com Stealth...');

    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await humanDelay(3000, 0.4);

    const jobLinks = new Set<string>();

    // Rolar a página para carregar as vagas dinamicamente
    for (let i = 0; i < 5; i++) {
        await page.evaluate(() => window.scrollBy(0, document.body.scrollHeight));
        await humanDelay(2000, 0.5);

        const links = await page.$$eval(
            'a.base-card__full-link, a.job-card-container__link',
            anchors => anchors.map(a => (a as HTMLAnchorElement).href)
        );

        links.forEach(link => {
            // Limpar tracking params da URL da vaga
            const cleanLink = link.split('?')[0];
            if (cleanLink.includes('/view/')) {
                jobLinks.add(cleanLink);
            }
        });

        if (jobLinks.size >= maxJobs) break;
    }

    logger.info({ count: jobLinks.size }, 'Vagas extraídas da busca');
    return Array.from(jobLinks).slice(0, maxJobs);
}

export async function getJobDetails(page: Page, jobUrl: string) {
    logger.info({ jobUrl }, 'Acessando detalhes da vaga...');
    await page.goto(jobUrl, { waitUntil: 'domcontentloaded' });
    await readingDelay(); // Simula um humano lendo a vaga

    // Clica no botão "Show more" se existir para expandir a descrição
    try {
        const showMoreBtn = await page.$('button.show-more-less-html__button');
        if (showMoreBtn) {
            await showMoreBtn.click();
            await humanDelay(1000);
        }
    } catch (error) {
        // Ignora, o botão pode não estar presente
    }

    const jobData = await page.evaluate(() => {
        const title = document.querySelector('h1.top-card-layout__title')?.textContent?.trim();
        const company = document.querySelector('a.topcard__org-name-link')?.textContent?.trim();
        const location = document.querySelector('span.topcard__flavor--bullet')?.textContent?.trim();

        // Pega a descrição completa em texto limpo (inner text) para jogar no LLM
        const descriptionElement = document.querySelector('div.description__text, div.show-more-less-html__markup');
        const description = descriptionElement ? (descriptionElement as HTMLElement).innerText : '';

        const applicantsMatches = document.body.innerText.match(/(\d+)\s+candidatos|(\d+)\s+applicants/i);
        const applicants = applicantsMatches ? parseInt(applicantsMatches[1] || applicantsMatches[2]) : null;

        return { title, company, location, description, applicants };
    });

    return { ...jobData, url: jobUrl };
}
