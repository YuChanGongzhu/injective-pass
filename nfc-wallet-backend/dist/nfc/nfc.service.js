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
    async decryptUserPrivateKey(encryptedPrivateKey) {
        try {
            return this.cryptoService.decrypt(encryptedPrivateKey);
        }
        catch (error) {
            this.logger.error('私钥解密失败:', error.message);
            throw new common_1.BadRequestException('用户私钥解密失败');
        }
    }
    async bindNFCToContract(user, uid) {
        try {
            const bindResult = await this.injectiveService.detectAndBindBlankCard(uid, user.ethAddress);
            if (bindResult.success) {
                this.logger.log(`NFC卡片已自动绑定到合约: ${uid} -> ${user.address}`);
            }
            else {
                this.logger.error(`NFC自动绑定失败: ${bindResult.error}`);
            }
        }
        catch (error) {
            this.logger.error(`NFC自动绑定过程中出现错误:`, error.message);
        }
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
            try {
                await this.initializeNewUser(user.id, user.address);
                this.logger.log(`用户初始化完成: ${user.address}`);
            }
            catch (error) {
                this.logger.error(`初始化用户失败 ${user.address}:`, error.message);
            }
        }
        let validNickname = nickname;
        if (validNickname && validNickname.length > 100) {
            validNickname = validNickname.substring(0, 100);
            this.logger.warn(`昵称过长已截断: ${nickname.length} -> 100 字符`);
        }
        const nfcCard = await this.prisma.nFCCard.create({
            data: {
                uid,
                userId: user.id,
                nickname: validNickname,
                isActive: true,
                isBlank: true,
            },
            include: { user: true }
        });
        this.logger.log(`NFC卡片注册成功: ${uid} -> ${user.address}`);
        try {
            await this.bindNFCToContract(user, uid);
        }
        catch (error) {
            this.logger.error(`自动绑定NFC到合约失败 ${uid}:`, error.message);
        }
        return this.buildWalletResponse(user, nfcCard, true);
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
    async manualBindNFCToContract(uid) {
        if (!this.validateUID(uid)) {
            throw new common_1.BadRequestException('NFC UID格式无效');
        }
        const nfcCard = await this.prisma.nFCCard.findUnique({
            where: { uid },
            include: { user: true }
        });
        if (!nfcCard) {
            throw new common_1.NotFoundException('NFC卡片不存在，请先注册');
        }
        try {
            const bindResult = await this.injectiveService.detectAndBindBlankCard(uid, nfcCard.user.ethAddress);
            if (bindResult.success) {
                this.logger.log(`手动绑定NFC到合约成功: ${uid} -> ${nfcCard.user.address}`);
                return {
                    success: true,
                    message: 'NFC成功绑定到合约',
                    transactionHash: bindResult.txHash
                };
            }
            else {
                throw new Error(bindResult.error || '绑定失败');
            }
        }
        catch (error) {
            this.logger.error(`手动绑定NFC到合约失败 ${uid}:`, error.message);
            throw new common_1.BadRequestException(`绑定失败: ${error.message}`);
        }
    }
    async registerDomainNFT(registerDomainDto) {
        const { uid, domainPrefix } = registerDomainDto;
        if (!this.validateUID(uid)) {
            throw new common_1.BadRequestException('NFC UID格式无效');
        }
        if (!this.validateDomainSuffix(domainPrefix)) {
            throw new common_1.BadRequestException('域名后缀格式无效');
        }
        const fullDomain = `advx-${domainPrefix}.inj`;
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
            const userPrivateKey = await this.decryptUserPrivateKey(nfcCard.user.privateKeyEnc);
            const mintResult = await this.injectiveService.mintDomainNFT(nfcCard.user.address, fullDomain, uid, domainTokenId, userPrivateKey);
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
            return { domain: fullDomain, tokenId: domainTokenId, txHash: mintResult.txHash, registeredAt: new Date() };
        }
        catch (error) {
            this.logger.error(`域名NFT注册失败:`, error.message);
            throw new common_1.BadRequestException(`域名NFT注册失败: ${error.message}`);
        }
    }
    async checkDomainAvailability(domainSuffix) {
        if (!this.validateDomainSuffix(domainSuffix)) {
            throw new common_1.BadRequestException('域名后缀格式无效');
        }
        const fullDomain = `advx-${domainSuffix}.inj`;
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
        await this.prisma.nFCCard.delete({
            where: { uid }
        });
        this.logger.log(`NFC卡片解绑成功: ${uid}`);
        return {
            success: true,
            message: 'NFC卡片解绑成功'
        };
    }
    async initializeNewUser(userId, address) {
        try {
            const amount = '0.1';
            const user = await this.prisma.user.findUnique({
                where: { id: userId }
            });
            if (!user) {
                throw new Error('用户不存在');
            }
            console.log(`发送初始资金到 Injective 地址: ${user.address}`);
            const result = await this.injectiveService.sendInjectiveTokens(user.address, amount);
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
                this.logger.log(`初始资金发送成功: ${address} -> ${amount} INJ`);
            }
            else {
                this.logger.error(`初始资金发送失败: ${result.error}`);
            }
        }
        catch (error) {
            this.logger.error(`初始化用户失败: ${error.message}`);
        }
    }
    buildWalletResponse(user, nfcCard, isNewWallet) {
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
            isNewWallet
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
    validateDomainSuffix(domainSuffix) {
        if (!domainSuffix || typeof domainSuffix !== 'string') {
            return false;
        }
        if (domainSuffix.length < 1 || domainSuffix.length > 25) {
            return false;
        }
        const regex = /^[a-z0-9]+([a-z0-9-]*[a-z0-9])?$/;
        if (!regex.test(domainSuffix)) {
            return false;
        }
        if (domainSuffix.includes('--')) {
            return false;
        }
        return true;
    }
    validateDomainPrefix(domainPrefix) {
        return this.validateDomainSuffix(domainPrefix);
    }
    async socialInteraction(socialInteractionDto) {
        const { myNFC, otherNFC } = socialInteractionDto;
        if (!this.validateUID(myNFC)) {
            throw new common_1.BadRequestException('自己的NFC UID格式无效');
        }
        if (!this.validateUID(otherNFC)) {
            throw new common_1.BadRequestException('其他NFC UID格式无效');
        }
        if (myNFC === otherNFC) {
            throw new common_1.BadRequestException('不能与自己的NFC卡片互动');
        }
        const myNfcCard = await this.prisma.nFCCard.findUnique({
            where: { uid: myNFC },
            include: { user: true }
        });
        if (!myNfcCard) {
            throw new common_1.NotFoundException('未找到自己的NFC卡片');
        }
        const otherNfcCard = await this.prisma.nFCCard.findUnique({
            where: { uid: otherNFC },
            include: { user: true }
        });
        if (!otherNfcCard) {
            throw new common_1.NotFoundException('未找到其他用户的NFC卡片');
        }
        try {
            const userPrivateKey = await this.decryptUserPrivateKey(myNfcCard.user.privateKeyEnc);
            const isAuthorized = await this.injectiveService.checkUserAuthorization(myNfcCard.user.ethAddress);
            if (!isAuthorized) {
                this.logger.warn(`用户 ${myNfcCard.user.ethAddress} 未获得授权，尝试手动授权`);
                const authResult = await this.injectiveService.authorizeUser(myNfcCard.user.ethAddress);
                if (!authResult.success) {
                    throw new Error(`用户授权失败: ${authResult.error}`);
                }
                this.logger.log(`用户 ${myNfcCard.user.ethAddress} 授权成功`);
            }
            const interactionResult = await this.injectiveService.socialInteraction(myNFC, otherNFC, userPrivateKey);
            if (!interactionResult.success) {
                throw new Error(`社交互动失败: ${interactionResult.error}`);
            }
            this.logger.log(`社交互动成功: ${myNFC} 与 ${otherNFC} 互动，获得抽卡券`);
            return {
                transactionHash: interactionResult.txHash,
                rewardTickets: interactionResult.rewardTickets || 1,
                totalTickets: interactionResult.totalTickets || 1,
                message: '社交互动成功，获得1张抽卡券'
            };
        }
        catch (error) {
            this.logger.error(`社交互动失败:`, error.message);
            throw new common_1.BadRequestException(`社交互动失败: ${error.message}`);
        }
    }
    async drawCatWithTickets(drawCatWithTicketsDto) {
        const { nfcUid, catName } = drawCatWithTicketsDto;
        if (!this.validateUID(nfcUid)) {
            throw new common_1.BadRequestException('NFC UID格式无效');
        }
        const nfcCard = await this.prisma.nFCCard.findUnique({
            where: { uid: nfcUid },
            include: { user: true }
        });
        if (!nfcCard) {
            throw new common_1.NotFoundException('未找到NFC卡片');
        }
        if (!nfcCard.user.initialFunded) {
            throw new common_1.BadRequestException('用户尚未获得初始资金，无法抽卡');
        }
        try {
            const userPrivateKey = await this.decryptUserPrivateKey(nfcCard.user.privateKeyEnc);
            const mintResult = await this.injectiveService.drawCatNFTWithTickets(nfcCard.user.address, nfcUid, catName, userPrivateKey);
            if (!mintResult.success) {
                throw new Error(`抽卡失败: ${mintResult.error}`);
            }
            const imageUrl = this.generateCatImageUrl(mintResult.color);
            let tokenIdToSave = mintResult.rawTx?.tokenId || `cat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
            let catNFT;
            try {
                catNFT = await this.prisma.catNFT.create({
                    data: {
                        tokenId: tokenIdToSave,
                        userId: nfcCard.user.id,
                        name: catName,
                        rarity: mintResult.rarity,
                        color: mintResult.color,
                        imageUrl: imageUrl,
                        metadata: {
                            rarity: mintResult.rarity,
                            color: mintResult.color,
                            description: `A ${mintResult.color} cat with ${mintResult.rarity} rarity`,
                            drawMethod: 'tickets',
                            drawCount: mintResult.drawCount || 0
                        }
                    }
                });
            }
            catch (e) {
                if (e?.code === 'P2002') {
                    tokenIdToSave = `${tokenIdToSave}_${Date.now()}`;
                    catNFT = await this.prisma.catNFT.create({
                        data: {
                            tokenId: tokenIdToSave,
                            userId: nfcCard.user.id,
                            name: catName,
                            rarity: mintResult.rarity,
                            color: mintResult.color,
                            imageUrl: imageUrl,
                            metadata: {
                                rarity: mintResult.rarity,
                                color: mintResult.color,
                                description: `A ${mintResult.color} cat with ${mintResult.rarity} rarity`,
                                drawMethod: 'tickets',
                                drawCount: mintResult.drawCount || 0
                            }
                        }
                    });
                }
                else {
                    throw e;
                }
            }
            await this.transactionService.createTransaction({
                txHash: mintResult.txHash,
                userId: nfcCard.user.id,
                type: TransactionType.CAT_NFT_MINT,
                amount: '0.1',
                tokenSymbol: 'INJ',
                fromAddress: nfcCard.user.address,
                toAddress: nfcCard.user.address,
                memo: `使用抽卡券抽卡: ${catName}`,
                rawTx: mintResult.rawTx
            });
            this.logger.log(`使用抽卡券抽卡成功: ${catName} -> ${nfcCard.user.address}, Rarity: ${mintResult.rarity}, Color: ${mintResult.color}`);
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
        catch (error) {
            this.logger.error(`使用抽卡券抽卡失败:`, error.message);
            throw new common_1.BadRequestException(`抽卡失败: ${error.message}`);
        }
    }
    async drawCatTraditional(drawCatTraditionalDto) {
        throw new common_1.BadRequestException('传统付费抽卡功能暂时不可用，请使用抽卡券抽卡');
    }
    async getDrawStats(nfcUID) {
        if (!this.validateUID(nfcUID)) {
            throw new common_1.BadRequestException('NFC UID格式无效');
        }
        try {
            const stats = await this.injectiveService.getDrawStats(nfcUID);
            return {
                availableDraws: stats.availableDraws || 0,
                usedDraws: stats.usedDraws || 0,
                totalDraws: stats.totalDraws || 0,
                socialBonus: stats.socialBonus || 0
            };
        }
        catch (error) {
            this.logger.error(`获取抽卡统计失败:`, error.message);
            throw new common_1.BadRequestException(`获取抽卡统计失败: ${error.message}`);
        }
    }
    async getInteractedNFCs(nfcUID) {
        if (!this.validateUID(nfcUID)) {
            throw new common_1.BadRequestException('NFC UID格式无效');
        }
        try {
            const interactedNFCs = await this.injectiveService.getInteractedNFCs(nfcUID);
            return {
                interactedNFCs: interactedNFCs || []
            };
        }
        catch (error) {
            this.logger.error(`获取已互动NFC列表失败:`, error.message);
            throw new common_1.BadRequestException(`获取已互动NFC列表失败: ${error.message}`);
        }
    }
    async getUserCatNFTs(uid) {
        if (!this.validateUID(uid)) {
            throw new common_1.BadRequestException('NFC UID格式无效');
        }
        const nfcCard = await this.prisma.nFCCard.findUnique({
            where: { uid },
            include: {
                user: {
                    include: {
                        catNFTs: {
                            orderBy: { mintedAt: 'desc' }
                        }
                    }
                }
            }
        });
        if (!nfcCard) {
            throw new common_1.NotFoundException('未找到NFC卡片');
        }
        const catNFTs = nfcCard.user.catNFTs.map(cat => ({
            tokenId: cat.tokenId,
            name: cat.name,
            rarity: cat.rarity,
            color: cat.color,
            imageUrl: cat.imageUrl,
            metadata: cat.metadata,
            txHash: cat.metadata?.txHash || cat.tokenId,
            mintedAt: cat.mintedAt
        }));
        return {
            cats: catNFTs,
            total: catNFTs.length,
            page: 1,
            totalPages: 1
        };
    }
    async getSocialStats(uid) {
        if (!this.validateUID(uid)) {
            throw new common_1.BadRequestException('NFC UID格式无效');
        }
        try {
            const drawStats = await this.getDrawStats(uid);
            const interactedResult = await this.getInteractedNFCs(uid);
            return {
                nfcUID: uid,
                drawCount: drawStats.usedDraws,
                interactedCount: interactedResult.interactedNFCs.length,
                interactedNFCs: interactedResult.interactedNFCs,
                socialBonus: drawStats.socialBonus
            };
        }
        catch (error) {
            this.logger.error(`获取社交统计失败:`, error.message);
            throw new common_1.BadRequestException(`获取社交统计失败: ${error.message}`);
        }
    }
    async checkInteraction(nfc1, nfc2) {
        if (!this.validateUID(nfc1) || !this.validateUID(nfc2)) {
            throw new common_1.BadRequestException('NFC UID格式无效');
        }
        try {
            return await this.injectiveService.hasInteracted(nfc1, nfc2);
        }
        catch (error) {
            this.logger.error(`检查NFC互动状态失败:`, error.message);
            return false;
        }
    }
    generateCatImageUrl(color) {
        const colorMapping = {
            '橙色': 'https://bafybeifm2mxuyfdituhty23ejoeojp23mpbyavsufg5hb2vwsxjftfzplu.ipfs.w3s.link/',
            '绿色': 'https://bafybeifgbuvorq2o6uztzg3ekf2m3lezu2fh65aydttuavs2thy63zauja.ipfs.w3s.link/',
            '黑色': 'https://bafybeieljhlspz52bir4cor4p3ww5zlo7ifyzdf2givip635kxgwpgnhmq.ipfs.w3s.link/',
            '紫色': 'https://bafybeibmuw3eypvh4p5k33pquhkxmt7cktuobtjk7cm5fqgz2dl2ewpr24.ipfs.w3s.link/',
            '红色': 'https://bafybeiedm7slz2lszetnakzddshedf3oirgy2iqfvykzpx5qxp3kji4xpi.ipfs.w3s.link/',
            '蓝色': 'https://bafybeibirtf5cu6kacoukvplxneodjrak5dvpbi3pepjatwhjijyl5xca4.ipfs.w3s.link/',
            '彩虹': 'https://bafybeibirtf5cu6kacoukvplxneodjrak5dvpbi3pepjatwhjijyl5xca4.ipfs.w3s.link/'
        };
        return colorMapping[color] || colorMapping['黑色'];
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