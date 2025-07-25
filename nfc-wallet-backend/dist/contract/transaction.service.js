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
exports.TransactionService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let TransactionService = class TransactionService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createTransaction(data) {
        return this.prisma.transaction.create({
            data: {
                userId: data.userId,
                txHash: data.txHash,
                type: data.type,
                amount: data.amount,
                tokenSymbol: data.tokenSymbol,
                fromAddress: data.fromAddress,
                toAddress: data.toAddress,
                status: data.status || client_1.TxStatus.PENDING,
                blockHeight: data.blockHeight,
                gasUsed: data.gasUsed,
                fee: data.fee,
                memo: data.memo,
                rawTx: data.rawTx
            }
        });
    }
    async updateTransactionStatus(txHash, status, blockHeight, gasUsed, fee) {
        return this.prisma.transaction.update({
            where: { txHash },
            data: {
                status,
                blockHeight,
                gasUsed,
                fee,
                updatedAt: new Date()
            }
        });
    }
    async getUserTransactions(userId, limit = 10) {
        return this.prisma.transaction.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit
        });
    }
    async getTransactionByHash(txHash) {
        return this.prisma.transaction.findUnique({
            where: { txHash },
            include: {
                user: {
                    select: {
                        address: true,
                        ethAddress: true,
                        domain: true
                    }
                }
            }
        });
    }
    async getPendingTransactions() {
        return this.prisma.transaction.findMany({
            where: { status: client_1.TxStatus.PENDING },
            orderBy: { createdAt: 'asc' }
        });
    }
    async getUserTransactionStats(userId) {
        const [totalTxs, successTxs, pendingTxs, failedTxs] = await Promise.all([
            this.prisma.transaction.count({ where: { userId } }),
            this.prisma.transaction.count({ where: { userId, status: client_1.TxStatus.CONFIRMED } }),
            this.prisma.transaction.count({ where: { userId, status: client_1.TxStatus.PENDING } }),
            this.prisma.transaction.count({ where: { userId, status: client_1.TxStatus.FAILED } })
        ]);
        return {
            total: totalTxs,
            confirmed: successTxs,
            pending: pendingTxs,
            failed: failedTxs
        };
    }
};
exports.TransactionService = TransactionService;
exports.TransactionService = TransactionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TransactionService);
//# sourceMappingURL=transaction.service.js.map