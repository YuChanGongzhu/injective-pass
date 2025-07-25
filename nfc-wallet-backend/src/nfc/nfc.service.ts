import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../crypto/crypto.service';
import { InjectiveService } from '../contract/injective.service';
import { TransactionService } from '../contract/transaction.service';
import { RegisterNFCDto, BindNFCDto } from './dto/register-nfc.dto';
import { WalletResponseDto, TransactionResponseDto } from './dto/wallet-response.dto';
// 临时枚举定义，直到Prisma客户端完全生成
enum TransactionType {
    SEND = 'SEND',
    RECEIVE = 'RECEIVE',
    INITIAL_FUND = 'INITIAL_FUND',
    NFT_MINT = 'NFT_MINT',
    DOMAIN_REG = 'DOMAIN_REG',
    SWAP = 'SWAP',
    STAKE = 'STAKE',
    UNSTAKE = 'UNSTAKE'
}

enum TxStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    FAILED = 'FAILED',
    CANCELLED = 'CANCELLED'
}

@Injectable()
export class NFCService {
    private readonly logger = new Logger(NFCService.name);

    constructor(
        private prisma: PrismaService,
        private cryptoService: CryptoService,
        private injectiveService: InjectiveService,
        private transactionService: TransactionService,
    ) { }

    /**
     * 注册NFC卡片并创建或绑定到用户钱包
     */
    async registerNFC(registerNFCDto: RegisterNFCDto): Promise<WalletResponseDto> {
        const { uid, userAddress, nickname } = registerNFCDto;

        // 验证UID格式
        if (!this.validateUID(uid)) {
            throw new BadRequestException('NFC UID格式无效');
        }

        // 检查NFC卡片是否已存在
        const existingCard = await this.prisma.nFCCard.findUnique({
            where: { uid },
            include: { user: true }
        });

        if (existingCard) {
            // 返回已存在的卡片信息
            return this.buildWalletResponse(existingCard.user, [existingCard], false);
        }

        let user;

        if (userAddress) {
            // 绑定到现有用户
            user = await this.prisma.user.findUnique({
                where: { address: userAddress },
                include: { nfcCards: true, transactions: { take: 5, orderBy: { createdAt: 'desc' } } }
            });

            if (!user) {
                throw new NotFoundException('指定的用户地址不存在');
            }
        } else {
            // 创建新用户
            const wallet = await this.cryptoService.generateWallet();
            const encryptedPrivateKey = await this.cryptoService.encryptData(wallet.privateKey);

            user = await this.prisma.user.create({
                data: {
                    address: wallet.address,
                    ethAddress: wallet.ethAddress,
                    publicKey: wallet.publicKey,
                    privateKeyEnc: encryptedPrivateKey,
                },
                include: { nfcCards: true, transactions: { take: 5, orderBy: { createdAt: 'desc' } } }
            });

            this.logger.log(`新建用户钱包: ${user.address} for UID: ${uid}`);

            // 发送初始资金
            this.initializeNewUser(user.id, user.address).catch(error => {
                this.logger.error(`初始化用户失败 ${user.address}:`, error.message);
            });
        }

        // 创建NFC卡片记录
        const nfcCard = await this.prisma.nFCCard.create({
            data: {
                uid,
                userId: user.id,
                nickname: nickname || null,
            }
        });

        const allCards = [...user.nfcCards, nfcCard];
        return this.buildWalletResponse(user, allCards, !userAddress);
    }

    /**
     * 根据UID获取钱包信息
     */
    async getWalletByUID(uid: string): Promise<WalletResponseDto | null> {
        const nfcCard = await this.prisma.nFCCard.findUnique({
            where: { uid },
            include: {
                user: {
                    include: {
                        nfcCards: true,
                        transactions: { take: 5, orderBy: { createdAt: 'desc' } }
                    }
                }
            }
        });

        if (!nfcCard) {
            return null;
        }

        return this.buildWalletResponse(nfcCard.user, nfcCard.user.nfcCards, false);
    }

