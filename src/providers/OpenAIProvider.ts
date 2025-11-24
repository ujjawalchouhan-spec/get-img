import axios from 'axios';
import { ImageProvider } from './types';
import { GenerateImageRequest } from '../types';
import { config } from '../config/env';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';

export class OpenAIProvider implements ImageProvider {
    name = 'openai';
    private apiKey: string;
    private apiUrl = 'https://api.openai.com/v1/images/generations';

    constructor() {
        this.apiKey = config.OPENAI_API_KEY || '';
        if (!this.apiKey) {
            logger.warn('OpenAI API Key is missing. Provider will fail if used.');
        }
    }

    async generateImage(request: GenerateImageRequest): Promise<string> {
        if (!this.apiKey) {
            throw new AppError('OpenAI API Key not configured', 500);
        }

        try {
            const response = await axios.post(
                this.apiUrl,
                {
                    model: 'dall-e-3',
                    prompt: request.prompt,
                    n: 1,
                    size: '1024x1024',
                    response_format: 'b64_json',
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            const imageBase64 = response.data.data[0].b64_json;
            if (!imageBase64) {
                throw new AppError('OpenAI did not return a base64 image', 502);
            }

            return imageBase64;
        } catch (error: any) {
            logger.error(error, 'OpenAI Image Generation Failed');
            const msg = error.response?.data?.error?.message || error.message || 'OpenAI generation failed';
            throw new AppError(`OpenAI Provider Error: ${msg}`, error.response?.status || 502);
        }
    }
}
