import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';

// 合约ABI - 实际部署时需要从编译产物中获取完整ABI
const DOMAIN_REGISTRY_ABI = [
    'function register(string memory domainPrefix) external payable',
    'function isDomainAvailable(string memory domainPrefix) external view returns (bool)',
    'function resolveDomain(string memory domain) external view returns (address)',
    'function reverseResolve(address addr) external view returns (string memory)',
    'function transferDomain(string memory domain, address to) external',
    'function setPrimaryDomain(string memory domain) external',
    'function getUserDomains(address user) external view returns (string[] memory)',
    'event DomainRegistered(string indexed domain, address indexed owner, uint256 registeredAt, uint256 expiresAt)'
];

const NFC_REGISTRY_ABI = [
    'function bindNFCWallet(string memory nfcUID, address walletAddress) external',
    'function unbindNFCWallet(string memory nfcUID, bool resetToBlank) external',
    'function isNFCBound(string memory nfcUID) external view returns (bool)',
    'function isNFCBlank(string memory nfcUID) external view returns (bool)',
    'function getNFCStatus(string memory nfcUID) external view returns (uint8)',
    'function getNFCWallet(string memory nfcUID) external view returns (address)',
    'function getWalletNFCs(address walletAddress) external view returns (string[] memory)',
    'function getNFCHistory(string memory nfcUID) external view returns (tuple(address,uint256,uint256,bool,bool,string)[] memory)',
    'event NFCWalletBound(string indexed nfcUID, address indexed walletAddress, uint256 boundAt)',
    'event NFCWalletUnbound(string indexed nfcUID, address indexed walletAddress, uint256 unboundAt, bool cardReset)',
    'event NFCCardReset(string indexed nfcUID, address indexed previousWallet, uint256 resetAt)'
];

const NFC_CARD_NFT_ABI = [
    'function mintCardNFT(string memory nfcUID, string memory seriesId, address initialOwner) external returns (uint256)',
    'function unbindAndBurnCard(string memory nfcUID, bytes memory ownerSignature) external',
    'function getTokenIdByNFC(string memory nfcUID) external view returns (uint256)',
    'function getCardInfo(uint256 tokenId) external view returns (tuple(string,string,string,uint256,uint256,uint256,uint256,uint256,bool,address,string))',
    'function isCardBattleReady(uint256 tokenId) external view returns (bool)',
    'function getCardOwnershipHistory(uint256 tokenId) external view returns (tuple(address,uint256,uint256,string)[] memory)',
    'function getCardOwnershipCount(uint256 tokenId) external view returns (uint256)',
    'function getCurrentOwnershipInfo(uint256 tokenId) external view returns (tuple(address,uint256,uint256,string))',
    'function hasOwnedCard(uint256 tokenId, address owner) external view returns (bool)',
    'function getOwnershipDuration(uint256 tokenId, address owner) external view returns (uint256)',
    'function batchGetCurrentOwners(uint256[] memory tokenIds) external view returns (address[] memory)',
    'event CardMinted(uint256 indexed tokenId, string indexed nfcUID, address indexed owner, string seriesId)',
    'event CardUnbound(uint256 indexed tokenId, string indexed nfcUID, address indexed wallet, bool burned)',
    'event OwnershipTransferred(uint256 indexed tokenId, address indexed previousOwner, address indexed newOwner, string reason)'
];

@Injectable()
export class ContractService {
    private provider: ethers.Provider;
    private wallet: ethers.Wallet;
    private domainRegistryContract: ethers.Contract;
    private nfcRegistryContract: ethers.Contract;
    private nfcCardNFTContract: ethers.Contract;

    constructor(private configService: ConfigService) {
        this.initializeContracts();
    }