    /**
     * 绑定NFC卡片到现有用户
     */
    async bindNFCCard(bindNFCDto: BindNFCDto): Promise<{ success: boolean; message: string }> {
        const { uid, userAddress, nickname } = bindNFCDto;

        // 验证UID格式
        if (!this.validateUID(uid)) {
            throw new BadRequestException('NFC UID格式无效');
        }

        // 检查用户是否存在
        const user = await this.prisma.user.findUnique({
            where: { address: userAddress }
        });

        if (!user) {
            throw new NotFoundException('用户不存在');
        }

        // 检查NFC卡片是否已存在
        const existingCard = await this.prisma.nFCCard.findUnique({
            where: { uid }
        });

        if (existingCard) {
            throw new ConflictException('该NFC卡片已被绑定');
        }

        // 创建NFC卡片记录
        await this.prisma.nFCCard.create({
            data: {
                uid,
                userId: user.id,
                nickname: nickname || null,
            }
        });

        return { success: true, message: 'NFC卡片绑定成功' };
    }

    /**
     * 检查域名可用性
     */
    async checkDomainAvailability(domain: string): Promise<{ available: boolean; domain: string }> {
        if (!this.validateDomain(domain)) {
            throw new BadRequestException('域名格式无效');
        }

        const fullDomain = `${domain}.inj`;
        const existingDomain = await this.prisma.user.findUnique({
            where: { domain: fullDomain }
        });

        return {
            available: !existingDomain,
            domain: fullDomain
        };
    }

