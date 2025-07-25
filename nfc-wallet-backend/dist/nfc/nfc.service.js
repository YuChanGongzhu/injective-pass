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
const ethers_1 = require("ethers");
const sdk_ts_1 = require("@injectivelabs/sdk-ts");
const prisma_service_1 = require("../prisma/prisma.service");
const crypto_service_1 = require("../crypto/crypto.service");
const contract_service_1 = require("../contract/contract.service");
const injective_service_1 = require("../contract/injective.service");
let NFCService = NFCService_1 = class NFCService {
    constructor(prisma, cryptoService, contractService, injectiveService) {
        this.prisma = prisma;
        this.cryptoService = cryptoService;
        this.contractService = contractService;
        this.injectiveService = injectiveService;
        this.logger = new common_1.Logger(NFCService_1.name);
    }
    async registerNFC(registerNFCDto) {
        const { uid } = registerNFCDto;
        if (!this.validateUID(uid)) {
            throw new common_1.BadRequestException('NFC UID格式无效');
        }
        const existingWallet = await this.prisma.nFCWallet.findUnique({
            where: { uid },
        });
        if (existingWallet) {
            return {
                address: existingWallet.address,
                ethAddress: existingWallet.ethAddress,
                publicKey: existingWallet.publicKey,
                uid: existingWallet.uid,
                domain: existingWallet.domain,
                nftTokenId: existingWallet.nftTokenId,
                isNewWallet: false,
                isBlankCard: false,
                initialFunded: existingWallet.initialFunded,
                createdAt: existingWallet.createdAt,
            };
        }
        const newWallet = await this.generateInjectiveWallet();
        const encryptedPrivateKey = this.cryptoService.encrypt(newWallet.privateKey);
        try {
            const savedWallet = await this.prisma.nFCWallet.create({
                data: {
                    uid,
                    address: newWallet.address,
                    ethAddress: newWallet.ethAddress,
                    publicKey: newWallet.publicKey,
                    privateKeyEnc: encryptedPrivateKey,
                    initialFunded: false,
                },
            });
            this.logger.log(`新建空白卡钱包: ${newWallet.address} for UID: ${uid}`);
            this.initializeBlankCard(uid).catch(error => {
                this.logger.error(`空白卡初始化失败 for UID ${uid}:`, error);
            });
            return {
                address: savedWallet.address,
                ethAddress: savedWallet.ethAddress,
                publicKey: savedWallet.publicKey,
                uid: savedWallet.uid,
                domain: savedWallet.domain,
                nftTokenId: savedWallet.nftTokenId,
                isNewWallet: true,
                isBlankCard: true,
                initialFunded: false,
                createdAt: savedWallet.createdAt,
            };
        }
        catch (error) {
            if (error.code === 'P2002') {
                throw new common_1.ConflictException('该NFC UID已被注册');
            }
            throw new common_1.BadRequestException('钱包创建失败');
        }
    }
    async initializeBlankCard(uid) {
        try {
            const wallet = await this.prisma.nFCWallet.findUnique({
                where: { uid },
            });
            if (!wallet || wallet.initialFunded) {
                return;
            }
            this.logger.log(`开始初始化空白卡: ${wallet.address}`);
            const fundingResult = await this.injectiveService.sendInitialFunds(wallet.address, '0.1');
            if (!fundingResult.success) {
                this.logger.error(`资金发送失败 for ${wallet.address}:`, fundingResult.error);
                return;
            }
            this.logger.log(`成功发送初始资金到 ${wallet.address}, tx: ${fundingResult.txHash}`);
            let nftTokenId = null;
            try {
                const nftResult = await this.contractService.mintCatNFT(wallet.address, `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)} Cat`, `A unique cat NFT for Injective Pass holder`);
                if (nftResult.success) {
                    nftTokenId = nftResult.tokenId;
                    this.logger.log(`成功铸造NFT for ${wallet.address}, tokenId: ${nftTokenId}`);
                }
                else {
                    this.logger.error(`NFT铸造失败 for ${wallet.address}:`, nftResult.error);
                }
            }
            catch (nftError) {
                this.logger.error(`NFT铸造异常 for ${wallet.address}:`, nftError);
            }
            await this.prisma.nFCWallet.update({
                where: { uid },
                data: {
                    initialFunded: true,
                    nftTokenId: nftTokenId,
                },
            });
            this.logger.log(`空白卡初始化完成: ${wallet.address}`);
        }
        catch (error) {
            this.logger.error(`空白卡初始化异常 for UID ${uid}:`, error);
        }
    }
    async getWalletByUID(uid) {
        const wallet = await this.prisma.nFCWallet.findUnique({
            where: { uid },
        });
        if (!wallet) {
            return null;
        }
        return {
            address: wallet.address,
            ethAddress: wallet.ethAddress,
            publicKey: wallet.publicKey,
            uid: wallet.uid,
            domain: wallet.domain,
            nftTokenId: wallet.nftTokenId,
            isNewWallet: false,
            isBlankCard: !wallet.initialFunded,
            initialFunded: wallet.initialFunded,
            createdAt: wallet.createdAt,
        };
    }
    async getDecryptedPrivateKey(uid) {
        const wallet = await this.prisma.nFCWallet.findUnique({
            where: { uid },
        });
        if (!wallet) {
            return null;
        }
        try {
            return this.cryptoService.decrypt(wallet.privateKeyEnc);
        }
        catch (error) {
            throw new common_1.BadRequestException('私钥解密失败');
        }
    }
    async generateInjectiveWallet() {
        try {
            const ethWallet = ethers_1.Wallet.createRandom();
            const privateKeyObj = sdk_ts_1.PrivateKey.fromPrivateKey(ethWallet.privateKey);
            const publicKeyObj = privateKeyObj.toPublicKey();
            const addressObj = publicKeyObj.toAddress();
            return {
                address: addressObj.toBech32(),
                privateKey: ethWallet.privateKey,
                ethAddress: ethWallet.address,
                publicKey: publicKeyObj.toBase64(),
            };
        }
        catch (error) {
            this.logger.error('Injective钱包生成失败:', error);
            throw new common_1.BadRequestException('Injective钱包生成失败');
        }
    }
    async createDomain(uid, domainName) {
        try {
            if (!this.validateDomainName(domainName)) {
                return {
                    success: false,
                    error: '域名格式无效'
                };
            }
            const existingDomain = await this.prisma.nFCWallet.findUnique({
                where: { domain: `${domainName}.inj` },
            });
            if (existingDomain) {
                return {
                    success: false,
                    error: '域名已被占用'
                };
            }
            const fullDomain = `${domainName}.inj`;
            await this.prisma.nFCWallet.update({
                where: { uid },
                data: { domain: fullDomain },
            });
            this.logger.log(`域名创建成功: ${fullDomain} for UID: ${uid}`);
            return {
                success: true,
                domain: fullDomain
            };
        }
        catch (error) {
            this.logger.error(`域名创建失败 for UID ${uid}:`, error);
            return {
                success: false,
                error: '域名创建失败'
            };
        }
    }
    async checkDomainAvailability(domainName) {
        const fullDomain = `${domainName}.inj`;
        if (!this.validateDomainName(domainName)) {
            return {
                available: false,
                domain: fullDomain
            };
        }
        const existingDomain = await this.prisma.nFCWallet.findUnique({
            where: { domain: fullDomain },
        });
        return {
            available: !existingDomain,
            domain: fullDomain
        };
    }
    validateDomainName(domain) {
        const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{1,61}[a-zA-Z0-9])?$/;
        return domainRegex.test(domain);
    }
    validateUID(uid) {
        const cleanUID = uid.replace(/:/g, '');
        return /^[a-fA-F0-9]{8,28}$/.test(cleanUID);
    }
    async getWalletStats() {
        const [totalWallets, walletsWithDomain, walletsWithNFT, fundedWallets, recentRegistrations] = await Promise.all([
            this.prisma.nFCWallet.count(),
            this.prisma.nFCWallet.count({
                where: {
                    domain: {
                        not: null,
                    },
                },
            }),
            this.prisma.nFCWallet.count({
                where: {
                    nftTokenId: {
                        not: null,
                    },
                },
            }),
            this.prisma.nFCWallet.count({
                where: {
                    initialFunded: true,
                },
            }),
            this.prisma.nFCWallet.count({
                where: {
                    createdAt: {
                        gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
                    },
                },
            }),
        ]);
        return {
            totalWallets,
            walletsWithDomain,
            walletsWithNFT,
            fundedWallets,
            recentRegistrations,
        };
    }
    async getWalletBalance(address) {
        try {
            const balance = await this.injectiveService.getAccountBalance(address);
            return balance;
        }
        catch (error) {
            this.logger.error('Error getting wallet balance:', error);
            throw new common_1.BadRequestException('无法获取钱包余额');
        }
    }
    async unbindNFC(unbindNFCDto) {
        const { uid, resetToBlank = true, ownerSignature } = unbindNFCDto;
        if (!this.validateUID(uid)) {
            throw new common_1.BadRequestException('NFC UID格式无效');
        }
        const wallet = await this.prisma.nFCWallet.findUnique({
            where: { uid },
        });
        if (!wallet) {
            throw new common_1.BadRequestException('NFC卡片未注册');
        }
        try {
            let nftBurned = false;
            if (wallet.nftTokenId) {
                try {
                    const burnResult = await this.contractService.burnNFT(wallet.nftTokenId, wallet.address);
                    nftBurned = burnResult.success;
                    if (burnResult.success) {
                        this.logger.log(`NFT销毁成功: tokenId ${wallet.nftTokenId}`);
                    }
                    else {
                        this.logger.error(`NFT销毁失败: ${burnResult.error}`);
                    }
                }
                catch (error) {
                    this.logger.error('NFT销毁异常:', error);
                }
            }
            await this.prisma.nFCWallet.delete({
                where: { uid },
            });
            this.logger.log(`NFC卡片解绑成功: UID ${uid}, 钱包地址: ${wallet.address}`);
            return {
                success: true,
                nfcUnbound: true,
                nftBurned,
                message: '解绑成功'
            };
        }
        catch (error) {
            this.logger.error(`NFC解绑失败 for UID ${uid}:`, error);
            return {
                success: false,
                nfcUnbound: false,
                nftBurned: false,
                message: '解绑失败: ' + error.message
            };
        }
    }
    async getNFCStatus(uid) {
        if (!this.validateUID(uid)) {
            throw new common_1.BadRequestException('NFC UID格式无效');
        }
        try {
            const dbWallet = await this.prisma.nFCWallet.findUnique({
                where: { uid },
            });
            let chainStatus = { status: 0, description: 'blank' };
            let nftTokenId = undefined;
            let bindingHistory = 0;
            try {
                chainStatus = await this.contractService.getNFCStatus(uid);
                const nftInfo = await this.contractService.getCardNFTInfo(uid);
                if (nftInfo) {
                    nftTokenId = Number(nftInfo.tokenId || 0);
                }
                const history = await this.contractService.getNFCHistory(uid);
                bindingHistory = history.length;
            }
            catch (error) {
                console.warn(`Failed to get chain status for ${uid}:`, error);
            }
            const isBlank = !dbWallet || await this.contractService.isNFCBlank(uid);
            const isBound = !!dbWallet && !isBlank;
            return {
                uid,
                status: chainStatus.status,
                description: chainStatus.description,
                isBlank,
                isBound,
                walletAddress: dbWallet?.address,
                nftTokenId,
                bindingHistory
            };
        }
        catch (error) {
            console.error(`Error getting NFC status for ${uid}:`, error);
            return {
                uid,
                status: 0,
                description: 'blank',
                isBlank: true,
                isBound: false,
                bindingHistory: 0
            };
        }
    }
    async batchGetNFCStatus(uids) {
        const results = [];
        for (const uid of uids) {
            try {
                const status = await this.getNFCStatus(uid);
                results.push(status);
            }
            catch (error) {
                results.push({
                    uid,
                    status: 0,
                    description: 'error',
                    isBlank: true,
                    isBound: false,
                    bindingHistory: 0
                });
            }
        }
        return results;
    }
    async getCardOwnershipHistory(uid) {
        if (!this.validateUID(uid)) {
            throw new common_1.BadRequestException('NFC UID格式无效');
        }
        try {
            const nftInfo = await this.contractService.getCardNFTInfo(uid);
            if (!nftInfo) {
                throw new common_1.BadRequestException('该NFC卡片没有对应的NFT');
            }
            const [ownershipHistory, ownershipCount, currentOwner] = await Promise.all([
                this.contractService.getCardOwnershipHistory(uid),
                this.contractService.getCardOwnershipCount(uid),
                this.contractService.getCardNFTInfo(uid).then(info => info?.boundWallet)
            ]);
            const processedHistory = ownershipHistory.map((record) => {
                const duration = record.toTimestamp === 0
                    ? Math.floor(Date.now() / 1000) - Number(record.fromTimestamp)
                    : Number(record.toTimestamp) - Number(record.fromTimestamp);
                return {
                    owner: record.owner,
                    fromTimestamp: Number(record.fromTimestamp),
                    toTimestamp: Number(record.toTimestamp),
                    transferReason: record.transferReason,
                    duration
                };
            });
            const createdAt = processedHistory.length > 0 ? processedHistory[0].fromTimestamp : 0;
            const lastTransferAt = processedHistory.length > 1
                ? processedHistory[processedHistory.length - 1].fromTimestamp
                : createdAt;
            return {
                nfcUID: uid,
                tokenId: Number(nftInfo.tokenId || 0),
                currentOwner: currentOwner || '',
                ownershipCount,
                ownershipHistory: processedHistory,
                createdAt,
                lastTransferAt
            };
        }
        catch (error) {
            console.error(`Error getting card ownership history for ${uid}:`, error);
            return null;
        }
    }
    async checkCardOwnershipHistory(uid, ownerAddress) {
        if (!this.validateUID(uid)) {
            throw new common_1.BadRequestException('NFC UID格式无效');
        }
        try {
            const [hasOwned, totalDuration, ownershipHistory] = await Promise.all([
                this.contractService.hasOwnedCard(uid, ownerAddress),
                this.contractService.getOwnershipDuration(uid, ownerAddress),
                this.contractService.getCardOwnershipHistory(uid)
            ]);
            const ownershipPeriods = ownershipHistory.filter((record) => record.owner === ownerAddress).length;
            return {
                hasOwned,
                totalDuration: Number(totalDuration),
                ownershipPeriods
            };
        }
        catch (error) {
            console.error(`Error checking card ownership history for ${uid}:`, error);
            return {
                hasOwned: false,
                totalDuration: 0,
                ownershipPeriods: 0
            };
        }
    }
    async batchGetCardOwners(uids) {
        const results = [];
        try {
            const owners = await this.contractService.batchGetCardOwners(uids);
            for (let i = 0; i < uids.length; i++) {
                const uid = uids[i];
                const currentOwner = owners[i] || '';
                let ownershipCount = 0;
                try {
                    ownershipCount = await this.contractService.getCardOwnershipCount(uid);
                }
                catch (error) {
                    console.warn(`Failed to get ownership count for ${uid}:`, error);
                }
                results.push({
                    nfcUID: uid,
                    currentOwner,
                    ownershipCount
                });
            }
        }
        catch (error) {
            console.error('Error batch getting card owners:', error);
            for (const uid of uids) {
                results.push({
                    nfcUID: uid,
                    currentOwner: '',
                    ownershipCount: 0
                });
            }
        }
        return results;
    }
    async recordNFCBindingToChain(nfcUID, walletAddress) {
        try {
            const bindingSuccess = await this.contractService.recordNFCWalletBinding(nfcUID, walletAddress);
            if (bindingSuccess) {
                console.log(`NFC ${nfcUID} binding recorded on chain successfully`);
                try {
                    const tokenId = await this.contractService.mintCardNFT(nfcUID, 'default', walletAddress);
                    if (tokenId) {
                        console.log(`NFT minted for NFC ${nfcUID}, Token ID: ${tokenId}`);
                    }
                }
                catch (nftError) {
                    console.warn(`Failed to mint NFT for NFC ${nfcUID}:`, nftError);
                }
            }
            else {
                console.warn(`Failed to record NFC ${nfcUID} binding on chain`);
            }
        }
        catch (error) {
            console.error(`Error recording NFC ${nfcUID} binding to chain:`, error);
        }
    }
};
exports.NFCService = NFCService;
exports.NFCService = NFCService = NFCService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        crypto_service_1.CryptoService,
        contract_service_1.ContractService,
        injective_service_1.InjectiveService])
], NFCService);
//# sourceMappingURL=nfc.service.js.map