import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { config } from '../config/env';
import { logger } from '../utils/logger';
import crypto from 'crypto';

export class StorageService {
    private s3Client: S3Client;
    private bucketName: string;
    private region: string;

    constructor() {
        this.region = config.AWS_REGION || 'us-east-1';
        this.bucketName = config.AWS_S3_BUCKET_NAME || '';

        if (config.AWS_ACCESS_KEY_ID && config.AWS_SECRET_ACCESS_KEY) {
            this.s3Client = new S3Client({
                region: this.region,
                credentials: {
                    accessKeyId: config.AWS_ACCESS_KEY_ID,
                    secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
                },
            });
        } else {
            // Fallback or error if credentials missing, though we might want to allow 
            // instantiation and fail on upload if optional.
            logger.warn('AWS Credentials not fully configured. StorageService may fail.');
            this.s3Client = new S3Client({ region: this.region });
        }
    }

    async uploadImage(base64Data: string): Promise<string> {
        if (!this.bucketName) {
            throw new Error('AWS_S3_BUCKET_NAME is not configured');
        }

        // Remove header if present (e.g., "data:image/png;base64,")
        const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Image, 'base64');

        const key = `${crypto.randomUUID()}.png`;

        try {
            const command = new PutObjectCommand({
                Bucket: this.bucketName,
                Key: key,
                Body: buffer,
                ContentType: 'image/png',
                // ACL: 'public-read', // Optional: depends on bucket settings. 
                // Modern S3 often blocks public ACLs by default, preferring Bucket Policy.
            });

            await this.s3Client.send(command);

            // Construct URL
            const url = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
            logger.info(`Image uploaded to S3: ${url}`);
            return url;

        } catch (error: any) {
            logger.error(error, 'S3 Upload Failed');
            throw new Error(`Failed to upload image to S3: ${error.message}`);
        }
    }
}

export const storageService = new StorageService();
