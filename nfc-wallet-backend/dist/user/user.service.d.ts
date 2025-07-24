import { PrismaService } from '../prisma/prisma.service';
import { UpdateDomainDto } from './dto/update-domain.dto';
import { UserProfileDto } from './dto/user-profile.dto';
export declare class UserService {
    private prisma;
    constructor(prisma: PrismaService);
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
    private validateDomainPrefix;
}
