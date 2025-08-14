export declare class NFCCardDto {
    uid: string;
    nickname?: string;
    isActive: boolean;
    isBlank: boolean;
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
    domain?: string;
    domainTokenId?: string;
    initialFunded: boolean;
    domainRegistered: boolean;
    nfcCard?: NFCCardDto;
    recentTransactions: TransactionDto[];
    isNewWallet: boolean;
}
export declare class TransactionResponseDto {
    success: boolean;
    txHash?: string;
    error?: string;
    status?: string;
    blockHeight?: string;
    gasUsed?: string;
    fee?: string;
    memo?: string;
    rawTx?: any;
}
