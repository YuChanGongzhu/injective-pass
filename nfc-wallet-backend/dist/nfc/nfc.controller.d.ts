import { NFCService } from './nfc.service';
import { RegisterNFCDto } from './dto/register-nfc.dto';
import { UnbindNFCDto } from './dto/unbind-nfc.dto';
import { WalletResponseDto } from './dto/wallet-response.dto';
import { RegisterDomainDto, DomainNFTResponseDto } from './dto/domain-nft.dto';
import { CatNFTResponseDto, CatNFTListDto, SocialStatsDto, SocialInteractionDto, SocialInteractionResponseDto, DrawCatWithTicketsDto, DrawCatTraditionalDto, DrawStatsDto } from './dto/cat-nft.dto';
export declare class NFCController {
    private readonly nfcService;
    constructor(nfcService: NFCService);
    registerNFC(registerNFCDto: RegisterNFCDto): Promise<WalletResponseDto>;
    getWalletByUID(uid: string): Promise<WalletResponseDto>;
    checkDomainAvailability(domain: string): Promise<import("./dto/domain-nft.dto").DomainAvailabilityDto>;
    registerDomainNFT(registerDomainDto: RegisterDomainDto): Promise<DomainNFTResponseDto>;
    unbindNFC(unbindNFCDto: UnbindNFCDto): Promise<{
        success: boolean;
        message: string;
    }>;
    getWalletStats(): Promise<{
        totalWallets: number;
        walletsWithDomain: number;
        walletsWithNFT: number;
        fundedWallets: number;
        recentRegistrations: number;
    }>;
    getWalletBalance(address: string): Promise<{
        inj: string;
        usd?: string;
    }>;
    getUserCatNFTs(uid: string): Promise<CatNFTListDto>;
    getSocialStats(uid: string): Promise<SocialStatsDto>;
    checkInteraction(body: {
        nfc1: string;
        nfc2: string;
    }): Promise<{
        hasInteracted: boolean;
        nfc1: string;
        nfc2: string;
    }>;
    socialInteraction(socialInteractionDto: SocialInteractionDto): Promise<SocialInteractionResponseDto>;
    drawCatWithTickets(drawCatWithTicketsDto: DrawCatWithTicketsDto): Promise<CatNFTResponseDto>;
    drawCatTraditional(drawCatTraditionalDto: DrawCatTraditionalDto): Promise<CatNFTResponseDto>;
    getDrawStats(nfcUID: string): Promise<DrawStatsDto>;
    getInteractedNFCs(nfcUID: string): Promise<{
        interactedNFCs: string[];
    }>;
}
export declare class ContractController {
    private readonly nfcService;
    constructor(nfcService: NFCService);
    getContractStatus(): Promise<{
        nfcRegistry: boolean;
        domainNFT: boolean;
        catNFT: boolean;
        networkInfo: any;
    }>;
}