    private async initializeContracts() {
        // 初始化Injective网络连接
        const rpcUrl = this.configService.get<string>('INJECTIVE_RPC_URL') ||
            'https://testnet.sentry.tm.injective.network:443';

        this.provider = new ethers.JsonRpcProvider(rpcUrl);

        // 初始化钱包 (用于发送交易)
        const privateKey = this.configService.get<string>('CONTRACT_PRIVATE_KEY');
        if (privateKey) {
            this.wallet = new ethers.Wallet(privateKey, this.provider);
        }

        // 初始化合约实例
        const domainRegistryAddress = this.configService.get<string>('DOMAIN_REGISTRY_ADDRESS');
        const nfcRegistryAddress = this.configService.get<string>('NFC_REGISTRY_ADDRESS');
        const nfcCardNFTAddress = this.configService.get<string>('NFC_CARD_NFT_ADDRESS');

        if (domainRegistryAddress) {
            this.domainRegistryContract = new ethers.Contract(
                domainRegistryAddress,
                DOMAIN_REGISTRY_ABI,
                this.wallet || this.provider
            );
        }

        if (nfcRegistryAddress) {
            this.nfcRegistryContract = new ethers.Contract(
                nfcRegistryAddress,
                NFC_REGISTRY_ABI,
                this.wallet || this.provider
            );
        }

        if (nfcCardNFTAddress) {
            this.nfcCardNFTContract = new ethers.Contract(
                nfcCardNFTAddress,
                NFC_CARD_NFT_ABI,
                this.wallet || this.provider
            );
        }
    }

    // =================
    // 域名管理功能
    // =================

    /**
     * 检查域名是否可用
     */
    async isDomainAvailable(domainPrefix: string): Promise<boolean> {
        try {
            if (!this.domainRegistryContract) {
                throw new Error('Domain registry contract not initialized');
            }
            return await this.domainRegistryContract.isDomainAvailable(domainPrefix);
        } catch (error) {
            console.error('Error checking domain availability:', error);
            return false;
        }
    }

    /**
     * 注册域名到链上
     */
    async registerDomain(domainPrefix: string, userAddress: string): Promise<string | null> {
        try {
            if (!this.domainRegistryContract || !this.wallet) {
                throw new Error('Contract or wallet not initialized');
            }

            // 检查域名是否可用
            const isAvailable = await this.isDomainAvailable(domainPrefix);
            if (!isAvailable) {
                throw new Error('Domain not available');
            }

            // 获取注册费用
            const registrationFee = ethers.parseEther('0.001'); // 0.001 INJ

            // 发送注册交易
            const tx = await this.domainRegistryContract.register(domainPrefix, {
                value: registrationFee,
                gasLimit: 300000
            });

            // 等待交易确认
            const receipt = await tx.wait();

            if (receipt.status === 1) {
                const fullDomain = `${domainPrefix}.inj`;
                console.log(`Domain ${fullDomain} registered successfully`);
                return fullDomain;
            } else {
                throw new Error('Transaction failed');
            }
        } catch (error) {
            console.error('Error registering domain:', error);
            return null;
        }
    }

    /**
     * 解析域名到地址
     */
    async resolveDomain(domain: string): Promise<string | null> {
        try {
            if (!this.domainRegistryContract) {
                return null;
            }

            const address = await this.domainRegistryContract.resolveDomain(domain);
            return address === ethers.ZeroAddress ? null : address;
        } catch (error) {
            console.error('Error resolving domain:', error);
            return null;
        }
    }

    /**
     * 反向解析地址到域名
     */
    async reverseResolve(address: string): Promise<string | null> {
        try {
            if (!this.domainRegistryContract) {
                return null;
            }

            const domain = await this.domainRegistryContract.reverseResolve(address);
            return domain || null;
        } catch (error) {
            console.error('Error reverse resolving:', error);
            return null;
        }
    }

    /**
     * 获取用户的所有域名
     */
    async getUserDomains(userAddress: string): Promise<string[]> {
        try {
            if (!this.domainRegistryContract) {
                return [];
            }

            return await this.domainRegistryContract.getUserDomains(userAddress);
        } catch (error) {
            console.error('Error getting user domains:', error);
            return [];
        }
    }

    // =================
    // NFC注册功能
    // =================

    /**
     * 记录NFC钱包绑定到链上
     */
    async recordNFCWalletBinding(nfcUID: string, walletAddress: string): Promise<boolean> {
        try {
            if (!this.nfcRegistryContract || !this.wallet) {
                throw new Error('Contract or wallet not initialized');
            }

            // 检查NFC是否已绑定
            const isAlreadyBound = await this.isNFCBound(nfcUID);
            if (isAlreadyBound) {
                console.log(`NFC ${nfcUID} already bound`);
                return true; // 已绑定，视为成功
            }

            // 发送绑定交易
            const tx = await this.nfcRegistryContract.bindNFCWallet(nfcUID, walletAddress, {
                gasLimit: 200000
            });

            // 等待交易确认
            const receipt = await tx.wait();

            if (receipt.status === 1) {
                console.log(`NFC ${nfcUID} bound to wallet ${walletAddress}`);
                return true;
            } else {
                throw new Error('Transaction failed');
            }
        } catch (error) {
            console.error('Error recording NFC wallet binding:', error);
            return false;
        }
    }

