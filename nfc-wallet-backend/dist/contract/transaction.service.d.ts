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
        type: import(".prisma/client").$Enums.TransactionType;
        txHash: string;
        amount: string | null;
        rawTx: import("@prisma/client/runtime/library").JsonValue | null;
        tokenSymbol: string | null;
        fromAddress: string | null;
        toAddress: string | null;
        status: import(".prisma/client").$Enums.TxStatus;
        blockHeight: string | null;
        gasUsed: string | null;
        fee: string | null;
        memo: string | null;
        createdAt: Date;
        updatedAt: Date;
        id: number;
        userId: number;
    }>;
    updateTransactionStatus(txHash: string, status: TxStatus, blockHeight?: string, gasUsed?: string, fee?: string): Promise<{
        type: import(".prisma/client").$Enums.TransactionType;
        txHash: string;
        amount: string | null;
        rawTx: import("@prisma/client/runtime/library").JsonValue | null;
        tokenSymbol: string | null;
        fromAddress: string | null;
        toAddress: string | null;
        status: import(".prisma/client").$Enums.TxStatus;
        blockHeight: string | null;
        gasUsed: string | null;
        fee: string | null;
        memo: string | null;
        createdAt: Date;
        updatedAt: Date;
        id: number;
        userId: number;
    }>;
    getUserTransactions(userId: number, limit?: number): Promise<{
        type: import(".prisma/client").$Enums.TransactionType;
        txHash: string;
        amount: string | null;
        rawTx: import("@prisma/client/runtime/library").JsonValue | null;
        tokenSymbol: string | null;
        fromAddress: string | null;
        toAddress: string | null;
        status: import(".prisma/client").$Enums.TxStatus;
        blockHeight: string | null;
        gasUsed: string | null;
        fee: string | null;
        memo: string | null;
        createdAt: Date;
        updatedAt: Date;
        id: number;
        userId: number;
    }[]>;
    getTransactionByHash(txHash: string): Promise<{
        user: {
            address: string;
            ethAddress: string;
            domain: string;
        };
    } & {
        type: import(".prisma/client").$Enums.TransactionType;
        txHash: string;
        amount: string | null;
        rawTx: import("@prisma/client/runtime/library").JsonValue | null;
        tokenSymbol: string | null;
        fromAddress: string | null;
        toAddress: string | null;
        status: import(".prisma/client").$Enums.TxStatus;
        blockHeight: string | null;
        gasUsed: string | null;
        fee: string | null;
        memo: string | null;
        createdAt: Date;
        updatedAt: Date;
        id: number;
        userId: number;
    }>;
    getPendingTransactions(): Promise<{
        type: import(".prisma/client").$Enums.TransactionType;
        txHash: string;
        amount: string | null;
        rawTx: import("@prisma/client/runtime/library").JsonValue | null;
        tokenSymbol: string | null;
        fromAddress: string | null;
        toAddress: string | null;
        status: import(".prisma/client").$Enums.TxStatus;
        blockHeight: string | null;
        gasUsed: string | null;
        fee: string | null;
        memo: string | null;
        createdAt: Date;
        updatedAt: Date;
        id: number;
        userId: number;
    }[]>;
    getUserTransactionStats(userId: number): Promise<{
        total: number;
        confirmed: number;
        pending: number;
        failed: number;
    }>;
}
