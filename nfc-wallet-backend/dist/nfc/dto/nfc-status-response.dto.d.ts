export declare class NFCStatusResponseDto {
    uid: string;
    status: number;
    description: string;
    isBlank: boolean;
    isBound: boolean;
    walletAddress?: string;
    nftTokenId?: number;
    bindingHistory: number;
}