    /**
     * 检查NFC是否已绑定
     */
    async isNFCBound(nfcUID: string): Promise<boolean> {
        try {
            if (!this.nfcRegistryContract) {
                return false;
            }

            return await this.nfcRegistryContract.isNFCBound(nfcUID);
        } catch (error) {
            console.error('Error checking NFC binding:', error);
            return false;
        }
    }

    /**
     * 获取NFC绑定的钱包地址
     */
    async getNFCWallet(nfcUID: string): Promise<string | null> {
        try {
            if (!this.nfcRegistryContract) {
                return null;
            }

            const address = await this.nfcRegistryContract.getNFCWallet(nfcUID);
            return address === ethers.ZeroAddress ? null : address;
        } catch (error) {
            console.error('Error getting NFC wallet:', error);
            return null;
        }
    }

    /**
     * 获取钱包绑定的所有NFC
     */
    async getWalletNFCs(walletAddress: string): Promise<string[]> {
        try {
            if (!this.nfcRegistryContract) {
                return [];
            }

            return await this.nfcRegistryContract.getWalletNFCs(walletAddress);
        } catch (error) {
            console.error('Error getting wallet NFCs:', error);
            return [];
        }
    }

    /**
     * 解绑NFC卡片并重置为空白状态
     */
    async unbindNFCWallet(nfcUID: string, resetToBlank: boolean = true): Promise<boolean> {
        try {
            if (!this.nfcRegistryContract || !this.wallet) {
                throw new Error('Contract or wallet not initialized');
            }

            // 检查NFC是否已绑定
            const isBound = await this.isNFCBound(nfcUID);
            if (!isBound) {
                console.log(`NFC ${nfcUID} is not bound`);
                return false;
            }

            // 发送解绑交易
            const tx = await this.nfcRegistryContract.unbindNFCWallet(nfcUID, resetToBlank, {
                gasLimit: 250000
            });

            // 等待交易确认
            const receipt = await tx.wait();
            
            if (receipt.status === 1) {
                console.log(`NFC ${nfcUID} unbound successfully, reset to blank: ${resetToBlank}`);
                return true;
            } else {
                throw new Error('Transaction failed');
            }
        } catch (error) {
            console.error('Error unbinding NFC wallet:', error);
            return false;
        }
    }

    /**
     * 检查NFC是否为空白卡片
     */
    async isNFCBlank(nfcUID: string): Promise<boolean> {
        try {
            if (!this.nfcRegistryContract) {
                return true; // 如果合约不可用，认为是空白的
            }

            return await this.nfcRegistryContract.isNFCBlank(nfcUID);
        } catch (error) {
            console.error('Error checking NFC blank status:', error);
            return true;
        }
    }

    /**
     * 获取NFC卡片状态
     */
    async getNFCStatus(nfcUID: string): Promise<{
        status: number;
        description: string;
    }> {
        try {
            if (!this.nfcRegistryContract) {
                return { status: 0, description: 'blank' };
            }

            const status = await this.nfcRegistryContract.getNFCStatus(nfcUID);
            const descriptions = ['blank', 'bound', 'frozen'];
            
            return {
                status: Number(status),
                description: descriptions[Number(status)] || 'unknown'
            };
        } catch (error) {
            console.error('Error getting NFC status:', error);
            return { status: 0, description: 'blank' };
        }
    }

    /**
     * 获取NFC历史绑定记录
     */
    async getNFCHistory(nfcUID: string): Promise<any[]> {
        try {
            if (!this.nfcRegistryContract) {
                return [];
            }

            return await this.nfcRegistryContract.getNFCHistory(nfcUID);
        } catch (error) {
            console.error('Error getting NFC history:', error);
            return [];
        }
    }

    // =================
    // NFT卡片管理功能
    // =================

