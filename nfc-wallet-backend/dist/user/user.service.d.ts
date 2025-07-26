import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../crypto/crypto.service';
import { UpdateDomainDto } from './dto/update-domain.dto';
import { UserProfileDto } from './dto/user-profile.dto';
import { ExportPrivateKeyDto, PrivateKeyResponseDto } from './dto/export-private-key.dto';
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
        nfcCard: {
            uid: string;
            nickname: string | null;
            isActive: boolean;
            isBlank: boolean;
            createdAt: Date;
        } | null;
        transactionCount: number;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    getUserNFCCard(address: string): Promise<{
        uid: string;
        nickname: string | null;
        isActive: boolean;
        isBlank: boolean;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    updateNFCCardNickname(uid: string, nickname: string): Promise<{
        success: boolean;
        message: string;
    }>;
    toggleNFCCardStatus(uid: string, isActive: boolean): Promise<{
        success: boolean;
        message: string;
    }>;
    exportPrivateKey(exportPrivateKeyDto: ExportPrivateKeyDto): Promise<PrivateKeyResponseDto>;
    private validateDomainPrefix;
}
