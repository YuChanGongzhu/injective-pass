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
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const crypto_service_1 = require("../crypto/crypto.service");
let UserService = class UserService {
    constructor(prisma, cryptoService) {
        this.prisma = prisma;
        this.cryptoService = cryptoService;
    }
    async updateDomain(updateDomainDto) {
        const { uid, domainPrefix } = updateDomainDto;
        if (!this.validateDomainPrefix(domainPrefix)) {
            throw new common_1.BadRequestException('域名前缀格式无效');
        }
        const fullDomain = `${domainPrefix}.inj`;
        const nfcCard = await this.prisma.nFCCard.findUnique({
            where: { uid },
            include: { user: true }
        });
        if (!nfcCard) {
            throw new common_1.NotFoundException('未找到对应的NFC卡片');
        }
        try {
            const existingDomainUser = await this.prisma.user.findUnique({
                where: { domain: fullDomain }
            });
            if (existingDomainUser && existingDomainUser.id !== nfcCard.user.id) {
                throw new common_1.ConflictException('该.inj域名已被占用');
            }
            const updatedUser = await this.prisma.user.update({
                where: { id: nfcCard.user.id },
                data: { domain: fullDomain },
            });
            return {
                address: updatedUser.address,
                uid: uid,
                domain: updatedUser.domain,
                createdAt: updatedUser.createdAt,
                updatedAt: updatedUser.updatedAt,
            };
        }
        catch (error) {
            if (error.code === 'P2002') {
                throw new common_1.ConflictException('该.inj域名已被占用');
            }
            throw new common_1.BadRequestException('域名更新失败');
        }
    }
    async getUserProfile(uid) {
        const nfcCard = await this.prisma.nFCCard.findUnique({
            where: { uid },
            include: { user: true }
        });
        if (!nfcCard) {
            throw new common_1.NotFoundException('未找到对应的用户');
        }
        return {
            address: nfcCard.user.address,
            uid: uid,
            domain: nfcCard.user.domain,
            createdAt: nfcCard.user.createdAt,
            updatedAt: nfcCard.user.updatedAt,
        };
    }
    async checkDomainAvailability(domainPrefix) {
        if (!this.validateDomainPrefix(domainPrefix)) {
            throw new common_1.BadRequestException('域名前缀格式无效');
        }
        const fullDomain = `${domainPrefix}.inj`;
        const existingUser = await this.prisma.user.findUnique({
            where: { domain: fullDomain },
        });
        return { available: !existingUser };
    }
    async removeDomain(uid) {
        const nfcCard = await this.prisma.nFCCard.findUnique({
            where: { uid },
            include: { user: true }
        });
        if (!nfcCard) {
            throw new common_1.NotFoundException('未找到对应的NFC卡片');
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
    async getUserByDomain(domain) {
        const user = await this.prisma.user.findUnique({
            where: { domain },
            include: { nfcCard: true }
        });
        if (!user) {
            return null;
        }
        const uid = user.nfcCard ? user.nfcCard.uid : '';
        return {
            address: user.address,
            uid: uid,
            domain: user.domain,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }
    async getUserList(page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    nfcCard: {
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
                uid: user.nfcCard ? user.nfcCard.uid : '',
                domain: user.domain,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            })),
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }
    async getUserByAddress(address) {
        const user = await this.prisma.user.findUnique({
            where: { address },
            include: {
                nfcCard: true,
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
            nfcCard: user.nfcCard ? {
                uid: user.nfcCard.uid,
                nickname: user.nfcCard.nickname,
                isActive: user.nfcCard.isActive,
                isBlank: user.nfcCard.isBlank,
                createdAt: user.nfcCard.createdAt
            } : null,
            transactionCount: user.transactions.length,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }
    async getUserNFCCard(address) {
        const user = await this.prisma.user.findUnique({
            where: { address },
            include: {
                nfcCard: true
            }
        });
        if (!user || !user.nfcCard) {
            return null;
        }
        return {
            uid: user.nfcCard.uid,
            nickname: user.nfcCard.nickname,
            isActive: user.nfcCard.isActive,
            isBlank: user.nfcCard.isBlank,
            createdAt: user.nfcCard.createdAt,
            updatedAt: user.nfcCard.updatedAt
        };
    }
    async updateNFCCardNickname(uid, nickname) {
        const nfcCard = await this.prisma.nFCCard.findUnique({
            where: { uid }
        });
        if (!nfcCard) {
            throw new common_1.NotFoundException('NFC卡片不存在');
        }
        await this.prisma.nFCCard.update({
            where: { uid },
            data: { nickname }
        });
        return { success: true, message: 'NFC卡片昵称更新成功' };
    }
    async toggleNFCCardStatus(uid, isActive) {
        const nfcCard = await this.prisma.nFCCard.findUnique({
            where: { uid }
        });
        if (!nfcCard) {
            throw new common_1.NotFoundException('NFC卡片不存在');
        }
        await this.prisma.nFCCard.update({
            where: { uid },
            data: { isActive }
        });
        const status = isActive ? '激活' : '停用';
        return { success: true, message: `NFC卡片${status}成功` };
    }
    async exportPrivateKey(exportPrivateKeyDto) {
        const { uid } = exportPrivateKeyDto;
        const nfcCard = await this.prisma.nFCCard.findUnique({
            where: { uid },
            include: { user: true }
        });
        if (!nfcCard) {
            throw new common_1.NotFoundException('未找到对应的NFC卡片');
        }
        const user = nfcCard.user;
        try {
            const decryptedPrivateKey = this.cryptoService.decrypt(user.privateKeyEnc);
            const formattedPrivateKey = decryptedPrivateKey.startsWith('0x')
                ? decryptedPrivateKey
                : `0x${decryptedPrivateKey}`;
            return {
                address: user.address,
                privateKey: formattedPrivateKey,
                exportedAt: new Date(),
                warning: '警告：私钥是您钱包的完全控制权限。请妥善保管，不要与任何人分享。如果私钥泄露，您的资产可能会丢失。'
            };
        }
        catch (error) {
            console.error('私钥解密失败:', error);
            throw new common_1.BadRequestException('私钥解密失败，可能数据已损坏');
        }
    }
    validateDomainPrefix(domainPrefix) {
        const regex = /^[a-z0-9]+([a-z0-9-]*[a-z0-9])?$/;
        return domainPrefix.length >= 3 &&
            domainPrefix.length <= 30 &&
            regex.test(domainPrefix) &&
            !domainPrefix.includes('--');
    }
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        crypto_service_1.CryptoService])
], UserService);
//# sourceMappingURL=user.service.js.map