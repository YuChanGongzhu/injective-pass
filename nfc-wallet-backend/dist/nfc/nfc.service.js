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
    TransactionType["NFT_MINT"] = "NFT_MINT";
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
            return this.buildWalletResponse(existingCard.user, [existingCard], false);
        }
        let user;
        if (userAddress) {
            user = await this.prisma.user.findUnique({
                where: { address: userAddress },
                include: { nfcCards: true, transactions: { take: 5, orderBy: { createdAt: 'desc' } } }
            });
            if (!user) {
                throw new common_1.NotFoundException('指定的用户地址不存在');
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
                include: { nfcCards: true, transactions: { take: 5, orderBy: { createdAt: 'desc' } } }
            });
            this.logger.log(`新建用户钱包: ${user.address} for UID: ${uid}`);
            this.initializeNewUser(user.id, user.address).catch(error => {
                this.logger.error(`初始化用户失败 ${user.address}:`, error.message);
            });
        }
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
    async getWalletByUID(uid) {
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
    async bindNFCCard(bindNFCDto) {
        const { uid, userAddress, nickname } = bindNFCDto;
        if (!this.validateUID(uid)) {
            throw new common_1.BadRequestException('NFC UID格式无效');
        }
        const user = await this.prisma.user.findUnique({
            where: { address: userAddress }
        });
        if (!user) {
            throw new common_1.NotFoundException('用户不存在');
        }
        const existingCard = await this.prisma.nFCCard.findUnique({
            where: { uid }
        });
        if (existingCard) {
            throw new common_1.ConflictException('该NFC卡片已被绑定');
        }
        await this.prisma.nFCCard.create({
            data: {
                uid,
                userId: user.id,
                nickname: nickname || null,
            }
        });
        return { success: true, message: 'NFC卡片绑定成功' };
    }
    async checkDomainAvailability(domain) {
        if (!this.validateDomain(domain)) {
            throw new common_1.BadRequestException('域名格式无效');
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
    async createDomain(uid, domainName) {
        try {
            if (!this.validateUID(uid)) {
                throw new common_1.BadRequestException('NFC UID格式无效');
            }
            if (!this.validateDomain(domainName)) {
                return { success: false, error: '域名格式无效' };
            }
            const fullDomain = `${domainName}.inj`;
            const existingDomain = await this.prisma.user.findUnique({
                where: { domain: fullDomain }
            });
            if (existingDomain) {
                return { success: false, error: '域名已被占用' };
            }
            const nfcCard = await this.prisma.nFCCard.findUnique({
                where: { uid },
                include: { user: true }
            });
            if (!nfcCard) {
                return { success: false, error: '未找到对应的NFC卡片' };
            }
            if (nfcCard.user.domain) {
                return { success: false, error: '用户已拥有域名' };
            }
            await this.prisma.user.update({
                where: { id: nfcCard.user.id },
                data: { domain: fullDomain }
            });
            this.logger.log(`域名创建成功: ${fullDomain} for UID: ${uid}`);
            return { success: true, domain: fullDomain };
        }
        catch (error) {
            this.logger.error(`域名创建失败:`, error.message);
            return { success: false, error: error.message };
        }
    }
    async getWalletBalance(address) {
        try {
            const balance = await this.injectiveService.getAccountBalance(address);
            return { inj: balance.inj || '0.000000' };
        }
        catch (error) {
            this.logger.error('获取余额失败:', error.message);
            return { inj: '0.000000' };
        }
    }
    async getWalletStats() {
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
                        gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
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
    async unbindNFC(uid) {
        if (!this.validateUID(uid)) {
            throw new common_1.BadRequestException('NFC UID格式无效');
        }
        const nfcCard = await this.prisma.nFCCard.findUnique({
            where: { uid },
            include: { user: { include: { nfcCards: true } } }
        });
        if (!nfcCard) {
            throw new common_1.NotFoundException('未找到对应的NFC卡片');
        }
        if (nfcCard.user.nfcCards.length === 1) {
            throw new common_1.BadRequestException('不能删除用户的最后一张NFC卡片');
        }
        await this.prisma.nFCCard.delete({
            where: { uid }
        });
        return { success: true, message: 'NFC卡片解绑成功' };
    }
    async initializeNewUser(userId, address) {
        try {
            this.logger.log(`开始初始化新用户: ${address}`);
            const fundingResult = await this.injectiveService.sendInitialFunds(address, '0.1');
            if (fundingResult.success && fundingResult.txHash) {
                await this.transactionService.createTransaction({
                    userId,
                    txHash: fundingResult.txHash,
                    type: TransactionType.INITIAL_FUND,
                    amount: '0.1',
                    tokenSymbol: 'INJ',
                    fromAddress: null,
                    toAddress: address,
                    status: TxStatus.PENDING,
                    memo: 'Initial funding for new user'
                });
                await this.prisma.user.update({
                    where: { id: userId },
                    data: { initialFunded: true }
                });
                this.logger.log(`初始资金发送成功: ${address}, tx: ${fundingResult.txHash}`);
            }
            else {
                this.logger.error(`资金发送失败 for ${address}: ${fundingResult.error}`);
            }
        }
        catch (error) {
            this.logger.error(`初始化用户失败 ${address}:`, error.message);
        }
    }
    buildWalletResponse(user, nfcCards, isNewWallet) {
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
    validateDomain(domain) {
        const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{1,61}[a-zA-Z0-9])?$/;
        return domainRegex.test(domain);
    }
    validateUID(uid) {
        const cleanUID = uid.replace(/:/g, '');
        return /^[a-fA-F0-9]{8,28}$/.test(cleanUID);
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