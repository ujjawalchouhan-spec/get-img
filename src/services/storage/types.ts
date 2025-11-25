export interface StorageProvider {
    name: string;
    uploadImage(base64Data: string): Promise<string>;
}

export type StorageProviderName = 'aws' | 'supabase';
