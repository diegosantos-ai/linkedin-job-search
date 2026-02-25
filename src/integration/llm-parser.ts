import axios from 'axios';
import { logger } from '../logger/index.js';

export interface EnrichedJobData {
    tech_stack: string[];
    experience_level: 'Junior' | 'Pleno' | 'Senior' | 'Especialista' | 'Desconhecido';
    modality: 'Remoto' | 'Hibrido' | 'Presencial' | 'Desconhecido';
    fit_score: number;
}

export async function parseJobDescriptionWithLLM(description: string, resumeContent?: string): Promise<EnrichedJobData> {
    const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || process.env.GOOGLE_SHEETS_API_KEY;
    if (!apiKey) {
        logger.warn('Nenhuma API key de IA encontrada. Pulando parsing enriquecido.');
        return { tech_stack: [], experience_level: 'Desconhecido', modality: 'Desconhecido', fit_score: 0 };
    }

    // Se usar OpenAI
    if (process.env.OPENAI_API_KEY) {
        return parseWithOpenAI(description, apiKey, resumeContent);
    }

    // Padrão assumido: Google Gemini (mesmo usado no n8n)
    return parseWithGemini(description, apiKey, resumeContent);
}

async function parseWithGemini(description: string, apiKey: string, resumeContent?: string): Promise<EnrichedJobData> {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    let systemPrompt = `Você é um analista de recrutamento sênior de TI e Dados. Leia a descrição da vaga e retorne EXATAMENTE UM JSON com os atributos extraídos, nada além disso.\nFormato esperado: {"tech_stack": [lista de tecnologias em string], "experience_level": "string", "modality": "string", "fit_score": numero decimal 0-100}`;

    if (resumeContent) {
        systemPrompt += `\nCalcule o fit_score avaliando as techs da vaga contra as do currículo: ${resumeContent}`;
    } else {
        systemPrompt += `\nCalcule o fit_score avaliando o fit genérico apenas com foco em Dados, IA, Automação.`;
    }

    const payload = {
        contents: [{
            parts: [
                { text: systemPrompt },
                { text: `Descrição da vaga: ${description}` }
            ]
        }],
        generationConfig: {
            temperature: 0.1, // baixa temperatura para saídas previsíveis
            responseMimeType: 'application/json'
        }
    };

    try {
        const res = await axios.post(endpoint, payload);
        const textOutput = res.data.candidates[0].content.parts[0].text;
        const jsonStr = textOutput.replace(/```json|```/g, '').trim();
        return JSON.parse(jsonStr) as EnrichedJobData;
    } catch (error: any) {
        logger.error({ error: error.message }, 'Erro ao parsear job com Gemini API');
        return { tech_stack: [], experience_level: 'Desconhecido', modality: 'Desconhecido', fit_score: 0 };
    }
}

async function parseWithOpenAI(description: string, apiKey: string, resumeContent?: string): Promise<EnrichedJobData> {
    const endpoint = 'https://api.openai.com/v1/chat/completions';

    let systemPrompt = 'Você é um assistente experiente em recrutamento Tech. Analise essa vaga e gere apenas JSON. Formato esperado: {"tech_stack": [string], "experience_level": "Junior|Pleno|Senior|Desconhecido", "modality": "Remoto|Hibrido|Presencial", "fit_score": numero}';
    if (resumeContent) systemPrompt += ` Currículo do candidato: ${resumeContent}`;

    try {
        const res = await axios.post(endpoint, {
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: description }
            ],
            temperature: 0.1,
            response_format: { type: 'json_object' }
        }, {
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });

        const output = res.data.choices[0].message.content;
        return JSON.parse(output) as EnrichedJobData;
    } catch (error: any) {
        logger.error({ error: error.message }, 'Erro ao parsear job com OpenAI API');
        return { tech_stack: [], experience_level: 'Desconhecido', modality: 'Desconhecido', fit_score: 0 };
    }
}
