export declare class NFCCardDto {
    uid: string;
    nickname?: string;
    isActive: boolean;
    createdAt: Date;
}
export declare class TransactionDto {
    txHash: string;
    type: string;
    amount?: string;
    tokenSymbol?: string;
    status: string;
    createdAt: Date;
}
export declare class WalletResponseDto {
    address: string;
    ethAddress: string;
    publicKey: string;
    domain?: string;
    nftTokenId?: string;
    isNewWallet: boolean;
    initialFunded: boolean;
    nfcCards: NFCCardDto[];
    recentTransactions: TransactionDto[];
    createdAt: Date;
    updatedAt: Date;
}
export declare class TransactionResponseDto {
    success: boolean;
    txHash?: string;
    error?: string;
    status?: string;
    blockHeight?: string;
    gasUsed?: string;
    fee?: string;
}