    /**
     * 为NFC卡片铸造NFT
     */
    async mintCardNFT(nfcUID: string, seriesId: string, ownerAddress: string): Promise<number | null> {
        try {
            if (!this.nfcCardNFTContract || !this.wallet) {
                throw new Error('NFT contract or wallet not initialized');
            }

            // 检查NFC是否已绑定
            const isBound = await this.isNFCBound(nfcUID);
            if (!isBound) {
                throw new Error('NFC not bound to wallet');
            }

            // 发送铸造交易
            const tx = await this.nfcCardNFTContract.mintCardNFT(nfcUID, seriesId, ownerAddress, {
                gasLimit: 300000
            });

            // 等待交易确认
            const receipt = await tx.wait();
            
            if (receipt.status === 1) {
                // 从事件中获取Token ID
                const mintEvent = receipt.logs.find((log: any) => 
                    log.topics[0] === ethers.id('CardMinted(uint256,string,address,string)')
                );
                
                if (mintEvent) {
                    const tokenId = Number(mintEvent.topics[1]);
                    console.log(`NFT minted for NFC ${nfcUID}, Token ID: ${tokenId}`);
                    return tokenId;
                }
            }
            
            throw new Error('Transaction failed or event not found');
        } catch (error) {
            console.error('Error minting card NFT:', error);
            return null;
        }
    }

    /**
     * 解绑并销毁NFC卡片NFT
     */
    async unbindAndBurnCardNFT(nfcUID: string, ownerSignature: string = '0x'): Promise<boolean> {
        try {
            if (!this.nfcCardNFTContract || !this.wallet) {
                throw new Error('NFT contract or wallet not initialized');
            }

            // 检查NFT是否存在
            const tokenId = await this.nfcCardNFTContract.getTokenIdByNFC(nfcUID);
            if (tokenId === 0) {
                console.log(`No NFT found for NFC ${nfcUID}`);
                return true; // 没有NFT也算成功
            }

            // 发送解绑并销毁交易
            const tx = await this.nfcCardNFTContract.unbindAndBurnCard(nfcUID, ownerSignature, {
                gasLimit: 200000
            });

            // 等待交易确认
            const receipt = await tx.wait();
            
            if (receipt.status === 1) {
                console.log(`NFT for NFC ${nfcUID} unbound and burned successfully`);
                return true;
            } else {
                throw new Error('Transaction failed');
            }
        } catch (error) {
            console.error('Error unbinding and burning card NFT:', error);
            return false;
        }
    }

    /**
     * 获取NFC对应的NFT信息
     */
    async getCardNFTInfo(nfcUID: string): Promise<any | null> {
        try {
            if (!this.nfcCardNFTContract) {
                return null;
            }

            const tokenId = await this.nfcCardNFTContract.getTokenIdByNFC(nfcUID);
            if (tokenId === 0) {
                return null;
            }

            return await this.nfcCardNFTContract.getCardInfo(tokenId);
        } catch (error) {
            console.error('Error getting card NFT info:', error);
            return null;
        }
    }

    /**
     * 获取卡片历史所有者
     */
    async getCardOwnershipHistory(nfcUID: string): Promise<any[]> {
        try {
            if (!this.nfcCardNFTContract) {
                return [];
            }

            const tokenId = await this.nfcCardNFTContract.getTokenIdByNFC(nfcUID);
            if (tokenId === 0) {
                return [];
            }

            return await this.nfcCardNFTContract.getCardOwnershipHistory(tokenId);
        } catch (error) {
            console.error('Error getting card ownership history:', error);
            return [];
        }
    }

    /**
     * 获取卡片历史所有者数量
     */
    async getCardOwnershipCount(nfcUID: string): Promise<number> {
        try {
            if (!this.nfcCardNFTContract) {
                return 0;
            }

            const tokenId = await this.nfcCardNFTContract.getTokenIdByNFC(nfcUID);
            if (tokenId === 0) {
                return 0;
            }

            const count = await this.nfcCardNFTContract.getCardOwnershipCount(tokenId);
            return Number(count);
        } catch (error) {
            console.error('Error getting card ownership count:', error);
            return 0;
        }
    }

    /**
     * 检查地址是否曾经拥有过该卡片
     */
    async hasOwnedCard(nfcUID: string, ownerAddress: string): Promise<boolean> {
        try {
            if (!this.nfcCardNFTContract) {
                return false;
            }

            const tokenId = await this.nfcCardNFTContract.getTokenIdByNFC(nfcUID);
            if (tokenId === 0) {
                return false;
            }

            return await this.nfcCardNFTContract.hasOwnedCard(tokenId, ownerAddress);
        } catch (error) {
            console.error('Error checking card ownership history:', error);
            return false;
        }
    }

