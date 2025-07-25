import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../crypto/crypto.service';
import { UpdateDomainDto } from './dto/update-domain.dto';
import { UserProfileDto } from './dto/user-profile.dto';
import { ExportPrivateKeyDto, PrivateKeyResponseDto } from './dto/export-private-key.dto';

@Injectable()
export class UserService {
    constructor(
        private prisma: PrismaService,
        private cryptoService: CryptoService,
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

        // 通过NFC UID查找用户
        const nfcCard = await this.prisma.nFCCard.findUnique({
            where: { uid },
            include: { user: true }
        });

        if (!nfcCard) {
            throw new NotFoundException('未找到对应的NFC卡片');
        }

        try {
            // 检查域名是否已被占用
            const existingDomainUser = await this.prisma.user.findUnique({
                where: { domain: fullDomain }
            });

            if (existingDomainUser && existingDomainUser.id !== nfcCard.user.id) {
                throw new ConflictException('该.inj域名已被占用');
            }

            // 更新用户域名
            const updatedUser = await this.prisma.user.update({
                where: { id: nfcCard.user.id },
                data: { domain: fullDomain },
            });

            return {
                address: updatedUser.address,
                uid: uid, // 返回查询用的UID
                domain: updatedUser.domain,
                createdAt: updatedUser.createdAt,
                updatedAt: updatedUser.updatedAt,
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
        const nfcCard = await this.prisma.nFCCard.findUnique({
            where: { uid },
            include: { user: true }
        });

        if (!nfcCard) {
            throw new NotFoundException('未找到对应的用户');
        }

        return {
            address: nfcCard.user.address,
            uid: uid,
            domain: nfcCard.user.domain,
            createdAt: nfcCard.user.createdAt,
            updatedAt: nfcCard.user.updatedAt,
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
        const existingUser = await this.prisma.user.findUnique({
            where: { domain: fullDomain },
        });

        return { available: !existingUser };
    }

    /**
     * 删除域名（设置为null）
     */
    async removeDomain(uid: string): Promise<UserProfileDto> {
        const nfcCard = await this.prisma.nFCCard.findUnique({
            where: { uid },
            include: { user: true }
        });

        if (!nfcCard) {
            throw new NotFoundException('未找到对应的NFC卡片');
        }

        const updatedUser = await this.prisma.user.update({
            where: { id: nfcCard.user.id },
            data: { domain: null },
        });

        return {
            address: updatedUser.address,
            uid: uid,
            domain: updatedUser.domain,
            createdAt: updatedUser.createdAt,
            updatedAt: updatedUser.updatedAt,
        };
    }

    /**
     * 根据域名查找用户
     */
    async getUserByDomain(domain: string): Promise<UserProfileDto | null> {
        const user = await this.prisma.user.findUnique({
            where: { domain },
            include: { nfcCards: true }
        });

        if (!user) {
            return null;
        }

        // 返回第一个NFC卡片的UID作为代表
        const primaryUid = user.nfcCards.length > 0 ? user.nfcCards[0].uid : '';

        return {
            address: user.address,
            uid: primaryUid,
            domain: user.domain,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
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
            this.prisma.user.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    nfcCards: {
                        select: {
                            uid: true
                        }
                    }
                },
            }),
            this.prisma.user.count(),
        ]);

