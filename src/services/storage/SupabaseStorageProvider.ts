import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../../config/env';
import { logger } from '../../utils/logger';
import crypto from 'crypto';
import { StorageProvider } from './types';

export class SupabaseStorageProvider implements StorageProvider {
    name = 'supabase';
    private supabase: SupabaseClient;
    private bucketName: string;

    constructor() {
        const supabaseUrl = config.SUPABASE_URL || '';
        const supabaseKey = config.SUPABASE_KEY || '';
        this.bucketName = config.SUPABASE_BUCKET_NAME || 'images';

        if (!supabaseUrl || !supabaseKey) {
            logger.warn('Supabase credentials missing. SupabaseStorageProvider will fail.');
        }

        this.supabase = createClient(supabaseUrl, supabaseKey);
    }

    async uploadImage(base64Data: string): Promise<string> {
        const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Image, 'base64');
        const fileName = `${crypto.randomUUID()}.png`;

        try {
            // Ensure bucket exists
            const { data: bucketData, error: bucketError } = await this.supabase
                .storage
                .getBucket(this.bucketName);

            if (bucketError) {
                // Try to create if not found
                logger.info(`Bucket '${this.bucketName}' not found, attempting to create...`);
                const { data: newBucket, error: createError } = await this.supabase
                    .storage
                    .createBucket(this.bucketName, {
                        public: true
                    });

                if (createError) {
                    logger.error(createError, 'Failed to create bucket');
                    // Continue anyway, maybe it exists but we can't see it (RLS), let upload fail if so
                } else {
                    logger.info(`Bucket '${this.bucketName}' created successfully.`);
                }
            }

            const { data, error } = await this.supabase
                .storage
                .from(this.bucketName)
                .upload(fileName, buffer, {
                    contentType: 'image/png',
                    upsert: false
                });

            if (error) {
                throw error;
            }

            const { data: publicUrlData } = this.supabase
                .storage
                .from(this.bucketName)
                .getPublicUrl(fileName);

            const url = publicUrlData.publicUrl;
            logger.info(`Image uploaded to Supabase Storage: ${url}`);
            return url;

        } catch (error: any) {
            logger.error(error, 'Supabase Upload Failed');
            throw new Error(`Failed to upload image to Supabase: ${error.message}`);
        }
    }
}
