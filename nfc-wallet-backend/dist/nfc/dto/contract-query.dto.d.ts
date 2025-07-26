export declare class ContractStatusDto {
    nfcRegistry: boolean;
    domainNFT: boolean;
    catNFT: boolean;
    networkInfo: {
        network: string;
        chainId: string;
        rpcUrl: string;
        restUrl: string;
    };
}
export declare class DomainAvailabilityCheckDto {
    domainPrefix: string;
}
export declare class CatNameAvailabilityCheckDto {
    catName: string;
}
export declare class AvailabilityResponseDto {
    available: boolean;
    name: string;
    ownerAddress?: string;
}
export declare class UserNFTInfoDto {
    domainInfo?: {
        hasDomain: boolean;
        domain?: string;
        tokenId?: string;
    };
    catInfo: {
        cats: Array<{
            tokenId: string;
            name: string;
            rarity: string;
            color: string;
            mintedAt: string;
        }>;
        total: number;
    };
}
