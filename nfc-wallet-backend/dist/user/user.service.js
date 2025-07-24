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
let UserService = class UserService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async updateDomain(updateDomainDto) {
        const { uid, domainPrefix } = updateDomainDto;
        if (!this.validateDomainPrefix(domainPrefix)) {
            throw new common_1.BadRequestException('域名前缀格式无效');
        }
        const fullDomain = `${domainPrefix}.inj`;
        const existingWallet = await this.prisma.nFCWallet.findUnique({
            where: { uid },
        });
        if (!existingWallet) {
            throw new common_1.NotFoundException('未找到对应的钱包');
        }
        try {
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
        }
        catch (error) {
            if (error.code === 'P2002') {
                throw new common_1.ConflictException('该.inj域名已被占用');
            }
            throw new common_1.BadRequestException('域名更新失败');
        }
    }
    async getUserProfile(uid) {
        const wallet = await this.prisma.nFCWallet.findUnique({
            where: { uid },
        });
        if (!wallet) {
            throw new common_1.NotFoundException('未找到对应的用户');
        }
        return {
            address: wallet.address,
            uid: wallet.uid,
            domain: wallet.domain,
            createdAt: wallet.createdAt,
            updatedAt: wallet.updatedAt,
        };
    }
    async checkDomainAvailability(domainPrefix) {
        if (!this.validateDomainPrefix(domainPrefix)) {
            throw new common_1.BadRequestException('域名前缀格式无效');
        }
        const fullDomain = `${domainPrefix}.inj`;
        const existingUser = await this.prisma.nFCWallet.findUnique({
            where: { domain: fullDomain },
        });
        return { available: !existingUser };
    }
    async removeDomain(uid) {
        const existingWallet = await this.prisma.nFCWallet.findUnique({
            where: { uid },
        });
        if (!existingWallet) {
            throw new common_1.NotFoundException('未找到对应的钱包');
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
    async getUserByDomain(domain) {
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
    async getUserList(page = 1, limit = 20) {
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
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UserService);
//# sourceMappingURL=user.service.js.map