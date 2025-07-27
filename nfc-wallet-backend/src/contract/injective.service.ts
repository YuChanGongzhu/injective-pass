import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Wallet, Contract, JsonRpcProvider, parseEther, formatEther } from 'ethers';
import {
    PrivateKey,
    TxRestApi,
    ChainRestAuthApi,
    ChainRestBankApi,
    createTransaction,
    MsgSend,
    getInjectiveAddress,
    getEthereumAddress,
    BaseAccount,
    DEFAULT_STD_FEE,
    SIGN_AMINO,
    MsgBroadcasterWithPk
} from '@injectivelabs/sdk-ts';
import { BigNumberInWei, BigNumberInBase } from '@injectivelabs/utils';
import { Network, getNetworkEndpoints } from '@injectivelabs/networks';
import * as path from 'path';
import * as fs from 'fs';

// 合约 ABI 常量 - 直接读取源文件
const NFCWalletRegistryABI = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../../src/contract/abis/NFCWalletRegistry.json'), 'utf8')
).abi;
const INJDomainNFTABI = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../../src/contract/abis/INJDomainNFT.json'), 'utf8')
).abi;
const CatNFTABI = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../../src/contract/abis/CatNFT.json'), 'utf8')
).abi;

@Injectable()
export class InjectiveService {
    private readonly masterPrivateKey: string;
    private readonly network: Network;
    private readonly endpoints: any;
    private readonly evmProvider: JsonRpcProvider;
    private readonly evmWallet: Wallet;

    // 合约实例
    private nfcRegistryContract: Contract;
    private domainNFTContract: Contract;
    private catNFTContract: Contract;

    constructor(private configService: ConfigService) {
        this.masterPrivateKey = this.configService.get<string>('CONTRACT_PRIVATE_KEY');

        // 锁定为测试网
        this.network = Network.TestnetSentry;
        this.endpoints = getNetworkEndpoints(this.network);

        console.log(`网络已锁定为测试网: ${this.network}`);

        // 初始化 EVM provider 和 wallet
        const rpcUrl = this.configService.get<string>('INJECTIVE_RPC_URL');
        this.evmProvider = new JsonRpcProvider(rpcUrl);
        this.evmWallet = new Wallet(this.masterPrivateKey, this.evmProvider);

        // 初始化合约实例
        this.initializeContracts();
    }

    /**
     * 初始化合约实例
     */
    private initializeContracts() {
        try {
            const nfcRegistryAddress = this.configService.get<string>('NFC_REGISTRY_ADDRESS');
            const domainRegistryAddress = this.configService.get<string>('DOMAIN_REGISTRY_ADDRESS');
            const catNFTAddress = this.configService.get<string>('CAT_NFT_ADDRESS');

            // 确保provider已正确初始化
            if (!this.evmProvider) {
                throw new Error('EVM Provider 未正确初始化');
            }

            if (!this.evmWallet) {
                throw new Error('EVM Wallet 未正确初始化');
            }

            if (nfcRegistryAddress) {
                // 验证合约地址格式
                if (!nfcRegistryAddress.startsWith('0x') || nfcRegistryAddress.length !== 42) {
                    throw new Error(`无效的NFC注册表合约地址格式: ${nfcRegistryAddress}`);
                }

                this.nfcRegistryContract = new Contract(
                    nfcRegistryAddress,
                    NFCWalletRegistryABI,
                    this.evmWallet
                );
                console.log(`NFCWalletRegistry 合约初始化成功: ${nfcRegistryAddress}`);
            }

            if (domainRegistryAddress) {
                // 验证合约地址格式
                if (!domainRegistryAddress.startsWith('0x') || domainRegistryAddress.length !== 42) {
                    throw new Error(`无效的域名注册表合约地址格式: ${domainRegistryAddress}`);
                }

                this.domainNFTContract = new Contract(
                    domainRegistryAddress,
                    INJDomainNFTABI,
                    this.evmWallet
                );
                console.log(`INJDomainNFT 合约初始化成功: ${domainRegistryAddress}`);
            }

            if (catNFTAddress) {
                // 验证合约地址格式
                if (!catNFTAddress.startsWith('0x') || catNFTAddress.length !== 42) {
                    throw new Error(`无效的CatNFT合约地址格式: ${catNFTAddress}`);
                }

                this.catNFTContract = new Contract(
                    catNFTAddress,
                    CatNFTABI,
                    this.evmWallet
                );
                console.log(`CatNFT 合约初始化成功: ${catNFTAddress}`);
            }

            console.log(`所有合约初始化完成，网络: ${this.network}, Chain ID: ${this.getChainId()}`);
        } catch (error) {
            console.error('合约初始化失败:', error);
            throw error; // 重新抛出错误，让调用者知道初始化失败
        }
    }

