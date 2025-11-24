import axios from 'axios';
import FormData from 'form-data';
import { ImageProvider } from './types';
import { GenerateImageRequest } from '../types';
import { config } from '../config/env';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';

export class StabilityProvider implements ImageProvider {
    name = 'stability';
    private apiKey: string;
    private apiUrl = 'https://api.stability.ai/v2beta/stable-image/generate/core';

    constructor() {
        this.apiKey = config.STABILITY_API_KEY || '';
        if (!this.apiKey) {
            logger.warn('Stability API Key is missing. Provider will fail if used.');
        }
    }

    async generateImage(request: GenerateImageRequest): Promise<string> {
        if (!this.apiKey) {
            throw new AppError('Stability API Key not configured', 500);
        }

        try {
            const formData = new FormData();
            formData.append('prompt', request.prompt);
            formData.append('output_format', 'png');

            // If we had reference images, we would append them here
            // if (request.referenceImages?.[0]) { ... }

            const response = await axios.post(
                this.apiUrl,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${this.apiKey}`,
                        Accept: 'application/json',
                        ...formData.getHeaders(),
                    },
                }
            );

            // Stability returns base64 in the JSON response for 'core' endpoint if requested?
            // Actually the 'core' endpoint usually returns bytes or base64 depending on Accept header.
            // With Accept: application/json, it returns { image: "base64..." }

            const imageBase64 = response.data.image;
            if (!imageBase64) {
                throw new AppError('Stability AI did not return a base64 image', 502);
            }

            return imageBase64;
        } catch (error: any) {
            logger.error(error, 'Stability AI Image Generation Failed');
            const msg = error.response?.data?.errors?.[0]?.message || error.message || 'Stability generation failed';
            throw new AppError(`Stability Provider Error: ${msg}`, error.response?.status || 502);
        }
    }
}
