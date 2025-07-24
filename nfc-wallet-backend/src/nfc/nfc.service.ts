import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { Wallet } from 'ethers';
import { getInjectiveAddress } from '@injectivelabs/sdk-ts';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../crypto/crypto.service';
import { ContractService } from '../contract/contract.service';
import { RegisterNFCDto } from './dto/register-nfc.dto';
import { UnbindNFCDto } from './dto/unbind-nfc.dto';
import { WalletResponseDto } from './dto/wallet-response.dto';
import { NFCStatusResponseDto } from './dto/nfc-status-response.dto';
import { CardOwnershipResponseDto, OwnershipRecord } from './dto/card-ownership-response.dto';

@Injectable()
export class NFCService {
    constructor(
        private prisma: PrismaService,
        private cryptoService: CryptoService,
        private contractService: ContractService
    ) { }

    /**
     * 注册NFC卡片并生成或返回已有的以太坊钱包
     */
    async registerNFC(registerNFCDto: RegisterNFCDto): Promise<WalletResponseDto> {
        const { uid } = registerNFCDto;

        // 验证UID格式
        if (!this.validateUID(uid)) {
            throw new BadRequestException('NFC UID格式无效');
        }

        // 查找是否已存在该UID的钱包
        const existingWallet = await this.prisma.nFCWallet.findUnique({
            where: { uid },
        });

        if (existingWallet) {
            // 返回已有钱包信息
            return {
                address: existingWallet.address,
                ethAddress: existingWallet.ethAddress,
                uid: existingWallet.uid,
                domain: existingWallet.domain,
                isNewWallet: false,
                createdAt: existingWallet.createdAt,
            };
        }

        // 生成新的Injective钱包
        const newWallet = await this.generateInjectiveWallet();

        // 加密私钥
        const encryptedPrivateKey = this.cryptoService.encrypt(newWallet.privateKey);

        try {
            // 保存到数据库
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
        } catch (error) {
            if (error.code === 'P2002') {
                throw new ConflictException('该NFC UID已被注册');
            }
            throw new BadRequestException('钱包创建失败');
        }
    }

