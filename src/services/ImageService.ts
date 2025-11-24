import { ImageProvider } from '../providers/types';
import { OpenAIProvider } from '../providers/OpenAIProvider';
import { GeminiProvider } from '../providers/GeminiProvider';
import { StabilityProvider } from '../providers/StabilityProvider';
import { storageService } from './StorageService';
import { GenerateImageRequest, GenerateImageResponse, ProviderName } from '../types';
import { config } from '../config/env';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';

export class ImageService {
    private providers: Map<string, ImageProvider>;

    constructor() {
        this.providers = new Map();
        this.providers.set('openai', new OpenAIProvider());
        this.providers.set('gemini', new GeminiProvider());
        this.providers.set('stability', new StabilityProvider());
    }

    async generateImage(request: GenerateImageRequest): Promise<GenerateImageResponse> {
        // 1. Select Provider
        // Logic can be extended here (e.g., load balancing, cost optimization, fallback)
        // For now, we use the default from config, or fallback to 'openai'
        const providerName = config.DEFAULT_PROVIDER as ProviderName;
        const provider = this.providers.get(providerName);

        if (!provider) {
            throw new AppError(`Provider ${providerName} not found`, 500);
        }

        logger.info(`Selecting provider: ${providerName} for prompt: "${request.prompt.substring(0, 20)}..."`);

        // 2. Call Provider
        try {
            const imageBase64 = await provider.generateImage(request);

            // Upload to S3
            let imageUrl: string | undefined;
            try {
                imageUrl = await storageService.uploadImage(imageBase64);
            } catch (uploadError: any) {
                logger.error(uploadError, 'Failed to upload to S3, returning base64 only');
                // We can choose to fail hard or fallback. 
                // For now, let's log and return base64 so the user at least gets the image.
            }

            return {
                success: true,
                providerUsed: providerName,
                imageBase64: imageUrl ? undefined : imageBase64, // If uploaded, maybe don't send base64 to save bandwidth? Or send both?
                // User asked to "store it to s3 and then want to share the permanent URl".
                // Let's prefer returning just the URL if upload succeeds, to keep response light.
                imageUrl: imageUrl
            };
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError('Image generation failed', 500);
        }
    }
}

export const imageService = new ImageService();
