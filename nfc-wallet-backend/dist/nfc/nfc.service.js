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
Object.defineProperty(exports, "__esModule", { value: true });
exports.NFCService = void 0;
const common_1 = require("@nestjs/common");
const ethers_1 = require("ethers");
const sdk_ts_1 = require("@injectivelabs/sdk-ts");
const prisma_service_1 = require("../prisma/prisma.service");
const crypto_service_1 = require("../crypto/crypto.service");
let NFCService = class NFCService {
    constructor(prisma, cryptoService) {
        this.prisma = prisma;
        this.cryptoService = cryptoService;
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
                uid: existingWallet.uid,
                domain: existingWallet.domain,
                isNewWallet: false,
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
                    privateKeyEnc: encryptedPrivateKey,
                },
            });
            return {
                address: savedWallet.address,
                ethAddress: savedWallet.ethAddress,
                uid: savedWallet.uid,
                domain: savedWallet.domain,
                isNewWallet: true,
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
            uid: wallet.uid,
            domain: wallet.domain,
            isNewWallet: false,
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
            const wallet = ethers_1.Wallet.createRandom();
            const injectiveAddress = (0, sdk_ts_1.getInjectiveAddress)(wallet.address);
            return {
                address: injectiveAddress,
                privateKey: wallet.privateKey,
                ethAddress: wallet.address,
            };
        }
        catch (error) {
            throw new common_1.BadRequestException('Injective钱包生成失败');
        }
    }
    validateUID(uid) {
        const cleanUID = uid.replace(/:/g, '');
        return /^[a-fA-F0-9]{8,28}$/.test(cleanUID);
    }
    async getWalletStats() {
        const [totalWallets, walletsWithDomain, recentRegistrations] = await Promise.all([
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
                    createdAt: {
                        gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
                    },
                },
            }),
        ]);
        return {
            totalWallets,
            walletsWithDomain,
            recentRegistrations,
        };
    }
};
exports.NFCService = NFCService;
exports.NFCService = NFCService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        crypto_service_1.CryptoService])
], NFCService);
//# sourceMappingURL=nfc.service.js.map