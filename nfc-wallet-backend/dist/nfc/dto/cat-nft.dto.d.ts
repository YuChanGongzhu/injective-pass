export declare class DrawCatNFTDto {
    nfcUID: string;
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
