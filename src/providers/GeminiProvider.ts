import axios from 'axios';
import { ImageProvider } from './types';
import { GenerateImageRequest } from '../types';
import { config } from '../config/env';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';

export class GeminiProvider implements ImageProvider {
    name = 'gemini';
    private apiKey: string;
    // Using the Imagen 4.0 model available in AI Studio
    private apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-preview-06-06:predict';

    constructor() {
        this.apiKey = config.GEMINI_API_KEY || '';
        if (!this.apiKey) {
            logger.warn('Gemini API Key is missing. Provider will fail if used.');
        }
    }

    async generateImage(request: GenerateImageRequest): Promise<string> {
        if (!this.apiKey) {
            throw new AppError('Gemini API Key not configured', 500);
        }

        try {
            // Imagen API payload structure
            const response = await axios.post(
                `${this.apiUrl}?key=${this.apiKey}`,
                {
                    instances: [
                        {
                            prompt: request.prompt
                        }
                    ],
                    parameters: {
                        sampleCount: 1,
                        aspectRatio: "1:1"
                    }
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            // Response structure for Imagen:
            // { predictions: [ { bytesBase64Encoded: "..." } ] }

            const prediction = response.data.predictions?.[0];
            const imageBase64 = prediction?.bytesBase64Encoded;

            if (imageBase64) {
                return imageBase64;
            }

            throw new AppError('Gemini/Imagen did not return a base64 image', 502);

        } catch (error: any) {
            logger.error(error, 'Gemini Image Generation Failed');
            const msg = error.response?.data?.error?.message || error.message || 'Gemini generation failed';
            throw new AppError(`Gemini Provider Error: ${msg}`, error.response?.status || 502);
        }
    }
}
