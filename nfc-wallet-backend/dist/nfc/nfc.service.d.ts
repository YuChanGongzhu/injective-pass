import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../crypto/crypto.service';
import { ContractService } from '../contract/contract.service';
import { InjectiveService } from '../contract/injective.service';
import { RegisterNFCDto } from './dto/register-nfc.dto';
import { UnbindNFCDto } from './dto/unbind-nfc.dto';
import { WalletResponseDto } from './dto/wallet-response.dto';
import { NFCStatusResponseDto } from './dto/nfc-status-response.dto';
import { CardOwnershipResponseDto } from './dto/card-ownership-response.dto';
export declare class NFCService {
    private prisma;
    private cryptoService;
    private contractService;
    private injectiveService;
    private readonly logger;
    constructor(prisma: PrismaService, cryptoService: CryptoService, contractService: ContractService, injectiveService: InjectiveService);
    registerNFC(registerNFCDto: RegisterNFCDto): Promise<WalletResponseDto>;
    private initializeBlankCard;
    getWalletByUID(uid: string): Promise<WalletResponseDto | null>;
    getDecryptedPrivateKey(uid: string): Promise<string | null>;
    private generateInjectiveWallet;
    createDomain(uid: string, domainName: string): Promise<{
        success: boolean;
        domain?: string;
        error?: string;
    }>;
    checkDomainAvailability(domainName: string): Promise<{
        available: boolean;
        domain: string;
    }>;
    private validateDomainName;
    private validateUID;
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
    unbindNFC(unbindNFCDto: UnbindNFCDto): Promise<{
        success: boolean;
        nfcUnbound: boolean;
        nftBurned: boolean;
        message: string;
    }>;
    getNFCStatus(uid: string): Promise<NFCStatusResponseDto>;
    batchGetNFCStatus(uids: string[]): Promise<NFCStatusResponseDto[]>;
    getCardOwnershipHistory(uid: string): Promise<CardOwnershipResponseDto | null>;
    checkCardOwnershipHistory(uid: string, ownerAddress: string): Promise<{
        hasOwned: boolean;
        totalDuration: number;
        ownershipPeriods: number;
    }>;
    batchGetCardOwners(uids: string[]): Promise<{
        nfcUID: string;
        currentOwner: string;
        ownershipCount: number;
    }[]>;
    private recordNFCBindingToChain;
}