    /**
     * 根据UID获取钱包信息
     */
    async getWalletByUID(uid: string): Promise<WalletResponseDto | null> {
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

    /**
     * 获取解密的私钥（仅用于内部操作，不对外暴露）
     */
    async getDecryptedPrivateKey(uid: string): Promise<string | null> {
        const wallet = await this.prisma.nFCWallet.findUnique({
            where: { uid },
        });

        if (!wallet) {
            return null;
        }

        try {
            return this.cryptoService.decrypt(wallet.privateKeyEnc);
        } catch (error) {
            throw new BadRequestException('私钥解密失败');
        }
    }

    /**
     * 生成新的Injective钱包
     * Injective支持以太坊私钥，但地址格式为Cosmos格式（inj开头）
     */
    private async generateInjectiveWallet(): Promise<{ address: string; privateKey: string; ethAddress: string }> {
        try {
            // 生成以太坊私钥（Injective兼容）
            const wallet = Wallet.createRandom();
            // 转换为Injective地址格式（inj开头）
            const injectiveAddress = getInjectiveAddress(wallet.address);

            return {
                address: injectiveAddress,        // Injective地址 (inj...)
                privateKey: wallet.privateKey,    // 私钥（通用）
                ethAddress: wallet.address,       // 以太坊格式地址（备用）
            };
        } catch (error) {
            throw new BadRequestException('Injective钱包生成失败');
        }
    }

    /**
     * 验证NFC UID格式
     */
    private validateUID(uid: string): boolean {
        // NFC UID可能有多种格式，这里做基本验证
        // 常见格式: 十六进制字符串，可能包含冒号分隔符
        const cleanUID = uid.replace(/:/g, '');
        return /^[a-fA-F0-9]{8,28}$/.test(cleanUID);
    }

    /**
     * 获取钱包统计信息
     */
    async getWalletStats(): Promise<{
        totalWallets: number;
        walletsWithDomain: number;
        recentRegistrations: number;
    }> {
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
                        gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // 最近24小时
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

    /**
     * 解绑NFC卡片并重置为空白状态
     */
    async unbindNFC(unbindNFCDto: UnbindNFCDto): Promise<{
        success: boolean;
        nfcUnbound: boolean;
        nftBurned: boolean;
        message: string;
    }> {
        const { uid, resetToBlank = true, ownerSignature } = unbindNFCDto;

        // 验证UID格式
        if (!this.validateUID(uid)) {
            throw new BadRequestException('NFC UID格式无效');
        }

        // 检查NFC是否已绑定
        const existingWallet = await this.prisma.nFCWallet.findUnique({
            where: { uid },
        });

        if (!existingWallet) {
            throw new BadRequestException('该NFC卡片未注册或已解绑');
        }

        try {
            // 1. 执行链上解绑流程（包含NFT销毁）
            let chainResult = { nfcUnbound: false, nftBurned: false, success: false };
            try {
                chainResult = await this.contractService.completeNFCUnbindProcess(uid, resetToBlank);
                console.log(`Chain unbind result for ${uid}:`, chainResult);
            } catch (error) {
                console.warn(`Chain unbind failed for ${uid}, proceeding with database only:`, error);
            }

            // 2. 更新数据库状态
            if (resetToBlank) {
                // 保持记录但重置状态，表示卡片变为空白
                await this.prisma.nFCWallet.update({
                    where: { uid },
                    data: {
                        // 保留地址和私钥信息，但可以考虑是否清除
                        // 根据业务需求，可能需要保留这些信息用于恢复
                        // 或者完全清除以确保安全
                        domain: null, // 清除域名
                        updatedAt: new Date(),
                    },
                });
            } else {
                // 完全删除记录
                await this.prisma.nFCWallet.delete({
                    where: { uid },
                });
            }

            const message = resetToBlank
                ? `NFC卡片 ${uid} 已解绑并重置为空白状态，可以重新激活`
                : `NFC卡片 ${uid} 已完全解绑并删除`;

            return {
                success: true,
                nfcUnbound: chainResult.nfcUnbound,
                nftBurned: chainResult.nftBurned,
                message
            };

        } catch (error) {
            console.error(`Error unbinding NFC ${uid}:`, error);
            throw new BadRequestException('NFC解绑失败');
        }
    }

    /**
     * 获取NFC卡片详细状态
     */
    async getNFCStatus(uid: string): Promise<NFCStatusResponseDto> {
        // 验证UID格式
        if (!this.validateUID(uid)) {
            throw new BadRequestException('NFC UID格式无效');
        }

        try {
            // 1. 从数据库获取基础信息
            const dbWallet = await this.prisma.nFCWallet.findUnique({
                where: { uid },
            });

            // 2. 从链上获取状态信息
            let chainStatus = { status: 0, description: 'blank' };
            let nftTokenId = undefined;
            let bindingHistory = 0;

            try {
                chainStatus = await this.contractService.getNFCStatus(uid);

                // 获取NFT信息
                const nftInfo = await this.contractService.getCardNFTInfo(uid);
                if (nftInfo) {
                    nftTokenId = Number(nftInfo.tokenId || 0);
                }

                // 获取历史绑定记录
                const history = await this.contractService.getNFCHistory(uid);
                bindingHistory = history.length;
            } catch (error) {
                console.warn(`Failed to get chain status for ${uid}:`, error);
            }

            // 3. 综合判断状态
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

        } catch (error) {
            console.error(`Error getting NFC status for ${uid}:`, error);

            // 返回默认状态
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

    /**
     * 批量获取NFC状态
     */
    async batchGetNFCStatus(uids: string[]): Promise<NFCStatusResponseDto[]> {
        const results: NFCStatusResponseDto[] = [];

        for (const uid of uids) {
            try {
                const status = await this.getNFCStatus(uid);
                results.push(status);
            } catch (error) {
                // 如果单个UID获取失败，添加错误状态
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

    /**
     * 获取卡片所有权历史
     */
    async getCardOwnershipHistory(uid: string): Promise<CardOwnershipResponseDto | null> {
        // 验证UID格式
        if (!this.validateUID(uid)) {
            throw new BadRequestException('NFC UID格式无效');
        }

        try {
            // 获取NFT基础信息
            const nftInfo = await this.contractService.getCardNFTInfo(uid);
            if (!nftInfo) {
                throw new BadRequestException('该NFC卡片没有对应的NFT');
            }

            // 获取历史所有者信息
            const [
                ownershipHistory,
                ownershipCount,
                currentOwner
            ] = await Promise.all([
                this.contractService.getCardOwnershipHistory(uid),
                this.contractService.getCardOwnershipCount(uid),
                this.contractService.getCardNFTInfo(uid).then(info => info?.boundWallet)
            ]);

            // 处理历史记录，计算拥有时长
            const processedHistory: OwnershipRecord[] = ownershipHistory.map((record: any) => {
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

            // 获取创建和最后转移时间
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

        } catch (error) {
            console.error(`Error getting card ownership history for ${uid}:`, error);
            return null;
        }
    }

    /**
     * 检查地址是否曾经拥有过该卡片
     */
    async checkCardOwnershipHistory(uid: string, ownerAddress: string): Promise<{
        hasOwned: boolean;
        totalDuration: number;
        ownershipPeriods: number;
    }> {
        // 验证UID格式
        if (!this.validateUID(uid)) {
            throw new BadRequestException('NFC UID格式无效');
        }

        try {
            const [hasOwned, totalDuration, ownershipHistory] = await Promise.all([
                this.contractService.hasOwnedCard(uid, ownerAddress),
                this.contractService.getOwnershipDuration(uid, ownerAddress),
                this.contractService.getCardOwnershipHistory(uid)
            ]);

            // 计算该地址的拥有次数
            const ownershipPeriods = ownershipHistory.filter(
                (record: any) => record.owner === ownerAddress
            ).length;

            return {
                hasOwned,
                totalDuration: Number(totalDuration),
                ownershipPeriods
            };

        } catch (error) {
            console.error(`Error checking card ownership history for ${uid}:`, error);
            return {
                hasOwned: false,
                totalDuration: 0,
                ownershipPeriods: 0
            };
        }
    }

    /**
     * 批量获取卡片当前所有者信息
     */
    async batchGetCardOwners(uids: string[]): Promise<{
        nfcUID: string;
        currentOwner: string;
        ownershipCount: number;
    }[]> {
        const results = [];

        try {
            // 批量获取当前所有者
            const owners = await this.contractService.batchGetCardOwners(uids);

            for (let i = 0; i < uids.length; i++) {
                const uid = uids[i];
                const currentOwner = owners[i] || '';

                // 获取所有权数量
                let ownershipCount = 0;
                try {
                    ownershipCount = await this.contractService.getCardOwnershipCount(uid);
                } catch (error) {
                    console.warn(`Failed to get ownership count for ${uid}:`, error);
                }

                results.push({
                    nfcUID: uid,
                    currentOwner,
                    ownershipCount
                });
            }

        } catch (error) {
            console.error('Error batch getting card owners:', error);

            // 返回空结果
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

    /**
     * 异步记录NFC绑定到链上
     */
    private async recordNFCBindingToChain(nfcUID: string, walletAddress: string): Promise<void> {
        try {
            // 1. 记录NFC绑定
            const bindingSuccess = await this.contractService.recordNFCWalletBinding(nfcUID, walletAddress);
            if (bindingSuccess) {
                console.log(`NFC ${nfcUID} binding recorded on chain successfully`);

                // 2. 铸造对应的NFT（使用默认系列）
                try {
                    const tokenId = await this.contractService.mintCardNFT(nfcUID, 'default', walletAddress);
                    if (tokenId) {
                        console.log(`NFT minted for NFC ${nfcUID}, Token ID: ${tokenId}`);
                    }
                } catch (nftError) {
                    console.warn(`Failed to mint NFT for NFC ${nfcUID}:`, nftError);
                }
            } else {
                console.warn(`Failed to record NFC ${nfcUID} binding on chain`);
            }
        } catch (error) {
            console.error(`Error recording NFC ${nfcUID} binding to chain:`, error);
        }
    }
} 