export interface GenerateImageRequest {
    prompt: string;
    referenceImages?: string[]; // Base64 strings
}

export interface GenerateImageResponse {
    success: boolean;
    providerUsed: ProviderName;
    imageBase64?: string; // Optional now
    imageUrl?: string;    // New field
}

export type ProviderName = 'openai' | 'gemini' | 'stability';
