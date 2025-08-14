export declare class SocialInteractionDto {
    myNFC: string;
    otherNFC: string;
}
export declare class DrawCatWithTicketsDto {
    nfcUid: string;
    catName: string;
}
export declare class DrawCatTraditionalDto {
    nfcUid: string;
    catName: string;
}
export declare class SocialInteractionResponseDto {
    transactionHash: string;
    rewardTickets: number;
    totalTickets: number;
    message: string;
}
export declare class DrawStatsDto {
    availableDraws: number;
    usedDraws: number;
    totalDraws: number;
    socialBonus: number;
}
export declare class DrawCatNFTDto {
    myNFC: string;
    otherNFC: string;
    catName: string;
}
export declare class CatNFTResponseDto {
    tokenId: string;
    name: string;
    rarity: string;
    color: string;
    imageUrl: string;
    metadata?: Record<string, any>;
    txHash: string;
    mintedAt: Date;
}
export declare class CatNFTListDto {
    cats: CatNFTResponseDto[];
    total: number;
    page: number;
    totalPages: number;
}
export declare class SocialStatsDto {
    nfcUID: string;
    drawCount: number;
    interactedCount: number;
    interactedNFCs: string[];
    socialBonus: number;
}
