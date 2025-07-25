import { Injectable, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { Wallet } from 'ethers';
import { PrivateKey } from '@injectivelabs/sdk-ts';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../crypto/crypto.service';
import { ContractService } from '../contract/contract.service';
import { InjectiveService } from '../contract/injective.service';
import { RegisterNFCDto } from './dto/register-nfc.dto';
import { UnbindNFCDto } from './dto/unbind-nfc.dto';
import { WalletResponseDto } from './dto/wallet-response.dto';
import { NFCStatusResponseDto } from './dto/nfc-status-response.dto';
import { CardOwnershipResponseDto, OwnershipRecord } from './dto/card-ownership-response.dto';

@Injectable()
export class NFCService {
    private readonly logger = new Logger(NFCService.name);

    constructor(
        private prisma: PrismaService,
        private cryptoService: CryptoService,
        private contractService: ContractService,
        private injectiveService: InjectiveService
    ) { }

    /**
     * 注册NFC卡片并生成或返回已有的以太坊钱包
     * 增强版：支持空白卡检测、自动资金发送、NFT铸造
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
                    publicKey: newWallet.publicKey,
                    privateKeyEnc: encryptedPrivateKey,
                    initialFunded: false,
                },
            });

            this.logger.log(`新建空白卡钱包: ${newWallet.address} for UID: ${uid}`);

            // 异步处理初始化流程：发送资金 + 铸造NFT
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
        } catch (error) {
            if (error.code === 'P2002') {
                throw new ConflictException('该NFC UID已被注册');
            }
            throw new BadRequestException('钱包创建失败');
        }
    }

    /**
     * 初始化空白卡：发送初始资金 + 铸造小猫NFT
     */
    private async initializeBlankCard(uid: string): Promise<void> {
        try {
            const wallet = await this.prisma.nFCWallet.findUnique({
                where: { uid },
            });

            if (!wallet || wallet.initialFunded) {
                return; // 已经初始化过了
            }

            this.logger.log(`开始初始化空白卡: ${wallet.address}`);

            // 1. 发送初始资金 (0.1 INJ)
            const fundingResult = await this.injectiveService.sendInitialFunds(wallet.address, '0.1');

            if (!fundingResult.success) {
                this.logger.error(`资金发送失败 for ${wallet.address}:`, fundingResult.error);
                return;
            }

            this.logger.log(`成功发送初始资金到 ${wallet.address}, tx: ${fundingResult.txHash}`);

            // 2. 铸造小猫NFT
            let nftTokenId = null;
            try {
                const nftResult = await this.contractService.mintCatNFT(
                    wallet.address,
                    `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)} Cat`,
                    `A unique cat NFT for Injective Pass holder`
                );

                if (nftResult.success) {
                    nftTokenId = nftResult.tokenId;
                    this.logger.log(`成功铸造NFT for ${wallet.address}, tokenId: ${nftTokenId}`);
                } else {
                    this.logger.error(`NFT铸造失败 for ${wallet.address}:`, nftResult.error);
                }
            } catch (nftError) {
                this.logger.error(`NFT铸造异常 for ${wallet.address}:`, nftError);
            }

            // 3. 更新数据库状态
            await this.prisma.nFCWallet.update({
                where: { uid },
                data: {
                    initialFunded: true,
                    nftTokenId: nftTokenId,
                },
            });

            this.logger.log(`空白卡初始化完成: ${wallet.address}`);
        } catch (error) {
            this.logger.error(`空白卡初始化异常 for UID ${uid}:`, error);
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
            publicKey: wallet.publicKey,
            uid: wallet.uid,
            domain: wallet.domain,
            nftTokenId: wallet.nftTokenId,
            isNewWallet: false,
            isBlankCard: !wallet.initialFunded, // 如果还没有初始资金，认为是空白卡
            initialFunded: wallet.initialFunded,
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
     * 增强版：使用@injectivelabs/sdk-ts正确生成地址和公钥
     */
    private async generateInjectiveWallet(): Promise<{
        address: string;
        privateKey: string;
        ethAddress: string;
        publicKey: string;
    }> {
        try {
            // 生成以太坊私钥（Injective兼容）
            const ethWallet = Wallet.createRandom();

            // 使用Injective SDK处理地址转换和公钥生成
            const privateKeyObj = PrivateKey.fromPrivateKey(ethWallet.privateKey);
            const publicKeyObj = privateKeyObj.toPublicKey();
            const addressObj = publicKeyObj.toAddress();

            return {
                address: addressObj.toBech32(),      // Injective地址 (inj...)
                privateKey: ethWallet.privateKey,    // 私钥（通用）
                ethAddress: ethWallet.address,       // 以太坊格式地址（备用）
                publicKey: publicKeyObj.toBase64(),  // 公钥 (base64格式)
            };
        } catch (error) {
            this.logger.error('Injective钱包生成失败:', error);
            throw new BadRequestException('Injective钱包生成失败');
        }
    }

    /**
     * 创建.inj域名
     */
    async createDomain(uid: string, domainName: string): Promise<{
        success: boolean;
        domain?: string;
        error?: string;
    }> {
        try {
            // 验证域名格式
            if (!this.validateDomainName(domainName)) {
                return {
                    success: false,
                    error: '域名格式无效'
                };
            }

            // 检查域名是否已被占用
            const existingDomain = await this.prisma.nFCWallet.findUnique({
                where: { domain: `${domainName}.inj` },
            });

            if (existingDomain) {
                return {
                    success: false,
                    error: '域名已被占用'
                };
            }

            // 更新数据库
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
        } catch (error) {
            this.logger.error(`域名创建失败 for UID ${uid}:`, error);
            return {
                success: false,
                error: '域名创建失败'
            };
        }
    }

    /**
     * 检查域名可用性
     */
    async checkDomainAvailability(domainName: string): Promise<{
        available: boolean;
        domain: string;
    }> {
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

    /**
     * 验证域名格式
     */
    private validateDomainName(domain: string): boolean {
        // 域名规则：3-63个字符，只能包含字母、数字和连字符，不能以连字符开头或结尾
        const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{1,61}[a-zA-Z0-9])?$/;
        return domainRegex.test(domain);
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
        walletsWithNFT: number;
        fundedWallets: number;
        recentRegistrations: number;
    }> {
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
                        gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // 最近24小时
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

    /**
     * 查询钱包余额
     */
    async getWalletBalance(address: string): Promise<{
        inj: string;
        usd?: string;
    }> {
        try {
            const balance = await this.injectiveService.getAccountBalance(address);
            return balance;
        } catch (error) {
            this.logger.error('Error getting wallet balance:', error);
            throw new BadRequestException('无法获取钱包余额');
        }
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

        // 查找NFC钱包
        const wallet = await this.prisma.nFCWallet.findUnique({
            where: { uid },
        });

        if (!wallet) {
            throw new BadRequestException('NFC卡片未注册');
        }

        try {
            let nftBurned = false;

            // 如果有NFT，尝试销毁
            if (wallet.nftTokenId) {
                try {
                    const burnResult = await this.contractService.burnNFT(
                        wallet.nftTokenId,
                        wallet.address
                    );
                    nftBurned = burnResult.success;

                    if (burnResult.success) {
                        this.logger.log(`NFT销毁成功: tokenId ${wallet.nftTokenId}`);
                    } else {
                        this.logger.error(`NFT销毁失败: ${burnResult.error}`);
                    }
                } catch (error) {
                    this.logger.error('NFT销毁异常:', error);
                }
            }

            // 删除钱包记录
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

        } catch (error) {
            this.logger.error(`NFC解绑失败 for UID ${uid}:`, error);
            return {
                success: false,
                nfcUnbound: false,
                nftBurned: false,
                message: '解绑失败: ' + error.message
            };
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