    /**
     * 获取地址拥有某卡片的总时长
     */
    async getOwnershipDuration(nfcUID: string, ownerAddress: string): Promise<number> {
        try {
            if (!this.nfcCardNFTContract) {
                return 0;
            }

            const tokenId = await this.nfcCardNFTContract.getTokenIdByNFC(nfcUID);
            if (tokenId === 0) {
                return 0;
            }

            const duration = await this.nfcCardNFTContract.getOwnershipDuration(tokenId, ownerAddress);
            return Number(duration);
        } catch (error) {
            console.error('Error getting ownership duration:', error);
            return 0;
        }
    }

    /**
     * 批量获取卡片当前所有者
     */
    async batchGetCardOwners(nfcUIDs: string[]): Promise<string[]> {
        try {
            if (!this.nfcCardNFTContract) {
                return [];
            }

            // 获取所有Token ID
            const tokenIds: number[] = [];
            for (const nfcUID of nfcUIDs) {
                const tokenId = await this.nfcCardNFTContract.getTokenIdByNFC(nfcUID);
                tokenIds.push(Number(tokenId));
            }

            // 批量获取所有者
            const owners = await this.nfcCardNFTContract.batchGetCurrentOwners(tokenIds);
            return owners;
        } catch (error) {
            console.error('Error batch getting card owners:', error);
            return [];
        }
    }

    // =================
    // 工具函数
    // =================

        /**
     * 检查合约连接状态
     */
    async getContractStatus(): Promise<{
        domainRegistry: boolean;
        nfcRegistry: boolean;
        nfcCardNFT: boolean;
        walletConnected: boolean;
        network: string;
    }> {
        try {
            const network = await this.provider.getNetwork();
            
            return {
                domainRegistry: !!this.domainRegistryContract,
                nfcRegistry: !!this.nfcRegistryContract,
                nfcCardNFT: !!this.nfcCardNFTContract,
                walletConnected: !!this.wallet,
                network: network.name || 'unknown'
            };
        } catch (error) {
            return {
                domainRegistry: false,
                nfcRegistry: false,
                nfcCardNFT: false,
                walletConnected: false,
                network: 'disconnected'
            };
        }
    }

    /**
     * 获取当前Gas价格
     */
    async getCurrentGasPrice(): Promise<string> {
        try {
            const gasPrice = await this.provider.getFeeData();
            return ethers.formatUnits(gasPrice.gasPrice || 0, 'gwei');
        } catch (error) {
            console.error('Error getting gas price:', error);
            return '0';
        }
    }

        /**
     * 预估交易费用
     */
    async estimateTransactionCost(type: 'domain_register' | 'nfc_bind' | 'nfc_unbind' | 'nft_mint' | 'nft_burn'): Promise<string> {
        try {
            const gasPrice = await this.provider.getFeeData();
            
            const gasLimits = {
                'domain_register': 300000,
                'nfc_bind': 200000,
                'nfc_unbind': 250000,
                'nft_mint': 300000,
                'nft_burn': 200000
            };
            
            const gasLimit = gasLimits[type] || 200000;
            const cost = (gasPrice.gasPrice || 0n) * BigInt(gasLimit);
            return ethers.formatEther(cost);
        } catch (error) {
            console.error('Error estimating transaction cost:', error);
            return '0';
        }
    }

    /**
     * 完整的NFC解绑流程（包含NFT销毁）
     */
    async completeNFCUnbindProcess(nfcUID: string, resetToBlank: boolean = true): Promise<{
        nfcUnbound: boolean;
        nftBurned: boolean;
        success: boolean;
    }> {
        const result = {
            nfcUnbound: false,
            nftBurned: false,
            success: false
        };

        try {
            // 1. 先销毁NFT（如果存在）
            const nftBurnResult = await this.unbindAndBurnCardNFT(nfcUID);
            result.nftBurned = nftBurnResult;

            // 2. 再解绑NFC并重置为空白状态
            const nfcUnbindResult = await this.unbindNFCWallet(nfcUID, resetToBlank);
            result.nfcUnbound = nfcUnbindResult;

            // 3. 判断整体成功状态
            result.success = result.nfcUnbound; // NFT销毁失败不影响整体流程

            return result;
        } catch (error) {
            console.error('Error in complete NFC unbind process:', error);
            return result;
        }
    }
} 