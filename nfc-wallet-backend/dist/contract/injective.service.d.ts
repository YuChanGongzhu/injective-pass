import { ConfigService } from '@nestjs/config';
export declare class InjectiveService {
    private configService;
    private readonly masterPrivateKey;
    private readonly network;
    private readonly endpoints;
    constructor(configService: ConfigService);
    private getChainId;
    generateInjectiveWallet(): {
        privateKey: string;
        address: string;
        ethAddress: string;
        publicKey: string;
    };
    getWalletFromPrivateKey(privateKeyHex: string): {
        address: string;
        ethAddress: string;
        publicKey: string;
    };
    convertAddresses(input: string): {
        injectiveAddress: string;
        ethereumAddress: string;
    };
    sendInitialFunds(recipientAddress: string, amount?: string): Promise<{
        success: boolean;
        txHash?: string;
        error?: string;
    }>;
    sendInjectiveTokens(toAddress: string, amount: string, fromPrivateKey?: string): Promise<{
        success: boolean;
        txHash?: string;
        error?: string;
    }>;
    getAccountBalance(address: string): Promise<{
        inj: string;
        usd?: string;
    }>;
    prepareTransaction(fromAddress: string, toAddress: string, amount: string, memo?: string): Promise<any>;
    broadcastTransaction(signedTxData: any): Promise<{
        success: boolean;
        txHash?: string;
        error?: string;
    }>;
    isValidInjectiveAddress(address: string): boolean;
    getNetworkInfo(): {
        network: string;
        chainId: string;
        rpcUrl: string;
        restUrl: string;
    };
}
