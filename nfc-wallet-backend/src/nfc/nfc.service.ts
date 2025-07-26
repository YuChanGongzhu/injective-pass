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
import { RegisterDomainDto, DomainNFTResponseDto, DomainAvailabilityDto } from './dto/domain-nft.dto';
import { DrawCatNFTDto, CatNFTResponseDto, CatNFTListDto } from './dto/cat-nft.dto';
// 临时枚举定义，直到Prisma客户端完全生成
enum TransactionType {
    SEND = 'SEND',
    RECEIVE = 'RECEIVE',
    INITIAL_FUND = 'INITIAL_FUND',
    DOMAIN_NFT_MINT = 'DOMAIN_NFT_MINT',
    CAT_NFT_MINT = 'CAT_NFT_MINT',
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
     * 注册NFC卡片并创建或绑定到用户钱包（一一对应关系）
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
            return this.buildWalletResponse(existingCard.user, existingCard, false);
        }

        let user;
        let initialFundTxHash: string | undefined;

        if (userAddress) {
            // 绑定到现有用户
            user = await this.prisma.user.findUnique({
                where: { address: userAddress },
                include: { nfcCard: true, transactions: { take: 5, orderBy: { createdAt: 'desc' } } }
            });

            if (!user) {
                throw new NotFoundException('指定的用户地址不存在');
            }

            // 检查用户是否已经绑定其他NFC卡片
            if (user.nfcCard) {
                throw new ConflictException('该用户已绑定其他NFC卡片，无法绑定新卡片');
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
                include: { nfcCard: true, transactions: { take: 5, orderBy: { createdAt: 'desc' } } }
            });

            this.logger.log(`新建用户钱包: ${user.address} for UID: ${uid}`);

            // 同步发送初始资金并等待完成
            let initialFundTxHash: string | undefined;
            try {
                const fundingResult = await this.initializeNewUser(user.id, user.address);
                initialFundTxHash = fundingResult?.txHash;
            } catch (error) {
                this.logger.error(`初始化用户失败 ${user.address}:`, error.message);
            }
        }

        // 创建NFC卡片记录（一一对应）
        const nfcCard = await this.prisma.nFCCard.create({
            data: {
                uid,
                userId: user.id,
                nickname,
                isActive: true,
                isBlank: true, // 初始为空白卡片
            },
            include: { user: true }
        });

        // 将NFC绑定到链上（如果是新用户）
        if (!userAddress) {
            try {
                this.logger.log(`开始链上绑定NFC: ${uid} -> ${user.address}`);
                const bindResult = await this.injectiveService.detectAndBindBlankCard(uid, user.address);
                if (bindResult.success) {
                    this.logger.log(`链上绑定成功: ${uid}, 交易哈希: ${bindResult.txHash}`);
                } else {
                    this.logger.warn(`链上绑定失败: ${uid}, 错误: ${bindResult.error}`);
                }
            } catch (error) {
                this.logger.warn(`链上绑定NFC失败: ${uid}, 错误: ${error.message}`);
            }
        }

        this.logger.log(`NFC卡片注册成功: ${uid} -> ${user.address}`);

        return this.buildWalletResponse(user, nfcCard, true, initialFundTxHash);
    }

    /**
     * 根据NFC UID获取钱包信息
     */
    async getWalletByUID(uid: string): Promise<WalletResponseDto | null> {
        if (!this.validateUID(uid)) {
            throw new BadRequestException('NFC UID格式无效');
        }

        const nfcCard = await this.prisma.nFCCard.findUnique({
            where: { uid },
            include: {
                user: {
                    include: {
                        transactions: { take: 5, orderBy: { createdAt: 'desc' } }
                    }
                }
            }
        });

        if (!nfcCard) {
            return null;
        }

        return this.buildWalletResponse(nfcCard.user, nfcCard, false);
    }

    /**
     * 绑定NFC卡片到现有用户（一一对应关系）
     */
    async bindNFCCard(bindNFCDto: BindNFCDto): Promise<{ success: boolean; message: string }> {
        const { uid, userAddress } = bindNFCDto;

        if (!this.validateUID(uid)) {
            throw new BadRequestException('NFC UID格式无效');
        }

        // 检查NFC卡片是否已存在
        const existingCard = await this.prisma.nFCCard.findUnique({
            where: { uid }
        });

        if (existingCard) {
            throw new ConflictException('NFC卡片已被绑定');
        }

        // 检查用户是否存在
        const user = await this.prisma.user.findUnique({
            where: { address: userAddress },
            include: { nfcCard: true }
        });

        if (!user) {
            throw new NotFoundException('用户不存在');
        }

        // 检查用户是否已经绑定其他NFC卡片
        if (user.nfcCard) {
            throw new ConflictException('该用户已绑定其他NFC卡片');
        }

        // 创建绑定关系
        await this.prisma.nFCCard.create({
            data: {
                uid,
                userId: user.id,
                isActive: true,
                isBlank: false, // 绑定到现有用户，不是空白卡片
            }
        });

        this.logger.log(`NFC卡片绑定成功: ${uid} -> ${userAddress}`);

        return {
            success: true,
            message: 'NFC卡片绑定成功'
        };
    }

    /**
     * 注册域名NFT（需要初始资金且与NFC绑定）
     */
    async registerDomainNFT(registerDomainDto: RegisterDomainDto): Promise<DomainNFTResponseDto> {
        const { uid, domainPrefix } = registerDomainDto;

        if (!this.validateUID(uid)) { throw new BadRequestException('NFC UID格式无效'); }
        if (!this.validateDomainPrefix(domainPrefix)) { throw new BadRequestException('域名前缀格式无效'); }

        const fullDomain = `${domainPrefix}.inj`;
        const existingDomain = await this.prisma.user.findUnique({ where: { domain: fullDomain } });
        if (existingDomain) { throw new ConflictException('域名已被占用'); }

        const nfcCard = await this.prisma.nFCCard.findUnique({
            where: { uid },
            include: { user: true }
        });
        if (!nfcCard) { throw new NotFoundException('未找到对应的NFC卡片'); }
        if (nfcCard.user.domain) { throw new ConflictException('用户已拥有域名'); }
        if (!nfcCard.user.initialFunded) { throw new BadRequestException('用户尚未获得初始资金，无法注册域名'); }

        try {
            const domainTokenId = `domain_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            // 生成域名NFT的元数据
            const registeredAt = new Date();
            const domainMetadata = this.generateDomainMetadata(fullDomain, registeredAt);
            const imageUrl = this.generateDomainImageUrl(fullDomain);

            const mintResult = await this.injectiveService.mintDomainNFT(
                nfcCard.user.address,
                fullDomain,
                uid, // Pass NFC UID to mintDomainNFT
                domainTokenId,
                domainMetadata // 传入元数据
            );

            if (!mintResult.success) { throw new Error(`域名NFT铸造失败: ${mintResult.error}`); }

            await this.prisma.user.update({
                where: { id: nfcCard.user.id },
                data: {
                    domain: fullDomain,
                    domainTokenId: domainTokenId,
                    domainRegistered: true
                }
            });

            await this.transactionService.createTransaction({
                txHash: mintResult.txHash,
                userId: nfcCard.user.id,
                type: TransactionType.DOMAIN_NFT_MINT,
                amount: '0',
                tokenSymbol: 'INJ',
                fromAddress: nfcCard.user.address,
                toAddress: nfcCard.user.address,
                memo: `域名NFT铸造: ${fullDomain}`,
                rawTx: mintResult.rawTx
            });

            this.logger.log(`域名NFT注册成功: ${fullDomain} for UID: ${uid}`);
            return {
                domain: fullDomain,
                tokenId: domainTokenId,
                txHash: mintResult.txHash,
                registeredAt: new Date(),
                imageUrl: imageUrl
            };
        } catch (error) {
            this.logger.error(`域名NFT注册失败:`, error.message);
            throw new BadRequestException(`域名NFT注册失败: ${error.message}`);
        }
    }

    /**
     * 检查域名可用性
     */
    async checkDomainAvailability(domainPrefix: string): Promise<DomainAvailabilityDto> {
        if (!this.validateDomainPrefix(domainPrefix)) {
            throw new BadRequestException('域名前缀格式无效');
        }

        const fullDomain = `${domainPrefix}.inj`;
        const existingUser = await this.prisma.user.findUnique({
            where: { domain: fullDomain }
        });

        return {
            domain: fullDomain,
            available: !existingUser,
            ownerAddress: existingUser?.address || null
        };
    }

    /**
     * 获取钱包余额
     */
    async getWalletBalance(address: string): Promise<{
        inj: string;
        usd?: string;
    }> {
        try {
            // 调用Injective服务获取余额
            const balanceResult = await this.injectiveService.getAccountBalance(address);

            return {
                inj: balanceResult.inj || '0',
                usd: balanceResult.usd || undefined // USD估值可以通过价格API获取
            };
        } catch (error) {
            this.logger.error(`获取钱包余额失败 ${address}:`, error.message);
            throw new BadRequestException('获取钱包余额失败');
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
        const [
            totalWallets,
            walletsWithDomain,
            fundedWallets,
            recentRegistrations
        ] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.user.count({ where: { domainRegistered: true } }),
            this.prisma.user.count({ where: { initialFunded: true } }),
            this.prisma.user.count({
                where: {
                    createdAt: {
                        gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // 最近24小时
                    }
                }
            })
        ]);

        // 统计有NFT的钱包数量
        const walletsWithNFT = await this.prisma.user.count({
            where: {
                OR: [
                    { domainRegistered: true },
                    { catNFTs: { some: {} } }
                ]
            }
        });

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
    async unbindNFC(uid: string): Promise<{ success: boolean; message: string; txHash?: string; error?: string }> {
        if (!this.validateUID(uid)) {
            throw new BadRequestException('NFC UID格式无效');
        }

        const nfcCard = await this.prisma.nFCCard.findUnique({
            where: { uid },
            include: { user: true }
        });

        if (!nfcCard) {
            throw new NotFoundException('NFC卡片不存在');
        }

        // 检查用户是否拥有域名，如果有域名则不允许解绑
        if (nfcCard.user.domain) {
            throw new BadRequestException('用户已拥有域名，无法解绑NFC卡片');
        }

        try {
            // 调用链交互：紧急解绑（简化版本，实际可能需要用户签名）
            this.logger.log(`开始链上解绑NFC: ${uid}`);
            const txHash = await this.injectiveService.emergencyUnbindNFCWallet(uid);

            // 删除本地数据库记录
            await this.prisma.nFCCard.delete({
                where: { uid }
            });

            this.logger.log(`NFC卡片解绑成功: ${uid}, 交易哈希: ${txHash}`);

            return {
                success: true,
                message: 'NFC卡片解绑成功',
                txHash: txHash
            };
        } catch (error) {
            this.logger.error(`NFC卡片解绑失败: ${uid}`, error.message);
            return {
                success: false,
                message: 'NFC卡片解绑失败',
                error: error.message
            };
        }
    }

    /**
     * 初始化新用户（发送初始资金）
     */
    private async initializeNewUser(userId: number, address: string): Promise<{ success: boolean; txHash?: string }> {
        try {
            const amount = '0.1'; // 0.1 INJ
            const result = await this.injectiveService.sendInjectiveTokens(address, amount);

            if (result.success) {
                await this.prisma.user.update({
                    where: { id: userId },
                    data: { initialFunded: true }
                });

                await this.transactionService.createTransaction({
                    txHash: result.txHash,
                    userId,
                    type: TransactionType.INITIAL_FUND,
                    amount,
                    tokenSymbol: 'INJ',
                    fromAddress: process.env.MASTER_WALLET_ADDRESS,
                    toAddress: address,
                    memo: '初始资金',
                    rawTx: result.rawTx
                });

                this.logger.log(`初始资金发送成功: ${address} -> ${amount} INJ, txHash: ${result.txHash}`);
                return { success: true, txHash: result.txHash };
            } else {
                this.logger.error(`初始资金发送失败: ${result.error}`);
                return { success: false };
            }
        } catch (error) {
            this.logger.error(`初始化用户失败: ${error.message}`);
            return { success: false };
        }
    }

    /**
     * 构建钱包响应
     */
    private buildWalletResponse(
        user: any,
        nfcCard: any,
        isNewWallet: boolean,
        initialFundTxHash?: string
    ): WalletResponseDto {
        const recentTransactions = user.transactions?.map((tx: any) => ({
            txHash: tx.txHash,
            type: tx.type,
            amount: tx.amount,
            tokenSymbol: tx.tokenSymbol,
            status: tx.status,
            createdAt: tx.createdAt
        })) || [];

        return {
            address: user.address,
            ethAddress: user.ethAddress,
            domain: user.domain,
            domainTokenId: user.domainTokenId,
            initialFunded: user.initialFunded,
            domainRegistered: user.domainRegistered,
            nfcCard: nfcCard ? {
                uid: nfcCard.uid,
                nickname: nfcCard.nickname,
                isActive: nfcCard.isActive,
                isBlank: nfcCard.isBlank
            } : null,
            recentTransactions,
            isNewWallet,
            initialFundTxHash
        };
    }

    /**
     * 获取合约状态信息
     */
    async getContractStatus(): Promise<{
        nfcRegistry: boolean;
        domainNFT: boolean;
        catNFT: boolean;
        networkInfo: any;
    }> {
        return this.injectiveService.getContractStatus();
    }

    /**
     * 验证NFC UID格式
     */
    private validateUID(uid: string): boolean {
        // 支持多种NFC UID格式
        const patterns = [
            /^[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}$/, // 4字节格式
            /^[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}$/, // 7字节格式
            /^[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}$/, // 8字节格式
            /^[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}:[0-9A-Fa-f]+$/ // 8字节+扩展格式
        ];

        return patterns.some(pattern => pattern.test(uid));
    }

    /**
     * 验证域名格式
     */
    private validateDomain(domain: string): boolean {
        const regex = /^[a-z0-9]+([a-z0-9-]*[a-z0-9])?\.inj$/;
        return domain.length >= 4 && domain.length <= 35 && regex.test(domain);
    }

    /**
     * 验证域名前缀格式
     */
    private validateDomainPrefix(domainPrefix: string): boolean {
        const regex = /^[a-z0-9]+([a-z0-9-]*[a-z0-9])?$/;
        return domainPrefix.length >= 3 &&
            domainPrefix.length <= 30 &&
            regex.test(domainPrefix) &&
            !domainPrefix.includes('--');
    }

    /**
     * 传统抽卡获得小猫NFT（简化版）
     */
    async drawCatNFT(drawCatNFTDto: DrawCatNFTDto): Promise<CatNFTResponseDto> {
        const { nfcUID, catName } = drawCatNFTDto;

        if (!this.validateUID(nfcUID)) {
            throw new BadRequestException('NFC UID格式无效');
        }

        // 查找NFC卡片和用户
        const nfcCard = await this.prisma.nFCCard.findUnique({
            where: { uid: nfcUID },
            include: { user: true }
        });

        if (!nfcCard) {
            throw new NotFoundException('未找到NFC卡片');
        }

        if (!nfcCard.user.initialFunded) {
            throw new BadRequestException('用户尚未获得初始资金，无法抽卡');
        }

        // 检查用户是否已有同名小猫
        const existingCat = await this.prisma.catNFT.findFirst({
            where: {
                userId: nfcCard.user.id,
                name: catName
            }
        });

        if (existingCat) {
            throw new ConflictException('小猫名称已被使用');
        }

        try {
            // 调用合约进行传统抽卡
            const mintResult = await this.injectiveService.mintCatNFT(
                nfcCard.user.address,
                catName
            );

            if (!mintResult.success) {
                throw new Error(`抽卡失败: ${mintResult.error}`);
            }

            // 根据颜色生成图片URL
            const imageUrl = this.generateCatImageUrl(mintResult.color);

            // 优先使用合约返回的tokenId，否则使用交易哈希
            const contractTokenId = mintResult.rawTx?.tokenId;
            let finalTokenId: string;

            if (contractTokenId && contractTokenId.trim() !== '' && contractTokenId !== '0') {
                // 使用合约返回的真实tokenId
                finalTokenId = contractTokenId;
                this.logger.log(`使用合约tokenId: "${finalTokenId}"`);
            } else {
                // 使用交易哈希作为备用ID（截取前16位确保唯一性）
                finalTokenId = `tx_${mintResult.txHash.slice(2, 18)}`;
                this.logger.log(`合约tokenId无效("${contractTokenId}")，使用交易哈希: "${finalTokenId}"`);
            }

            try {
                // 保存到数据库
                const catNFT = await this.prisma.catNFT.create({
                    data: {
                        tokenId: finalTokenId,
                        userId: nfcCard.user.id,
                        name: catName,
                        rarity: mintResult.rarity as any, // 转换为Prisma枚举
                        color: mintResult.color,
                        imageUrl: imageUrl,
                        metadata: {
                            rarity: mintResult.rarity,
                            color: mintResult.color,
                            description: `A ${mintResult.color} cat with ${mintResult.rarity} rarity`
                        }
                    }
                });

                // 记录交易
                await this.transactionService.createTransaction({
                    txHash: mintResult.txHash,
                    userId: nfcCard.user.id,
                    type: TransactionType.CAT_NFT_MINT,
                    amount: '0.1', // 抽卡费用
                    tokenSymbol: 'INJ',
                    fromAddress: nfcCard.user.address,
                    toAddress: nfcCard.user.address,
                    memo: `抽卡: ${catName}`,
                    rawTx: mintResult.rawTx
                });

                this.logger.log(`抽卡成功: ${catName} -> ${nfcCard.user.address}, Rarity: ${mintResult.rarity}, Color: ${mintResult.color}`);

                return {
                    tokenId: catNFT.tokenId,
                    name: catNFT.name,
                    rarity: catNFT.rarity,
                    color: catNFT.color,
                    imageUrl: catNFT.imageUrl,
                    metadata: catNFT.metadata as Record<string, any>,
                    txHash: mintResult.txHash,
                    mintedAt: catNFT.mintedAt
                };
            } catch (dbError) {
                this.logger.error(`保存小猫NFT到数据库失败:`, dbError.message);
                throw new BadRequestException(`抽卡失败: ${dbError.message}`);
            }
        } catch (error) {
            this.logger.error(`抽卡失败:`, error.message);
            throw new BadRequestException(`抽卡失败: ${error.message}`);
        }
    }

    /**
     * 获取用户的小猫NFT列表
     */
    async getUserCatNFTs(uid: string): Promise<CatNFTListDto> {
        if (!this.validateUID(uid)) {
            throw new BadRequestException('NFC UID格式无效');
        }

        const nfcCard = await this.prisma.nFCCard.findUnique({
            where: { uid },
            include: { user: true }
        });

        if (!nfcCard) {
            throw new NotFoundException('未找到对应的NFC卡片');
        }

        const catNFTs = await this.prisma.catNFT.findMany({
            where: { userId: nfcCard.user.id },
            orderBy: { mintedAt: 'desc' }
        });

        const cats = catNFTs.map(cat => ({
            tokenId: cat.tokenId,
            name: cat.name,
            rarity: cat.rarity,
            color: cat.color,
            imageUrl: cat.imageUrl,
            metadata: cat.metadata as Record<string, any>,
            txHash: '', // 这里可以从交易记录中获取
            mintedAt: cat.mintedAt
        }));

        return {
            cats,
            total: cats.length,
            page: 1,
            totalPages: 1
        };
    }

    /**
     * 获取用户的域名NFT详情 (包含图片和元数据)
     */
    async getUserDomainNFT(uid: string) {
        const nfcCard = await this.prisma.nFCCard.findUnique({
            where: { uid },
            include: { user: true }
        });

        if (!nfcCard) {
            throw new NotFoundException('未找到对应的NFC卡片');
        }

        const user = nfcCard.user;
        if (!user.domain || !user.domainRegistered) {
            return null;
        }

        // 生成域名NFT的图片URL和元数据
        const imageUrl = this.generateDomainImageUrl(user.domain);
        const domainMetadata = this.generateDomainMetadata(
            user.domain,
            user.createdAt // 使用创建时间作为注册时间
        );

        return {
            domain: user.domain,
            tokenId: user.domainTokenId,
            imageUrl: imageUrl,
            metadata: domainMetadata,
            registeredAt: user.createdAt,
            isActive: true
        };
    }



    /**
     * 手动绑定NFC到链上（测试用）
     */
    async manualBindNFC(uid: string): Promise<{ success: boolean; message: string; txHash?: string; error?: string }> {
        if (!this.validateUID(uid)) {
            throw new BadRequestException('NFC UID格式无效');
        }

        const nfcCard = await this.prisma.nFCCard.findUnique({
            where: { uid },
            include: { user: true }
        });

        if (!nfcCard) {
            return {
                success: false,
                message: 'NFC卡片不存在'
            };
        }

        try {
            this.logger.log(`开始手动绑定NFC到链上: ${uid} -> ${nfcCard.user.address}`);
            const bindResult = await this.injectiveService.detectAndBindBlankCard(uid, nfcCard.user.address);

            if (bindResult.success) {
                this.logger.log(`手动绑定成功: ${uid}, 交易哈希: ${bindResult.txHash}`);
                return {
                    success: true,
                    message: 'NFC手动绑定成功',
                    txHash: bindResult.txHash
                };
            } else {
                return {
                    success: false,
                    message: 'NFC手动绑定失败',
                    error: bindResult.error
                };
            }
        } catch (error) {
            this.logger.error(`手动绑定NFC失败: ${uid}`, error.message);
            return {
                success: false,
                message: 'NFC手动绑定失败',
                error: error.message
            };
        }
    }

    /**
     * 生成小猫图片URL
     */
    private generateCatImageUrl(color: string): string {
        // 使用实际的IPFS图片链接
        const imageMap = {
            'black': 'https://bafybeieljhlspz52bir4cor4p3ww5zlo7ifyzdf2givip635kxgwpgnhmq.ipfs.w3s.link/black.png',
            'green': 'https://bafybeifgbuvorq2o6uztzg3ekf2m3lezu2fh65aydttuavs2thy63zauja.ipfs.w3s.link/grow.png',
            'red': 'https://bafybeiedm7slz2lszetnakzddshedf3oirgy2iqfvykzpx5qxp3kji4xpi.ipfs.w3s.link/red.png',
            'orange': 'https://bafybeifm2mxuyfdituhty23ejoeojp23mpbyavsufg5hb2vwsxjftfzplu.ipfs.w3s.link/orange.png',
            'purple': 'https://bafybeibmuw3eypvh4p5k33pquhkxmt7cktuobtjk7cm5fqgz2dl2ewpr24.ipfs.w3s.link/purple.png',
            'blue': 'https://bafybeibirtf5cu6kacoukvplxneodjrak5dvpbi3pepjatwhjijyl5xca4.ipfs.w3s.link/blue.png',
            'rainbow': 'https://bafybeibirtf5cu6kacoukvplxneodjrak5dvpbi3pepjatwhjijyl5xca4.ipfs.w3s.link/max.jpg'
        };

        return imageMap[color] || 'https://bafybeieljhlspz52bir4cor4p3ww5zlo7ifyzdf2givip635kxgwpgnhmq.ipfs.w3s.link/black.png';
    }

    /**
     * 生成域名NFT图片URL (统一使用固定图片)
     */
    private generateDomainImageUrl(domain: string): string {
        // 所有域名NFT都使用统一的图片
        return 'https://bafybeih4nkltzoflarix3ghpjpemjyg2vcu2sywi4wku4uthhacs5uoh2a.ipfs.w3s.link/fir.png';
    }

    /**
     * 生成域名NFT元数据
     */
    private generateDomainMetadata(domain: string, registeredAt: Date): any {
        return {
            name: `INJ Domain: ${domain}`,
            description: `Injective domain name NFT for ${domain}`,
            image: this.generateDomainImageUrl(domain),
            attributes: [
                {
                    trait_type: "Domain",
                    value: domain
                },
                {
                    trait_type: "TLD",
                    value: ".inj"
                },
                {
                    trait_type: "Registered At",
                    value: registeredAt.toISOString()
                },
                {
                    trait_type: "Type",
                    value: "Domain NFT"
                }
            ]
        };
    }
}