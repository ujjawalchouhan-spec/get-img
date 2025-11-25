import { config } from '../config/env';
import { logger } from '../utils/logger';
import { StorageProvider, StorageProviderName } from './storage/types';
import { AwsStorageProvider } from './storage/AwsStorageProvider';
import { SupabaseStorageProvider } from './storage/SupabaseStorageProvider';

export class StorageService {
    private provider: StorageProvider;

    constructor() {
        const providerName = config.STORAGE_PROVIDER as StorageProviderName;

        switch (providerName) {
            case 'aws':
                this.provider = new AwsStorageProvider();
                break;
            case 'supabase':
                this.provider = new SupabaseStorageProvider();
                break;
            default:
                logger.warn(`Unknown storage provider: ${providerName}, defaulting to Supabase`);
                this.provider = new SupabaseStorageProvider();
        }

        logger.info(`Storage Service initialized with provider: ${this.provider.name}`);
    }

    async uploadImage(base64Data: string): Promise<string> {
        return this.provider.uploadImage(base64Data);
    }
}

export const storageService = new StorageService();