    /**
     * 创建域名
     */
    async createDomain(uid: string, domainName: string): Promise<{ success: boolean; domain?: string; error?: string }> {
        try {
            // 验证UID格式
            if (!this.validateUID(uid)) {
                throw new BadRequestException('NFC UID格式无效');
            }

            // 验证域名格式
            if (!this.validateDomain(domainName)) {
                return { success: false, error: '域名格式无效' };
            }

            const fullDomain = `${domainName}.inj`;

            // 检查域名是否已被占用
            const existingDomain = await this.prisma.user.findUnique({
                where: { domain: fullDomain }
            });

            if (existingDomain) {
                return { success: false, error: '域名已被占用' };
            }

            // 查找NFC卡片对应的用户
            const nfcCard = await this.prisma.nFCCard.findUnique({
                where: { uid },
                include: { user: true }
            });

            if (!nfcCard) {
                return { success: false, error: '未找到对应的NFC卡片' };
            }

            // 检查用户是否已有域名
            if (nfcCard.user.domain) {
                return { success: false, error: '用户已拥有域名' };
            }

            // 更新用户域名
            await this.prisma.user.update({
                where: { id: nfcCard.user.id },
                data: { domain: fullDomain }
            });

            this.logger.log(`域名创建成功: ${fullDomain} for UID: ${uid}`);
            return { success: true, domain: fullDomain };

        } catch (error) {
            this.logger.error(`域名创建失败:`, error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * 获取钱包余额
     */
    async getWalletBalance(address: string): Promise<{ inj: string }> {
        try {
            const balance = await this.injectiveService.getAccountBalance(address);
            return { inj: balance.inj || '0.000000' };
        } catch (error) {
            this.logger.error('获取余额失败:', error.message);
            return { inj: '0.000000' };
        }
    }

    /**
     * 获取钱包统计信息
     */
    async getWalletStats(): Promise<{
        totalWallets: number;
        walletsWithDomain: number;
        walletsWithNFT: number;
        fundedWallets: number;
        recentRegistrations: number;
    }> {
        const [totalWallets, walletsWithDomain, walletsWithNFT, fundedWallets, recentRegistrations] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.user.count({
                where: {
                    domain: {
                        not: null,
                    }
                }
            }),
            this.prisma.user.count({
                where: {
                    nftTokenId: {
                        not: null,
                    }
                }
            }),
            this.prisma.user.count({
                where: {
                    initialFunded: true
                }
            }),
            this.prisma.user.count({
                where: {
                    createdAt: {
                        gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // 最近24小时
                    }
                }
            })
        ]);

        return {
            totalWallets,
            walletsWithDomain,
            walletsWithNFT,
            fundedWallets,
            recentRegistrations
        };
    }

    /**
     * 解绑NFC卡片
     */
    async unbindNFC(uid: string): Promise<{ success: boolean; message: string }> {
        // 验证UID格式
        if (!this.validateUID(uid)) {
            throw new BadRequestException('NFC UID格式无效');
        }

        const nfcCard = await this.prisma.nFCCard.findUnique({
            where: { uid },
            include: { user: { include: { nfcCards: true } } }
        });

        if (!nfcCard) {
            throw new NotFoundException('未找到对应的NFC卡片');
        }

        // 检查是否是用户的最后一张卡片
        if (nfcCard.user.nfcCards.length === 1) {
            throw new BadRequestException('不能删除用户的最后一张NFC卡片');
        }

        // 删除NFC卡片
        await this.prisma.nFCCard.delete({
            where: { uid }
        });

        return { success: true, message: 'NFC卡片解绑成功' };
    }

    /**
     * 初始化新用户（发送初始资金）
     */
    private async initializeNewUser(userId: number, address: string): Promise<void> {
        try {
            this.logger.log(`开始初始化新用户: ${address}`);

            const fundingResult = await this.injectiveService.sendInitialFunds(address, '0.1');

            if (fundingResult.success && fundingResult.txHash) {
                // 记录交易
                await this.transactionService.createTransaction({
                    userId,
                    txHash: fundingResult.txHash,
                    type: TransactionType.INITIAL_FUND,
                    amount: '0.1',
                    tokenSymbol: 'INJ',
                    fromAddress: null, // 系统发送
                    toAddress: address,
                    status: TxStatus.PENDING,
                    memo: 'Initial funding for new user'
                });

                // 更新用户资金状态
                await this.prisma.user.update({
                    where: { id: userId },
                    data: { initialFunded: true }
                });

                this.logger.log(`初始资金发送成功: ${address}, tx: ${fundingResult.txHash}`);
            } else {
                this.logger.error(`资金发送失败 for ${address}: ${fundingResult.error}`);
            }
        } catch (error) {
            this.logger.error(`初始化用户失败 ${address}:`, error.message);
        }
    }

    /**
     * 构建钱包响应对象
     */
    private buildWalletResponse(
        user: any,
        nfcCards: any[],
        isNewWallet: boolean
    ): WalletResponseDto {
        return {
            address: user.address,
            ethAddress: user.ethAddress,
            publicKey: user.publicKey,
            domain: user.domain,
            nftTokenId: user.nftTokenId,
            isNewWallet,
            initialFunded: user.initialFunded,
            nfcCards: nfcCards.map(card => ({
                uid: card.uid,
                nickname: card.nickname,
                isActive: card.isActive,
                createdAt: card.createdAt
            })),
            recentTransactions: (user.transactions || []).map(tx => ({
                txHash: tx.txHash,
                type: tx.type,
                amount: tx.amount,
                tokenSymbol: tx.tokenSymbol,
                status: tx.status,
                createdAt: tx.createdAt
            })),
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };
    }

    /**
     * 验证域名格式
     */
    private validateDomain(domain: string): boolean {
        // 域名规则：3-63个字符，只能包含字母、数字和连字符，不能以连字符开头或结尾
        const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{1,61}[a-zA-Z0-9])?$/;
        return domainRegex.test(domain);
    }

    /**
     * 验证NFC UID格式
     */
    private validateUID(uid: string): boolean {
        // NFC UID可能有多种格式，这里做基本验证
        // 常见格式: 十六进制字符串，可能包含冒号分隔符
        const cleanUID = uid.replace(/:/g, '');
        return /^[a-fA-F0-9]{8,28}$/.test(cleanUID);
    }
} 