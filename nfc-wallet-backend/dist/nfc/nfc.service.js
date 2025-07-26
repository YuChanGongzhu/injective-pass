"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var NFCService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NFCService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const crypto_service_1 = require("../crypto/crypto.service");
const injective_service_1 = require("../contract/injective.service");
const transaction_service_1 = require("../contract/transaction.service");
var TransactionType;
(function (TransactionType) {
    TransactionType["SEND"] = "SEND";
    TransactionType["RECEIVE"] = "RECEIVE";
    TransactionType["INITIAL_FUND"] = "INITIAL_FUND";
    TransactionType["DOMAIN_NFT_MINT"] = "DOMAIN_NFT_MINT";
    TransactionType["CAT_NFT_MINT"] = "CAT_NFT_MINT";
    TransactionType["DOMAIN_REG"] = "DOMAIN_REG";
    TransactionType["SWAP"] = "SWAP";
    TransactionType["STAKE"] = "STAKE";
    TransactionType["UNSTAKE"] = "UNSTAKE";
})(TransactionType || (TransactionType = {}));
var TxStatus;
(function (TxStatus) {
    TxStatus["PENDING"] = "PENDING";
    TxStatus["CONFIRMED"] = "CONFIRMED";
    TxStatus["FAILED"] = "FAILED";
    TxStatus["CANCELLED"] = "CANCELLED";
})(TxStatus || (TxStatus = {}));
let NFCService = NFCService_1 = class NFCService {
    constructor(prisma, cryptoService, injectiveService, transactionService) {
        this.prisma = prisma;
        this.cryptoService = cryptoService;
        this.injectiveService = injectiveService;
        this.transactionService = transactionService;
        this.logger = new common_1.Logger(NFCService_1.name);
    }
    async registerNFC(registerNFCDto) {
        const { uid, userAddress, nickname } = registerNFCDto;
        if (!this.validateUID(uid)) {
            throw new common_1.BadRequestException('NFC UID格式无效');
        }
        const existingCard = await this.prisma.nFCCard.findUnique({
            where: { uid },
            include: { user: true }
        });
        if (existingCard) {
            return this.buildWalletResponse(existingCard.user, existingCard, false);
        }
        let user;
        let initialFundTxHash;
        if (userAddress) {
            user = await this.prisma.user.findUnique({
                where: { address: userAddress },
                include: { nfcCard: true, transactions: { take: 5, orderBy: { createdAt: 'desc' } } }
            });
            if (!user) {
                throw new common_1.NotFoundException('指定的用户地址不存在');
            }
            if (user.nfcCard) {
                throw new common_1.ConflictException('该用户已绑定其他NFC卡片，无法绑定新卡片');
            }
        }
        else {
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
            let initialFundTxHash;
            try {
                const fundingResult = await this.initializeNewUser(user.id, user.address);
                initialFundTxHash = fundingResult?.txHash;
            }
            catch (error) {
                this.logger.error(`初始化用户失败 ${user.address}:`, error.message);
            }
        }
        const nfcCard = await this.prisma.nFCCard.create({
            data: {
                uid,
                userId: user.id,
                nickname,
                isActive: true,
                isBlank: true,
            },
            include: { user: true }
        });
        if (!userAddress) {
            try {
                this.logger.log(`开始链上绑定NFC: ${uid} -> ${user.address}`);
                const bindResult = await this.injectiveService.detectAndBindBlankCard(uid, user.address);
                if (bindResult.success) {
                    this.logger.log(`链上绑定成功: ${uid}, 交易哈希: ${bindResult.txHash}`);
                }
                else {
                    this.logger.warn(`链上绑定失败: ${uid}, 错误: ${bindResult.error}`);
                }
            }
            catch (error) {
                this.logger.warn(`链上绑定NFC失败: ${uid}, 错误: ${error.message}`);
            }
        }
        this.logger.log(`NFC卡片注册成功: ${uid} -> ${user.address}`);
        return this.buildWalletResponse(user, nfcCard, true, initialFundTxHash);
    }
    async getWalletByUID(uid) {
        if (!this.validateUID(uid)) {
            throw new common_1.BadRequestException('NFC UID格式无效');
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
    async bindNFCCard(bindNFCDto) {
        const { uid, userAddress } = bindNFCDto;
        if (!this.validateUID(uid)) {
            throw new common_1.BadRequestException('NFC UID格式无效');
        }
        const existingCard = await this.prisma.nFCCard.findUnique({
            where: { uid }
        });
        if (existingCard) {
            throw new common_1.ConflictException('NFC卡片已被绑定');
        }
        const user = await this.prisma.user.findUnique({
            where: { address: userAddress },
            include: { nfcCard: true }
        });
        if (!user) {
            throw new common_1.NotFoundException('用户不存在');
        }
        if (user.nfcCard) {
            throw new common_1.ConflictException('该用户已绑定其他NFC卡片');
        }
        await this.prisma.nFCCard.create({
            data: {
                uid,
                userId: user.id,
                isActive: true,
                isBlank: false,
            }
        });
        this.logger.log(`NFC卡片绑定成功: ${uid} -> ${userAddress}`);
        return {
            success: true,
            message: 'NFC卡片绑定成功'
        };
    }
    async registerDomainNFT(registerDomainDto) {
        const { uid, domainPrefix } = registerDomainDto;
        if (!this.validateUID(uid)) {
            throw new common_1.BadRequestException('NFC UID格式无效');
        }
        if (!this.validateDomainPrefix(domainPrefix)) {
            throw new common_1.BadRequestException('域名前缀格式无效');
        }
        const fullDomain = `${domainPrefix}.inj`;
        const existingDomain = await this.prisma.user.findUnique({ where: { domain: fullDomain } });
        if (existingDomain) {
            throw new common_1.ConflictException('域名已被占用');
        }
        const nfcCard = await this.prisma.nFCCard.findUnique({
            where: { uid },
            include: { user: true }
        });
        if (!nfcCard) {
            throw new common_1.NotFoundException('未找到对应的NFC卡片');
        }
        if (nfcCard.user.domain) {
            throw new common_1.ConflictException('用户已拥有域名');
        }
        if (!nfcCard.user.initialFunded) {
            throw new common_1.BadRequestException('用户尚未获得初始资金，无法注册域名');
        }
        try {
            const domainTokenId = `domain_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const registeredAt = new Date();
            const domainMetadata = this.generateDomainMetadata(fullDomain, registeredAt);
            const imageUrl = this.generateDomainImageUrl(fullDomain);
            const mintResult = await this.injectiveService.mintDomainNFT(nfcCard.user.address, fullDomain, uid, domainTokenId, domainMetadata);
            if (!mintResult.success) {
                throw new Error(`域名NFT铸造失败: ${mintResult.error}`);
            }
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
        }
        catch (error) {
            this.logger.error(`域名NFT注册失败:`, error.message);
            throw new common_1.BadRequestException(`域名NFT注册失败: ${error.message}`);
        }
    }
    async checkDomainAvailability(domainPrefix) {
        if (!this.validateDomainPrefix(domainPrefix)) {
            throw new common_1.BadRequestException('域名前缀格式无效');
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
    async getWalletBalance(address) {
        try {
            const balanceResult = await this.injectiveService.getAccountBalance(address);
            return {
                inj: balanceResult.inj || '0',
                usd: balanceResult.usd || undefined
            };
        }
        catch (error) {
            this.logger.error(`获取钱包余额失败 ${address}:`, error.message);
            throw new common_1.BadRequestException('获取钱包余额失败');
        }
    }
    async getWalletStats() {
        const [totalWallets, walletsWithDomain, fundedWallets, recentRegistrations] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.user.count({ where: { domainRegistered: true } }),
            this.prisma.user.count({ where: { initialFunded: true } }),
            this.prisma.user.count({
                where: {
                    createdAt: {
                        gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
                    }
                }
            })
        ]);
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
    async unbindNFC(uid) {
        if (!this.validateUID(uid)) {
            throw new common_1.BadRequestException('NFC UID格式无效');
        }
        const nfcCard = await this.prisma.nFCCard.findUnique({
            where: { uid },
            include: { user: true }
        });
        if (!nfcCard) {
            throw new common_1.NotFoundException('NFC卡片不存在');
        }
        if (nfcCard.user.domain) {
            throw new common_1.BadRequestException('用户已拥有域名，无法解绑NFC卡片');
        }
        try {
            this.logger.log(`开始链上解绑NFC: ${uid}`);
            const txHash = await this.injectiveService.emergencyUnbindNFCWallet(uid);
            await this.prisma.nFCCard.delete({
                where: { uid }
            });
            this.logger.log(`NFC卡片解绑成功: ${uid}, 交易哈希: ${txHash}`);
            return {
                success: true,
                message: 'NFC卡片解绑成功',
                txHash: txHash
            };
        }
        catch (error) {
            this.logger.error(`NFC卡片解绑失败: ${uid}`, error.message);
            return {
                success: false,
                message: 'NFC卡片解绑失败',
                error: error.message
            };
        }
    }
    async initializeNewUser(userId, address) {
        try {
            const amount = '0.1';
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
            }
            else {
                this.logger.error(`初始资金发送失败: ${result.error}`);
                return { success: false };
            }
        }
        catch (error) {
            this.logger.error(`初始化用户失败: ${error.message}`);
            return { success: false };
        }
    }
    buildWalletResponse(user, nfcCard, isNewWallet, initialFundTxHash) {
        const recentTransactions = user.transactions?.map((tx) => ({
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
    async getContractStatus() {
        return this.injectiveService.getContractStatus();
    }
    validateUID(uid) {
        const patterns = [
            /^[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}$/,
            /^[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}$/,
            /^[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}$/,
            /^[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}:[0-9A-Fa-f]+$/
        ];
        return patterns.some(pattern => pattern.test(uid));
    }
    validateDomain(domain) {
        const regex = /^[a-z0-9]+([a-z0-9-]*[a-z0-9])?\.inj$/;
        return domain.length >= 4 && domain.length <= 35 && regex.test(domain);
    }
    validateDomainPrefix(domainPrefix) {
        const regex = /^[a-z0-9]+([a-z0-9-]*[a-z0-9])?$/;
        return domainPrefix.length >= 3 &&
            domainPrefix.length <= 30 &&
            regex.test(domainPrefix) &&
            !domainPrefix.includes('--');
    }
    async drawCatNFT(drawCatNFTDto) {
        const { nfcUID, catName } = drawCatNFTDto;
        if (!this.validateUID(nfcUID)) {
            throw new common_1.BadRequestException('NFC UID格式无效');
        }
        const nfcCard = await this.prisma.nFCCard.findUnique({
            where: { uid: nfcUID },
            include: { user: true }
        });
        if (!nfcCard) {
            throw new common_1.NotFoundException('未找到NFC卡片');
        }
        if (!nfcCard.user.initialFunded) {
            throw new common_1.BadRequestException('用户尚未获得初始资金，无法抽卡');
        }
        const existingCat = await this.prisma.catNFT.findFirst({
            where: {
                userId: nfcCard.user.id,
                name: catName
            }
        });
        if (existingCat) {
            throw new common_1.ConflictException('小猫名称已被使用');
        }
        try {
            const mintResult = await this.injectiveService.mintCatNFT(nfcCard.user.address, catName);
            if (!mintResult.success) {
                throw new Error(`抽卡失败: ${mintResult.error}`);
            }
            const imageUrl = this.generateCatImageUrl(mintResult.color);
            const contractTokenId = mintResult.rawTx?.tokenId;
            let finalTokenId;
            if (contractTokenId && contractTokenId.trim() !== '' && contractTokenId !== '0') {
                finalTokenId = contractTokenId;
                this.logger.log(`使用合约tokenId: "${finalTokenId}"`);
            }
            else {
                finalTokenId = `tx_${mintResult.txHash.slice(2, 18)}`;
                this.logger.log(`合约tokenId无效("${contractTokenId}")，使用交易哈希: "${finalTokenId}"`);
            }
            try {
                const catNFT = await this.prisma.catNFT.create({
                    data: {
                        tokenId: finalTokenId,
                        userId: nfcCard.user.id,
                        name: catName,
                        rarity: mintResult.rarity,
                        color: mintResult.color,
                        imageUrl: imageUrl,
                        metadata: {
                            rarity: mintResult.rarity,
                            color: mintResult.color,
                            description: `A ${mintResult.color} cat with ${mintResult.rarity} rarity`
                        }
                    }
                });
                await this.transactionService.createTransaction({
                    txHash: mintResult.txHash,
                    userId: nfcCard.user.id,
                    type: TransactionType.CAT_NFT_MINT,
                    amount: '0.1',
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
                    metadata: catNFT.metadata,
                    txHash: mintResult.txHash,
                    mintedAt: catNFT.mintedAt
                };
            }
            catch (dbError) {
                this.logger.error(`保存小猫NFT到数据库失败:`, dbError.message);
                throw new common_1.BadRequestException(`抽卡失败: ${dbError.message}`);
            }
        }
        catch (error) {
            this.logger.error(`抽卡失败:`, error.message);
            throw new common_1.BadRequestException(`抽卡失败: ${error.message}`);
        }
    }
    async getUserCatNFTs(uid) {
        if (!this.validateUID(uid)) {
            throw new common_1.BadRequestException('NFC UID格式无效');
        }
        const nfcCard = await this.prisma.nFCCard.findUnique({
            where: { uid },
            include: { user: true }
        });
        if (!nfcCard) {
            throw new common_1.NotFoundException('未找到对应的NFC卡片');
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
            metadata: cat.metadata,
            txHash: '',
            mintedAt: cat.mintedAt
        }));
        return {
            cats,
            total: cats.length,
            page: 1,
            totalPages: 1
        };
    }
    async getUserDomainNFT(uid) {
        const nfcCard = await this.prisma.nFCCard.findUnique({
            where: { uid },
            include: { user: true }
        });
        if (!nfcCard) {
            throw new common_1.NotFoundException('未找到对应的NFC卡片');
        }
        const user = nfcCard.user;
        if (!user.domain || !user.domainRegistered) {
            return null;
        }
        const imageUrl = this.generateDomainImageUrl(user.domain);
        const domainMetadata = this.generateDomainMetadata(user.domain, user.createdAt);
        return {
            domain: user.domain,
            tokenId: user.domainTokenId,
            imageUrl: imageUrl,
            metadata: domainMetadata,
            registeredAt: user.createdAt,
            isActive: true
        };
    }
    async manualBindNFC(uid) {
        if (!this.validateUID(uid)) {
            throw new common_1.BadRequestException('NFC UID格式无效');
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
            }
            else {
                return {
                    success: false,
                    message: 'NFC手动绑定失败',
                    error: bindResult.error
                };
            }
        }
        catch (error) {
            this.logger.error(`手动绑定NFC失败: ${uid}`, error.message);
            return {
                success: false,
                message: 'NFC手动绑定失败',
                error: error.message
            };
        }
    }
    generateCatImageUrl(color) {
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
    generateDomainImageUrl(domain) {
        return 'https://bafybeih4nkltzoflarix3ghpjpemjyg2vcu2sywi4wku4uthhacs5uoh2a.ipfs.w3s.link/fir.png';
    }
    generateDomainMetadata(domain, registeredAt) {
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
};
exports.NFCService = NFCService;
exports.NFCService = NFCService = NFCService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        crypto_service_1.CryptoService,
        injective_service_1.InjectiveService,
        transaction_service_1.TransactionService])
], NFCService);
//# sourceMappingURL=nfc.service.js.map