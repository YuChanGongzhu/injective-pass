export declare class OwnershipRecord {
    owner: string;
    fromTimestamp: number;
    toTimestamp: number;
    transferReason: string;
    duration?: number;
}
export declare class CardOwnershipResponseDto {
    nfcUID: string;
    tokenId: number;
    currentOwner: string;
    ownershipCount: number;
    ownershipHistory: OwnershipRecord[];
    createdAt: number;
    lastTransferAt: number;
}