        return {
            users: users.map((user) => ({
                address: user.address,
                uid: user.nfcCards.length > 0 ? user.nfcCards[0].uid : '', // 返回第一个NFC卡片UID
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
     * 根据用户地址获取完整用户信息
     */
    async getUserByAddress(address: string): Promise<{
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
    } | null> {
        const user = await this.prisma.user.findUnique({
            where: { address },
            include: {
                nfcCards: {
                    orderBy: { createdAt: 'desc' }
                },
                transactions: {
                    select: { id: true }
                }
            }
        });

        if (!user) {
            return null;
        }

        return {
            address: user.address,
            ethAddress: user.ethAddress,
            domain: user.domain,
            nfcCards: user.nfcCards.map(card => ({
                uid: card.uid,
                nickname: card.nickname,
                isActive: card.isActive,
                createdAt: card.createdAt
            })),
            transactionCount: user.transactions.length,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };
    }

    /**
     * 获取用户的NFC卡片列表
     */
    async getUserNFCCards(address: string): Promise<Array<{
        uid: string;
        nickname: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>> {
        const user = await this.prisma.user.findUnique({
            where: { address },
            include: {
                nfcCards: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!user) {
            throw new NotFoundException('用户不存在');
        }

        return user.nfcCards.map(card => ({
            uid: card.uid,
            nickname: card.nickname,
            isActive: card.isActive,
            createdAt: card.createdAt,
            updatedAt: card.updatedAt
        }));
    }

    /**
     * 更新NFC卡片昵称
     */
    async updateNFCCardNickname(
        uid: string,
        nickname: string
    ): Promise<{ success: boolean; message: string }> {
        const nfcCard = await this.prisma.nFCCard.findUnique({
            where: { uid }
        });

        if (!nfcCard) {
            throw new NotFoundException('NFC卡片不存在');
        }

        await this.prisma.nFCCard.update({
            where: { uid },
            data: { nickname }
        });

        return { success: true, message: 'NFC卡片昵称更新成功' };
    }

    /**
     * 激活/停用NFC卡片
     */
    async toggleNFCCardStatus(
        uid: string,
        isActive: boolean
    ): Promise<{ success: boolean; message: string }> {
        const nfcCard = await this.prisma.nFCCard.findUnique({
            where: { uid }
        });

        if (!nfcCard) {
            throw new NotFoundException('NFC卡片不存在');
        }

        await this.prisma.nFCCard.update({
            where: { uid },
            data: { isActive }
        });

        const status = isActive ? '激活' : '停用';
        return { success: true, message: `NFC卡片${status}成功` };
    }

    /**
     * 导出用户私钥
     */
    async exportPrivateKey(exportPrivateKeyDto: ExportPrivateKeyDto): Promise<PrivateKeyResponseDto> {
        const { uid, address, confirmation } = exportPrivateKeyDto;

        // 验证确认字符串
        if (confirmation !== 'I_UNDERSTAND_THE_RISKS') {
            throw new ForbiddenException('需要确认理解私钥导出的风险');
        }

        // 验证至少提供了uid或address中的一个
        if (!uid && !address) {
            throw new BadRequestException('必须提供NFC UID或用户地址');
        }

        let user;

        // 根据提供的参数查找用户
        if (uid) {
            // 通过NFC UID查找用户
            const nfcCard = await this.prisma.nFCCard.findUnique({
                where: { uid },
                include: { user: true }
            });

            if (!nfcCard) {
                throw new NotFoundException('未找到对应的NFC卡片');
            }

            user = nfcCard.user;

            // 如果同时提供了address，验证是否匹配
            if (address && user.address !== address) {
                throw new ForbiddenException('提供的地址与NFC UID对应的用户不匹配');
            }
        } else if (address) {
            // 通过地址查找用户
            user = await this.prisma.user.findUnique({
                where: { address }
            });

            if (!user) {
                throw new NotFoundException('未找到对应的用户');
            }
        }

        try {
            // 解密私钥
            const decryptedPrivateKey = this.cryptoService.decrypt(user.privateKeyEnc);

            // 确保私钥格式正确（添加0x前缀如果没有的话）
            const formattedPrivateKey = decryptedPrivateKey.startsWith('0x')
                ? decryptedPrivateKey
                : `0x${decryptedPrivateKey}`;

            // 返回私钥和相关信息
            return {
                address: user.address,
                privateKey: formattedPrivateKey,
                exportedAt: new Date(),
                warning: '警告：私钥是您钱包的完全控制权限。请妥善保管，不要与任何人分享。如果私钥泄露，您的资产可能会丢失。'
            };
        } catch (error) {
            console.error('私钥解密失败:', error);
            throw new BadRequestException('私钥解密失败，可能数据已损坏');
        }
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