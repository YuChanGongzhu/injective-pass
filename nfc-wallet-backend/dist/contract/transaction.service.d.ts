import { PrismaService } from '../prisma/prisma.service';
import { TransactionType, TxStatus } from '@prisma/client';
export interface CreateTransactionData {
    userId: number;
    txHash: string;
    type: TransactionType;
    amount?: string;
    tokenSymbol?: string;
    fromAddress?: string;
    toAddress?: string;
    status?: TxStatus;
    blockHeight?: string;
    gasUsed?: string;
    fee?: string;
    memo?: string;
    rawTx?: any;
}
export declare class TransactionService {
    private prisma;
    constructor(prisma: PrismaService);
    createTransaction(data: CreateTransactionData): Promise<{
        txHash: string;
        amount: string | null;
        id: number;
        userId: number;
        type: import(".prisma/client").$Enums.TransactionType;
        tokenSymbol: string | null;
        fromAddress: string | null;
        toAddress: string | null;
        status: import(".prisma/client").$Enums.TxStatus;
        blockHeight: string | null;
        gasUsed: string | null;
        fee: string | null;
        memo: string | null;
        rawTx: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateTransactionStatus(txHash: string, status: TxStatus, blockHeight?: string, gasUsed?: string, fee?: string): Promise<{
        txHash: string;
        amount: string | null;
        id: number;
        userId: number;
        type: import(".prisma/client").$Enums.TransactionType;
        tokenSymbol: string | null;
        fromAddress: string | null;
        toAddress: string | null;
        status: import(".prisma/client").$Enums.TxStatus;
        blockHeight: string | null;
        gasUsed: string | null;
        fee: string | null;
        memo: string | null;
        rawTx: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getUserTransactions(userId: number, limit?: number): Promise<{
        txHash: string;
        amount: string | null;
        id: number;
        userId: number;
        type: import(".prisma/client").$Enums.TransactionType;
        tokenSymbol: string | null;
        fromAddress: string | null;
        toAddress: string | null;
        status: import(".prisma/client").$Enums.TxStatus;
        blockHeight: string | null;
        gasUsed: string | null;
        fee: string | null;
        memo: string | null;
        rawTx: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    getTransactionByHash(txHash: string): Promise<{
        user: {
            address: string;
            ethAddress: string;
            domain: string;
        };
    } & {
        txHash: string;
        amount: string | null;
        id: number;
        userId: number;
        type: import(".prisma/client").$Enums.TransactionType;
        tokenSymbol: string | null;
        fromAddress: string | null;
        toAddress: string | null;
        status: import(".prisma/client").$Enums.TxStatus;
        blockHeight: string | null;
        gasUsed: string | null;
        fee: string | null;
        memo: string | null;
        rawTx: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getPendingTransactions(): Promise<{
        txHash: string;
        amount: string | null;
        id: number;
        userId: number;
        type: import(".prisma/client").$Enums.TransactionType;
        tokenSymbol: string | null;
        fromAddress: string | null;
        toAddress: string | null;
        status: import(".prisma/client").$Enums.TxStatus;
        blockHeight: string | null;
        gasUsed: string | null;
        fee: string | null;
        memo: string | null;
        rawTx: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    getUserTransactionStats(userId: number): Promise<{
        total: number;
        confirmed: number;
        pending: number;
        failed: number;
    }>;
}