    /**
     * 获取正确的Chain ID
     */
    private getChainId(): string {
        // Injective Testnet 的正确 chain-id 是 'injective-888'
        // Mainnet 的 chain-id 是 'injective-1'
        return this.network === Network.Mainnet ? 'injective-1' : 'injective-888';
    }

    /**
     * 根据私钥生成Injective钱包信息
     */
    generateInjectiveWallet(): {
        privateKey: string;
        address: string;
        ethAddress: string;
        publicKey: string;
    } {
        try {
            // 生成以太坊兼容的私钥
            const ethWallet = Wallet.createRandom();

            // 使用Injective SDK处理地址转换
            const privateKeyObj = PrivateKey.fromPrivateKey(ethWallet.privateKey);
            const publicKey = privateKeyObj.toPublicKey();
            const address = publicKey.toAddress();

            return {
                privateKey: ethWallet.privateKey,
                address: address.toBech32(), // Injective地址 (inj...)
                ethAddress: ethWallet.address, // 以太坊格式地址
                publicKey: publicKey.toBase64()
            };
        } catch (error) {
            console.error('Error generating Injective wallet:', error);
            throw new Error('Failed to generate Injective wallet');
        }
    }

    /**
     * 从私钥恢复Injective钱包信息
     */
    getWalletFromPrivateKey(privateKeyHex: string): {
        address: string;
        ethAddress: string;
        publicKey: string;
    } {
        try {
            const privateKeyObj = PrivateKey.fromPrivateKey(privateKeyHex);
            const publicKey = privateKeyObj.toPublicKey();
            const address = publicKey.toAddress();

            return {
                address: address.toBech32(),
                ethAddress: address.toHex(),
                publicKey: publicKey.toBase64()
            };
        } catch (error) {
            console.error('Error recovering wallet from private key:', error);
            throw new Error('Failed to recover wallet from private key');
        }
    }

    /**
     * 地址格式转换
     */
    convertAddresses(input: string): {
        injectiveAddress: string;
        ethereumAddress: string;
    } {
        try {
            if (input.startsWith('inj')) {
                return {
                    injectiveAddress: input,
                    ethereumAddress: getEthereumAddress(input)
                };
            } else if (input.startsWith('0x')) {
                return {
                    injectiveAddress: getInjectiveAddress(input),
                    ethereumAddress: input
                };
            } else {
                throw new Error('Invalid address format');
            }
        } catch (error) {
            console.error('Error converting addresses:', error);
            throw new Error('Failed to convert address format');
        }
    }

