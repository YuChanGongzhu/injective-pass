import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../crypto/crypto.service';
import { InjectiveService } from '../contract/injective.service';
import { TransactionService } from '../contract/transaction.service';
import { RegisterNFCDto, BindNFCDto } from './dto/register-nfc.dto';
import { WalletResponseDto } from './dto/wallet-response.dto';
import { RegisterDomainDto, DomainNFTResponseDto, DomainAvailabilityDto } from './dto/domain-nft.dto';
import { DrawCatNFTDto, CatNFTResponseDto, CatNFTListDto } from './dto/cat-nft.dto';
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
        txHash?: string;
        error?: string;
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
    drawCatNFT(drawCatNFTDto: DrawCatNFTDto): Promise<CatNFTResponseDto>;
    getUserCatNFTs(uid: string): Promise<CatNFTListDto>;
    getUserDomainNFT(uid: string): Promise<{
        domain: string;
        tokenId: string;
        imageUrl: string;
        metadata: any;
        registeredAt: Date;
        isActive: boolean;
    }>;
    manualBindNFC(uid: string): Promise<{
        success: boolean;
        message: string;
        txHash?: string;
        error?: string;
    }>;
    private generateCatImageUrl;
    private generateDomainImageUrl;
    private generateDomainMetadata;
}
