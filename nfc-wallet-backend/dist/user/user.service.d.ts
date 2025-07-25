import { PrismaService } from '../prisma/prisma.service';
import { UpdateDomainDto } from './dto/update-domain.dto';
import { UserProfileDto } from './dto/user-profile.dto';
import { CryptoService } from '../crypto/crypto.service';
export declare class UserService {
    private prisma;
    private cryptoService;
    constructor(prisma: PrismaService, cryptoService: CryptoService);
    updateDomain(updateDomainDto: UpdateDomainDto): Promise<UserProfileDto>;
    getUserProfile(uid: string): Promise<UserProfileDto>;
    checkDomainAvailability(domainPrefix: string): Promise<{
        available: boolean;
    }>;
    removeDomain(uid: string): Promise<UserProfileDto>;
    getUserByDomain(domain: string): Promise<UserProfileDto | null>;
    getUserList(page?: number, limit?: number): Promise<{
        users: UserProfileDto[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    getUserByAddress(address: string): Promise<{
        address: string;
        ethAddress: string;
        domain: string | null;
        nfcCards: Array<{
            uid: string;
            nickname: string | null;
            isActive: boolean;
            createdAt: Date;
        }>;
        transactionCount: number;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    getUserNFCCards(address: string): Promise<Array<{
        uid: string;
        nickname: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>>;
    updateNFCCardNickname(uid: string, nickname: string): Promise<{
        success: boolean;
        message: string;
    }>;
    toggleNFCCardStatus(uid: string, isActive: boolean): Promise<{
        success: boolean;
        message: string;
    }>;
    exportPrivateKey(uid: string): Promise<{
        success: boolean;
        privateKey?: string;
        warning?: string;
        error?: string;
    }>;
    exportPrivateKeyByAddress(address: string): Promise<{
        success: boolean;
        privateKey?: string;
        warning?: string;
        error?: string;
    }>;
    private validateDomainPrefix;
}
