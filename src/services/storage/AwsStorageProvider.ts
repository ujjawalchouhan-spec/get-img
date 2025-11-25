import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { config } from '../../config/env';
import { logger } from '../../utils/logger';
import crypto from 'crypto';
import { StorageProvider } from './types';

export class AwsStorageProvider implements StorageProvider {
    name = 'aws';
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
            this.s3Client = new S3Client({ region: this.region });
        }
    }

    async uploadImage(base64Data: string): Promise<string> {
        if (!this.bucketName) {
            throw new Error('AWS_S3_BUCKET_NAME is not configured');
        }

        const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Image, 'base64');
        const key = `${crypto.randomUUID()}.png`;

        try {
            const command = new PutObjectCommand({
                Bucket: this.bucketName,
                Key: key,
                Body: buffer,
                ContentType: 'image/png',
            });

            await this.s3Client.send(command);

            const url = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
            logger.info(`Image uploaded to AWS S3: ${url}`);
            return url;

        } catch (error: any) {
            logger.error(error, 'AWS S3 Upload Failed');
            throw new Error(`Failed to upload image to AWS S3: ${error.message}`);
        }
    }
}
