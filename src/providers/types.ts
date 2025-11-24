import { GenerateImageRequest } from '../types';

export interface ImageProvider {
    name: string;
    generateImage(request: GenerateImageRequest): Promise<string>; // Returns base64 image
}
