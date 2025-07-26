export declare class RegisterDomainDto {
    uid: string;
    domainPrefix: string;
}
export declare class DomainNFTResponseDto {
    domain: string;
    tokenId: string;
    txHash: string;
    registeredAt: Date;
    imageUrl: string;
}
export declare class DomainAvailabilityDto {
    domain: string;
    available: boolean;
    ownerAddress?: string | null;
}
