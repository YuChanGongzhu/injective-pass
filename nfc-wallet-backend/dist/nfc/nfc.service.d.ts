import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../crypto/crypto.service';
import { InjectiveService } from '../contract/injective.service';
import { TransactionService } from '../contract/transaction.service';
import { RegisterNFCDto, BindNFCDto } from './dto/register-nfc.dto';
import { WalletResponseDto } from './dto/wallet-response.dto';
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
    checkDomainAvailability(domain: string): Promise<{
        available: boolean;
        domain: string;
    }>;
    createDomain(uid: string, domainName: string): Promise<{
        success: boolean;
        domain?: string;
        error?: string;
    }>;
    getWalletBalance(address: string): Promise<{
        inj: string;
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
    private validateDomain;
    private validateUID;
}
