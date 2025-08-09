import { ConfigService } from '@nestjs/config';
export declare class ContractService {
    private configService;
    private provider;
    private wallet;
    private domainRegistryContract;
    private nfcRegistryContract;
    private nfcCardNFTContract;
    constructor(configService: ConfigService);
    private initializeContracts;
    isDomainAvailable(domainPrefix: string): Promise<boolean>;
    registerDomain(domainPrefix: string, userAddress: string): Promise<string | null>;
    resolveDomain(domain: string): Promise<string | null>;
    reverseResolve(address: string): Promise<string | null>;
    getUserDomains(userAddress: string): Promise<string[]>;
    recordNFCWalletBinding(nfcUID: string, walletAddress: string): Promise<boolean>;
    isNFCBound(nfcUID: string): Promise<boolean>;
    getNFCWallet(nfcUID: string): Promise<string | null>;
    getWalletNFCs(walletAddress: string): Promise<string[]>;
    detectAndBindBlankCard(nfcUID: string, newWalletAddress: string): Promise<boolean>;
    initializeBlankCard(nfcUID: string, metadata?: string): Promise<boolean>;
    unbindNFCWallet(nfcUID: string, ownerSignature: string): Promise<boolean>;
    emergencyUnbindNFCWallet(nfcUID: string): Promise<boolean>;
    isNFCBlank(nfcUID: string): Promise<boolean>;
    getNFCStatus(nfcUID: string): Promise<{
        status: number;
        description: string;
    }>;
    getNFCHistory(nfcUID: string): Promise<any[]>;
    mintCardNFT(nfcUID: string, seriesId: string, ownerAddress: string): Promise<number | null>;
    unbindAndBurnCardNFT(nfcUID: string, ownerSignature?: string): Promise<boolean>;
    getCardNFTInfo(nfcUID: string): Promise<any | null>;
    interactWithCard(myNfcUID: string, targetNfcUID: string, interactionType: 'battle' | 'social' | 'trade', userAddress: string): Promise<boolean>;
    unbindAndTransferCardNFT(nfcUID: string, newOwner: string, ownerSignature: string): Promise<boolean>;
    getWalletCardStats(walletAddress: string): Promise<{
        totalCards: number;
        activeCards: number;
        blankCards: number;
    } | null>;
    getCardOwnershipHistory(nfcUID: string): Promise<any[]>;
    getCardOwnershipCount(nfcUID: string): Promise<number>;
    hasOwnedCard(nfcUID: string, ownerAddress: string): Promise<boolean>;
    getOwnershipDuration(nfcUID: string, ownerAddress: string): Promise<number>;
    batchGetCardOwners(nfcUIDs: string[]): Promise<string[]>;
    mintCatNFT(ownerAddress: string, catName: string, description: string): Promise<{
        success: boolean;
        tokenId?: string;
        error?: string;
    }>;
    burnNFT(tokenId: string, ownerAddress: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    mintCatCardNFT(nfcUID: string, ownerAddress: string): Promise<number | null>;
    getWalletCats(walletAddress: string): Promise<any[]>;
    interactWithCats(myNfcUID: string, targetNfcUID: string, interactionType: number, message: string, userAddress: string): Promise<{
        success: boolean;
        transactionData?: any;
    }>;
    getCatInteractionHistory(nfcUID: string): Promise<any[]>;
    isAuthorizedMinter(address: string): Promise<boolean>;
    setAuthorizedMinter(minterAddress: string, authorized: boolean): Promise<boolean>;
    getContractStatus(): Promise<{
        domainRegistry: boolean;
        nfcRegistry: boolean;
        nfcCardNFT: boolean;
        walletConnected: boolean;
        network: string;
    }>;
    getCurrentGasPrice(): Promise<string>;
    estimateTransactionCost(type: 'domain_register' | 'nfc_bind' | 'nfc_unbind' | 'nft_mint' | 'nft_burn'): Promise<string>;
    completeNFCUnbindProcess(nfcUID: string, resetToBlank?: boolean): Promise<{
        nfcUnbound: boolean;
        nftBurned: boolean;
        success: boolean;
    }>;
    socialInteraction(myNFC: string, otherNFC: string): Promise<{
        success: boolean;
        error?: string;
        rewardedDraws?: number;
    }>;
    drawCatNFTWithTickets(nfcUID: string, catName: string, userAddress: string): Promise<{
        success: boolean;
        tokenId?: string;
        rarity?: string;
        color?: string;
        error?: string;
    }>;
    getDrawStats(nfcUID: string): Promise<{
        available: number;
        used: number;
        total: number;
    }>;
    hasInteracted(nfc1: string, nfc2: string): Promise<boolean>;
    getInteractedNFCs(nfcUID: string): Promise<string[]>;
    addDrawTickets(nfcUID: string, amount: number): Promise<boolean>;
    private rarityToString;
}
