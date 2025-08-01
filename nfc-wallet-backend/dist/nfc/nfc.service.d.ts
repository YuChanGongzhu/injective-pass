import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../crypto/crypto.service';
import { InjectiveService } from '../contract/injective.service';
import { TransactionService } from '../contract/transaction.service';
import { RegisterNFCDto, BindNFCDto } from './dto/register-nfc.dto';
import { WalletResponseDto } from './dto/wallet-response.dto';
import { RegisterDomainDto, DomainNFTResponseDto, DomainAvailabilityDto } from './dto/domain-nft.dto';
import { CatNFTResponseDto, CatNFTListDto, SocialStatsDto, SocialInteractionDto, SocialInteractionResponseDto, DrawCatWithTicketsDto, DrawCatTraditionalDto, DrawStatsDto } from './dto/cat-nft.dto';
export declare class NFCService {
    private prisma;
    private cryptoService;
    private injectiveService;
    private transactionService;
    private readonly logger;
    constructor(prisma: PrismaService, cryptoService: CryptoService, injectiveService: InjectiveService, transactionService: TransactionService);
    registerNFC(registerNFCDto: RegisterNFCDto): Promise<WalletResponseDto>;
    getWalletByUID(uid: string): Promise<WalletResponseDto | null>;
    bindNFCCard(bindNFCDto: BindNFCDto): Promise<{
        success: boolean;
        message: string;
    }>;
    registerDomainNFT(registerDomainDto: RegisterDomainDto): Promise<DomainNFTResponseDto>;
    checkDomainAvailability(domainPrefix: string): Promise<DomainAvailabilityDto>;
    getWalletBalance(address: string): Promise<{
        inj: string;
        usd?: string;
    }>;
    getWalletStats(): Promise<{
        totalWallets: number;
        walletsWithDomain: number;
        walletsWithNFT: number;
        fundedWallets: number;
        recentRegistrations: number;
    }>;
    unbindNFC(uid: string): Promise<{
        success: boolean;
        message: string;
    }>;
    private initializeNewUser;
    private buildWalletResponse;
    getContractStatus(): Promise<{
        nfcRegistry: boolean;
        domainNFT: boolean;
        catNFT: boolean;
        networkInfo: any;
    }>;
    private validateUID;
    private validateDomain;
    private validateDomainPrefix;
    socialInteraction(socialInteractionDto: SocialInteractionDto): Promise<SocialInteractionResponseDto>;
    drawCatWithTickets(drawCatWithTicketsDto: DrawCatWithTicketsDto): Promise<CatNFTResponseDto>;
    drawCatTraditional(drawCatTraditionalDto: DrawCatTraditionalDto): Promise<CatNFTResponseDto>;
    getDrawStats(nfcUID: string): Promise<DrawStatsDto>;
    getInteractedNFCs(nfcUID: string): Promise<{
        interactedNFCs: string[];
    }>;
    getUserCatNFTs(uid: string): Promise<CatNFTListDto>;
    getSocialStats(uid: string): Promise<SocialStatsDto>;
    checkInteraction(nfc1: string, nfc2: string): Promise<boolean>;
    private generateCatImageUrl;
}
