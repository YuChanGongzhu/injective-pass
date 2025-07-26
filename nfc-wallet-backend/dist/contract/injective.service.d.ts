import { ConfigService } from '@nestjs/config';
export declare class InjectiveService {
    private configService;
    private readonly masterPrivateKey;
    private readonly network;
    private readonly endpoints;
    private readonly evmProvider;
    private readonly evmWallet;
    private nfcRegistryContract;
    private domainNFTContract;
    private catNFTContract;
    constructor(configService: ConfigService);
    private initializeContracts;
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
        rawTx?: any;
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
    mintDomainNFT(ownerAddress: string, domainName: string, nfcUID: string, tokenId: string, metadata?: any): Promise<{
        success: boolean;
        txHash?: string;
        error?: string;
        rawTx?: any;
    }>;
    mintCatNFT(ownerAddress: string, catName: string): Promise<{
        success: boolean;
        txHash?: string;
        error?: string;
        rawTx?: any;
        rarity?: string;
        color?: string;
    }>;
    getContractStatus(): Promise<{
        nfcRegistry: boolean;
        domainNFT: boolean;
        catNFT: boolean;
        networkInfo: any;
    }>;
    unbindNFCWallet(nfcUID: string, ownerSignature: string): Promise<string>;
    detectAndBindBlankCard(nfcUID: string, walletAddress: string): Promise<{
        success: boolean;
        txHash?: string;
        error?: string;
    }>;
    emergencyUnbindNFCWallet(nfcUID: string): Promise<string>;
}
