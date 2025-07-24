import { ConfigService } from '@nestjs/config';
export declare class CryptoService {
    private configService;
    private readonly encryptionKey;
    constructor(configService: ConfigService);
    encrypt(privateKey: string): string;
    decrypt(encryptedData: string): string;
    hashApiKey(apiKey: string): string;
    generateApiKey(prefix?: string): string;
    validatePrivateKey(privateKey: string): boolean;
}
