import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { imageService } from '../services/ImageService';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';

const generateImageSchema = z.object({
    prompt: z.string().min(1, 'Prompt is required').max(1000, 'Prompt is too long'),
    referenceImages: z.array(z.string()).optional(),
});

export const generateImage = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // 1. Validate Request
        console.log(`Received request body: ${JSON.stringify(req.body)}`);
        const validationResult = generateImageSchema.safeParse(req.body);

        if (!validationResult.success) {
            const errorMessage = validationResult.error.issues.map((e) => e.message).join(', ');
            throw new AppError(`Validation Error: ${errorMessage}`, 400);
        }

        const { prompt, referenceImages } = validationResult.data;

        // 2. Call Service
        const result = await imageService.generateImage({ prompt, referenceImages });

        // 3. Send Response
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};