    /**
     * 发送初始资金给新用户
     */
    async sendInitialFunds(
        recipientAddress: string,
        amount: string = '0.1'
    ): Promise<{ success: boolean; txHash?: string; error?: string }> {
        try {
            console.log(`开始发送初始资金: ${amount} INJ -> ${recipientAddress}`);

            // 检查主账户余额
            const masterAddress = this.getWalletFromPrivateKey(this.masterPrivateKey).address;
            const masterBalance = await this.getAccountBalance(masterAddress);
            const requiredAmount = new BigNumberInBase(amount);

            if (new BigNumberInBase(masterBalance.inj).lt(requiredAmount)) {
                return {
                    success: false,
                    error: `主账户余额不足: ${masterBalance.inj} INJ, 需要: ${amount} INJ`
                };
            }

            // 创建MsgSend消息
            const msg = MsgSend.fromJSON({
                amount: {
                    denom: 'inj',
                    amount: new BigNumberInBase(amount).toWei().toFixed()
                },
                srcInjectiveAddress: masterAddress,
                dstInjectiveAddress: recipientAddress
            });

            // 使用MsgBroadcasterWithPk发送交易
            const broadcaster = new MsgBroadcasterWithPk({
                privateKey: this.masterPrivateKey,
                network: this.network,
                endpoints: this.endpoints
            });

            const txResponse = await broadcaster.broadcast({
                msgs: msg
            });

            if (txResponse.code === 0) {
                console.log(`初始资金发送成功: ${recipientAddress}, tx: ${txResponse.txHash}`);
                return {
                    success: true,
                    txHash: txResponse.txHash
                };
            } else {
                console.error(`初始资金发送失败: ${txResponse.rawLog}`);
                return {
                    success: false,
                    error: `交易失败: ${txResponse.rawLog}`
                };
            }
        } catch (error) {
            console.error('发送初始资金失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 发送INJ代币
     */
    async sendInjectiveTokens(
        toAddress: string,
        amount: string, // INJ数量，例如 "0.1"
        fromPrivateKey?: string // 如果不提供，使用主账户私钥
    ): Promise<{ success: boolean; txHash?: string; error?: string; rawTx?: any }> {
        try {
            const privateKey = fromPrivateKey || this.masterPrivateKey;

            // 检查主账户余额
            const masterAddress = this.getWalletFromPrivateKey(privateKey).address;
            const masterBalance = await this.getAccountBalance(masterAddress);
            const requiredAmount = new BigNumberInBase(amount);

            if (new BigNumberInBase(masterBalance.inj).lt(requiredAmount)) {
                return {
                    success: false,
                    error: `主账户余额不足: ${masterBalance.inj} INJ, 需要: ${amount} INJ`
                };
            }

            // 创建MsgSend消息
            const msg = MsgSend.fromJSON({
                amount: {
                    denom: 'inj',
                    amount: new BigNumberInBase(amount).toWei().toFixed()
                },
                srcInjectiveAddress: masterAddress,
                dstInjectiveAddress: toAddress
            });

            // 使用MsgBroadcasterWithPk发送交易
            const broadcaster = new MsgBroadcasterWithPk({
                privateKey: privateKey,
                network: this.network,
                endpoints: this.endpoints
            });

            const txResponse = await broadcaster.broadcast({
                msgs: msg
            });

            if (txResponse.code === 0) {
                return {
                    success: true,
                    txHash: txResponse.txHash,
                    rawTx: {
                        type: 'SEND',
                        from: masterAddress,
                        to: toAddress,
                        amount: amount,
                        denom: 'inj',
                        txHash: txResponse.txHash,
                        timestamp: new Date().toISOString()
                    }
                };
            } else {
                return {
                    success: false,
                    error: `交易失败: ${txResponse.rawLog}`
                };
            }
        } catch (error) {
            console.error('发送INJ代币失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 获取账户余额
 */
    async getAccountBalance(address: string): Promise<{
        inj: string;
        usd?: string;
    }> {
        try {
            console.log(`获取账户余额 - 输入地址: "${address}", 长度: ${address?.length}`);
            
            // 验证输入地址
            if (!address || typeof address !== 'string') {
                throw new Error(`无效的地址参数: ${address}`);
            }
            
            let injectiveAddress: string;
            
            if (address.startsWith('inj')) {
                // 验证 Injective 地址格式和长度
                if (address.length !== 42) {
                    throw new Error(`无效的Injective地址长度: ${address.length}, 应该是42位. 地址: "${address}"`);
                }
                injectiveAddress = address;
            } else if (address.startsWith('0x')) {
                // 验证以太坊地址格式和长度
                if (address.length !== 42) {
                    throw new Error(`无效的以太坊地址长度: ${address.length}, 应该是42位. 地址: "${address}"`);
                }
                try {
                    injectiveAddress = getInjectiveAddress(address);
                } catch (conversionError) {
                    throw new Error(`地址转换失败: ${conversionError.message}. 原地址: "${address}"`);
                }
            } else {
                throw new Error(`不支持的地址格式: "${address}"`);
            }
            
            console.log(`转换后的Injective地址: "${injectiveAddress}", 长度: ${injectiveAddress?.length}`);
            
            // 验证转换后的地址格式
            if (!injectiveAddress.startsWith('inj') || injectiveAddress.length !== 42) {
                throw new Error(`转换后的地址格式无效: "${injectiveAddress}"`);
            }

            // 使用 ChainRestBankApi 来获取余额
            const chainRestBankApi = new ChainRestBankApi(this.endpoints.rest);
            const balancesResponse = await chainRestBankApi.fetchBalances(injectiveAddress);

            // 查找 INJ 余额
            const injBalance = balancesResponse.balances.find(balance => balance.denom === 'inj');
            const balance = injBalance ? injBalance.amount : '0';

            const injBalanceFormatted = new BigNumberInWei(balance).toFixed(6);

            return {
                inj: injBalanceFormatted
            };
        } catch (error) {
            console.error('Error getting account balance:', error);
            return {
                inj: '0.000000'
            };
        }
    }

    /**
     * 准备交易数据（用于前端签名）
     */
    async prepareTransaction(
        fromAddress: string,
        toAddress: string,
        amount: string,
        memo: string = ''
    ): Promise<any> {
        try {
            const senderAddress = fromAddress.startsWith('inj')
                ? fromAddress
                : getInjectiveAddress(fromAddress);
            const recipientAddress = toAddress.startsWith('inj')
                ? toAddress
                : getInjectiveAddress(toAddress);

            // 获取账户信息
            const chainRestAuthApi = new ChainRestAuthApi(this.endpoints.rest);
            const accountDetailsResponse = await chainRestAuthApi.fetchAccount(senderAddress);
            const baseAccount = BaseAccount.fromRestApi(accountDetailsResponse);

            // 创建发送消息 - 转换INJ到Wei格式（1 INJ = 10^18 Wei）
            const amount_wei = new BigNumberInBase(amount).toWei().toFixed();

            const msg = MsgSend.fromJSON({
                amount: {
                    amount: amount_wei,
                    denom: 'inj'
                },
                srcInjectiveAddress: senderAddress,
                dstInjectiveAddress: recipientAddress
            });

            return {
                msg,
                accountNumber: baseAccount.accountNumber,
                sequence: baseAccount.sequence,
                chainId: this.getChainId()
            };

        } catch (error) {
            console.error('Error preparing transaction:', error);
            throw new Error('Failed to prepare transaction');
        }
    }

    /**
     * 广播已签名的交易
     */
    async broadcastTransaction(signedTxData: any): Promise<{
        success: boolean;
        txHash?: string;
        error?: string;
    }> {
        try {
            const txRestApi = new TxRestApi(this.endpoints.rest);
            const txResponse = await txRestApi.broadcast(signedTxData);

            if (txResponse.code !== 0) {
                throw new Error(`Transaction failed: ${txResponse.rawLog}`);
            }

            return {
                success: true,
                txHash: txResponse.txHash
            };

        } catch (error) {
            console.error('Error broadcasting transaction:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 验证Injective地址格式
     */
    isValidInjectiveAddress(address: string): boolean {
        try {
            return address.startsWith('inj') && address.length === 42;
        } catch {
            return false;
        }
    }

    /**
     * 获取网络信息
     */
    getNetworkInfo(): {
        network: string;
        chainId: string;
        rpcUrl: string;
        restUrl: string;
    } {
        return {
            network: this.network,
            chainId: this.getChainId(),
            rpcUrl: this.endpoints.grpc,
            restUrl: this.endpoints.rest
        };
    }

    /**
     * 铸造域名NFT (与NFC绑定)
     */
    async mintDomainNFT(
        ownerAddress: string,
        domainName: string,
        nfcUID: string,
        tokenId: string,
        metadata?: any
    ): Promise<{ success: boolean; txHash?: string; error?: string; rawTx?: any }> {
        try {
            if (!this.domainNFTContract) {
                throw new Error('域名NFT合约未初始化');
            }

            // 确保地址格式正确，转换为以太坊格式地址
            let ethAddress: string;
            if (ownerAddress.startsWith('inj')) {
                // 如果是Injective地址，转换为以太坊地址
                ethAddress = getEthereumAddress(ownerAddress);
            } else if (ownerAddress.startsWith('0x')) {
                // 已经是以太坊地址格式
                ethAddress = ownerAddress;
            } else {
                throw new Error('无效的地址格式');
            }

            // 提取域名前缀（移除.inj后缀）
            const domainPrefix = domainName.replace('.inj', '');

            // 使用统一的域名NFT图片URL
            const metadataURI = 'https://bafybeih4nkltzoflarix3ghpjpemjyg2vcu2sywi4wku4uthhacs5uoh2a.ipfs.w3s.link/fir.png';

            // 调用合约的mintDomainNFT方法
            console.log(`开始铸造域名NFT: ${domainName} -> ${ownerAddress} (${ethAddress}), NFC: ${nfcUID}`);
            console.log(`使用元数据URI: ${metadataURI}`);

            const tx = await this.domainNFTContract.mintDomainNFT(
                domainPrefix,
                nfcUID,
                metadataURI, // 使用统一的图片URL
                {
                    gasLimit: 500000,
                    gasPrice: parseEther('0.00000002'), // 20 gwei
                    value: 0 // registrationFee 设置为0
                }
            );

            console.log(`域名NFT铸造交易已发送，交易哈希: ${tx.hash}`);

            // 等待交易确认
            const receipt = await tx.wait();

            if (receipt.status === 1) {
                console.log(`域名NFT铸造成功: ${domainName} -> ${ownerAddress}, 交易哈希: ${tx.hash}`);

                return {
                    success: true,
                    txHash: tx.hash,
                    rawTx: {
                        type: 'DOMAIN_NFT_MINT',
                        domain: domainName,
                        nfcUID: nfcUID,
                        tokenId: tokenId,
                        owner: ownerAddress,
                        metadataURI: metadataURI,
                        imageUrl: metadataURI, // 统一的图片URL
                        blockNumber: receipt.blockNumber,
                        gasUsed: receipt.gasUsed.toString(),
                        timestamp: new Date().toISOString(),
                        metadata: metadata || null
                    }
                };
            } else {
                throw new Error('交易失败');
            }
        } catch (error) {
            console.error('域名NFT铸造失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 铸造小猫NFT (抽卡)
     */
    async mintCatNFT(
        ownerAddress: string,
        catName: string
    ): Promise<{ success: boolean; txHash?: string; error?: string; rawTx?: any; rarity?: string; color?: string }> {
        try {
            if (!this.catNFTContract) {
                throw new Error('小猫NFT合约未初始化');
            }

            // 确保地址格式正确，转换为以太坊格式地址
            let ethAddress: string;
            if (ownerAddress.startsWith('inj')) {
                // 如果是Injective地址，转换为以太坊地址
                ethAddress = getEthereumAddress(ownerAddress);
            } else if (ownerAddress.startsWith('0x')) {
                // 已经是以太坊地址格式
                ethAddress = ownerAddress;
            } else {
                throw new Error('无效的地址格式');
            }

            console.log(`开始小猫NFT抽卡: ${catName} -> ${ownerAddress} (${ethAddress})`);

            // 调用合约的drawCatNFT方法
            const tx = await this.catNFTContract.drawCatNFT(catName, {
                gasLimit: 500000,
                gasPrice: parseEther('0.00000002'), // 20 gwei
                value: parseEther('0.1') // 抽卡费用 0.1 INJ
            });

            console.log(`小猫NFT抽卡交易已发送，交易哈希: ${tx.hash}`);

            // 等待交易确认
            const receipt = await tx.wait();

            if (receipt.status === 1) {
                console.log(`小猫NFT抽卡成功: ${catName} -> ${ownerAddress}, 交易哈希: ${tx.hash}`);

                // 解析事件获取NFT信息
                let rarity = 'R'; // 默认稀有度
                let color = 'black'; // 默认颜色
                let tokenId = '';

                console.log(`开始解析交易日志，总共${receipt.logs.length}条日志`);

                // 查找CatNFTMinted事件
                for (const log of receipt.logs) {
                    try {
                        const parsedLog = this.catNFTContract.interface.parseLog(log);
                        console.log(`解析日志成功: ${parsedLog?.name || 'unknown'}`);

                        if (parsedLog && parsedLog.name === 'CatNFTMinted') {
                            tokenId = parsedLog.args.tokenId.toString();
                            const rarityIndex = parsedLog.args.rarity;
                            color = parsedLog.args.color;

                            console.log(`找到CatNFTMinted事件: tokenId=${tokenId}, rarity=${rarityIndex}, color=${color}`);

                            // 转换稀有度枚举
                            const rarityMap = ['R', 'SR', 'SSR', 'UR'];
                            rarity = rarityMap[rarityIndex] || 'R';
                            break;
                        }
                    } catch (e) {
                        console.log(`日志解析失败:`, e.message);
                    }
                }

                console.log(`最终解析结果: tokenId="${tokenId}", rarity="${rarity}", color="${color}"`);

                return {
                    success: true,
                    txHash: tx.hash,
                    rarity,
                    color,
                    rawTx: {
                        type: 'CAT_NFT_MINT',
                        name: catName,
                        tokenId: tokenId,
                        rarity: rarity,
                        color: color,
                        owner: ownerAddress,
                        blockNumber: receipt.blockNumber,
                        gasUsed: receipt.gasUsed.toString(),
                        timestamp: new Date().toISOString()
                    }
                };
            } else {
                throw new Error('交易失败');
            }
        } catch (error) {
            console.error('小猫NFT抽卡失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }



    /**
     * 获取合约状态信息
     */
    async getContractStatus(): Promise<{
        nfcRegistry: boolean;
        domainNFT: boolean;
        catNFT: boolean;
        networkInfo: any;
    }> {
        try {
            return {
                nfcRegistry: !!this.nfcRegistryContract,
                domainNFT: !!this.domainNFTContract,
                catNFT: !!this.catNFTContract,
                networkInfo: this.getNetworkInfo()
            };
        } catch (error) {
            console.error('获取合约状态失败:', error);
            return {
                nfcRegistry: false,
                domainNFT: false,
                catNFT: false,
                networkInfo: null
            };
        }
    }

    /**
     * 解绑NFC钱包（需要所有者签名）
     */
    async unbindNFCWallet(nfcUID: string, ownerSignature: string): Promise<string> {
        if (!this.nfcRegistryContract) {
            throw new Error('NFC注册表合约未初始化');
        }

        try {
            console.log(`解绑NFC钱包: ${nfcUID}`);

            const tx = await this.nfcRegistryContract.unbindNFCWallet(nfcUID, ownerSignature, {
                gasLimit: 500000,
                gasPrice: parseEther('0.00000002'), // 20 gwei
            });

            console.log(`解绑交易已发送，交易哈希: ${tx.hash}`);

            // 等待交易确认
            const receipt = await tx.wait();

            if (receipt.status === 1) {
                console.log(`NFC解绑成功: ${nfcUID}, 交易哈希: ${tx.hash}`);
                return tx.hash;
            } else {
                throw new Error('解绑交易失败');
            }
        } catch (error) {
            console.error('解绑NFC钱包失败:', error);
            throw new Error(`解绑NFC钱包失败: ${error.message}`);
        }
    }

    /**
     * 检测并绑定空白NFC卡片到链上
     */
    async detectAndBindBlankCard(nfcUID: string, walletAddress: string): Promise<{ success: boolean; txHash?: string; error?: string }> {
        if (!this.nfcRegistryContract) {
            throw new Error('NFC注册表合约未初始化');
        }

        try {
            console.log(`开始绑定空白NFC到链上: ${nfcUID} -> ${walletAddress}`);

            // 确保地址格式正确，转换为以太坊格式地址
            let ethAddress: string;
            if (walletAddress.startsWith('inj')) {
                // 如果是Injective地址，转换为以太坊地址
                ethAddress = getEthereumAddress(walletAddress);
            } else if (walletAddress.startsWith('0x')) {
                // 已经是以太坊地址格式
                ethAddress = walletAddress;
            } else {
                throw new Error('无效的地址格式');
            }

            console.log(`使用以太坊格式地址进行合约调用: ${ethAddress}`);

            const tx = await this.nfcRegistryContract.detectAndBindBlankCard(nfcUID, ethAddress, {
                gasLimit: 500000,
                gasPrice: parseEther('0.00000002'), // 20 gwei
            });

            console.log(`NFC绑定交易已发送，交易哈希: ${tx.hash}`);

            // 等待交易确认
            const receipt = await tx.wait();

            if (receipt.status === 1) {
                console.log(`NFC绑定成功: ${nfcUID} -> ${walletAddress}, 交易哈希: ${tx.hash}`);
                return {
                    success: true,
                    txHash: tx.hash
                };
            } else {
                throw new Error('绑定交易失败');
            }
        } catch (error) {
            console.error('绑定空白NFC卡片失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 紧急解绑NFC钱包（仅限授权操作者）
     */
    async emergencyUnbindNFCWallet(nfcUID: string): Promise<string> {
        if (!this.nfcRegistryContract) {
            throw new Error('NFC注册表合约未初始化');
        }

        try {
            console.log(`紧急解绑NFC钱包: ${nfcUID}`);

            const tx = await this.nfcRegistryContract.emergencyUnbindNFCWallet(nfcUID, {
                gasLimit: 500000,
                gasPrice: parseEther('0.00000002'), // 20 gwei
            });

            console.log(`紧急解绑交易已发送，交易哈希: ${tx.hash}`);

            // 等待交易确认
            const receipt = await tx.wait();

            if (receipt.status === 1) {
                console.log(`NFC紧急解绑成功: ${nfcUID}, 交易哈希: ${tx.hash}`);
                return tx.hash;
            } else {
                throw new Error('紧急解绑交易失败');
            }
        } catch (error) {
            console.error('紧急解绑NFC钱包失败:', error);
            throw new Error(`紧急解绑NFC钱包失败: ${error.message}`);
        }
    }
}