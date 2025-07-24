import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContractService } from '../contract/contract.service';
import { UpdateDomainDto } from './dto/update-domain.dto';
import { UserProfileDto } from './dto/user-profile.dto';

@Injectable()
export class UserService {
    constructor(
        private prisma: PrismaService,
        private contractService: ContractService
    ) { }

    /**
     * 更新.inj域名
     */
    async updateDomain(updateDomainDto: UpdateDomainDto): Promise<UserProfileDto> {
        const { uid, domainPrefix } = updateDomainDto;

        // 验证域名前缀格式
        if (!this.validateDomainPrefix(domainPrefix)) {
            throw new BadRequestException('域名前缀格式无效');
        }

        // 生成完整的.inj域名
        const fullDomain = `${domainPrefix}.inj`;

        // 检查钱包是否存在
        const existingWallet = await this.prisma.nFCWallet.findUnique({
            where: { uid },
        });

        if (!existingWallet) {
            throw new NotFoundException('未找到对应的钱包');
        }

        try {
            // 更新域名
            const updatedWallet = await this.prisma.nFCWallet.update({
                where: { uid },
                data: { domain: fullDomain },
            });

            return {
                address: updatedWallet.address,
                uid: updatedWallet.uid,
                domain: updatedWallet.domain,
                createdAt: updatedWallet.createdAt,
                updatedAt: updatedWallet.updatedAt,
            };
        } catch (error) {
            if (error.code === 'P2002') {
                // Prisma唯一约束冲突
                throw new ConflictException('该.inj域名已被占用');
            }
            throw new BadRequestException('域名更新失败');
        }
    }

    /**
     * 根据UID获取用户资料
     */
    async getUserProfile(uid: string): Promise<UserProfileDto> {
        const wallet = await this.prisma.nFCWallet.findUnique({
            where: { uid },
        });

        if (!wallet) {
            throw new NotFoundException('未找到对应的用户');
        }

        return {
            address: wallet.address,
            uid: wallet.uid,
            domain: wallet.domain,
            createdAt: wallet.createdAt,
            updatedAt: wallet.updatedAt,
        };
    }

    /**
     * 检查.inj域名是否可用
     */
    async checkDomainAvailability(domainPrefix: string): Promise<{ available: boolean }> {
        if (!this.validateDomainPrefix(domainPrefix)) {
            throw new BadRequestException('域名前缀格式无效');
        }

        const fullDomain = `${domainPrefix}.inj`;
        const existingUser = await this.prisma.nFCWallet.findUnique({
            where: { domain: fullDomain },
        });

        return { available: !existingUser };
    }

    /**
     * 删除域名（设置为null）
     */
    async removeDomain(uid: string): Promise<UserProfileDto> {
        const existingWallet = await this.prisma.nFCWallet.findUnique({
            where: { uid },
        });

        if (!existingWallet) {
            throw new NotFoundException('未找到对应的钱包');
        }

        const updatedWallet = await this.prisma.nFCWallet.update({
            where: { uid },
            data: { domain: null },
        });

        return {
            address: updatedWallet.address,
            uid: updatedWallet.uid,
            domain: updatedWallet.domain,
            createdAt: updatedWallet.createdAt,
            updatedAt: updatedWallet.updatedAt,
        };
    }

    /**
     * 根据域名查找用户
     */
    async getUserByDomain(domain: string): Promise<UserProfileDto | null> {
        const wallet = await this.prisma.nFCWallet.findUnique({
            where: { domain },
        });

        if (!wallet) {
            return null;
        }

        return {
            address: wallet.address,
            uid: wallet.uid,
            domain: wallet.domain,
            createdAt: wallet.createdAt,
            updatedAt: wallet.updatedAt,
        };
    }

    /**
     * 获取用户列表（分页）
     */
    async getUserList(page: number = 1, limit: number = 20): Promise<{
        users: UserProfileDto[];
        total: number;
        page: number;
        totalPages: number;
    }> {
        const skip = (page - 1) * limit;

        const [users, total] = await Promise.all([
            this.prisma.nFCWallet.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    uid: true,
                    address: true,
                    domain: true,
                    createdAt: true,
                    updatedAt: true,
                },
            }),
            this.prisma.nFCWallet.count(),
        ]);

        return {
            users: users.map((user) => ({
                address: user.address,
                uid: user.uid,
                domain: user.domain,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            })),
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * 验证.inj域名前缀格式
     */
    private validateDomainPrefix(domainPrefix: string): boolean {
        // 域名前缀规则：
        // - 长度3-30字符
        // - 只能包含小写字母、数字和连字符
        // - 不能以连字符开头或结尾
        // - 符合DNS域名规范
        const regex = /^[a-z0-9]+([a-z0-9-]*[a-z0-9])?$/;
        return domainPrefix.length >= 3 &&
            domainPrefix.length <= 30 &&
            regex.test(domainPrefix) &&
            !domainPrefix.includes('--'); // 避免连续连字符
    }
} 