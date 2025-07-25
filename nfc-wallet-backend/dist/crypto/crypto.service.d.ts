import { ConfigService } from '@nestjs/config';
export declare class CryptoService {
    private configService;
    private readonly encryptionKey;
    constructor(configService: ConfigService);
    generateWallet(): Promise<{
        address: string;
        privateKey: string;
        ethAddress: string;
        publicKey: string;
    }>;
    encryptData(data: string): Promise<string>;
    encrypt(privateKey: string): string;
    decrypt(encryptedData: string): string;
    hashApiKey(apiKey: string): string;
    generateApiKey(prefix?: string): string;
    generateInjectiveWallet(): {
        privateKey: string;
        address: string;
        ethAddress: string;
        publicKey: string;
    };
    validatePrivateKey(privateKey: string): boolean;
}
