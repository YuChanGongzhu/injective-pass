import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Wallet } from 'ethers';
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
    SIGN_AMINO
} from '@injectivelabs/sdk-ts';
import { BigNumberInWei } from '@injectivelabs/utils';
import { Network, getNetworkEndpoints } from '@injectivelabs/networks';

@Injectable()
export class InjectiveService {
    private readonly masterPrivateKey: string;
    private readonly network: Network;
    private readonly endpoints: any;

    constructor(private configService: ConfigService) {
        this.masterPrivateKey = this.configService.get<string>('CONTRACT_PRIVATE_KEY');
        this.network = this.configService.get<string>('NODE_ENV') === 'production'
            ? Network.Mainnet
            : Network.TestnetSentry;
        this.endpoints = getNetworkEndpoints(this.network);
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
     * 给新用户发送初始资金（0.1 INJ）
     * 专门用于空白卡激活流程
     */
    async sendInitialFunds(
        recipientAddress: string,
        amount: string = '0.1'
    ): Promise<{ success: boolean; txHash?: string; error?: string }> {
        try {
            console.log(`发送初始资金: ${amount} INJ to ${recipientAddress}`);

            // 使用主账户发送资金
            const result = await this.sendInjectiveTokens(
                recipientAddress,
                amount,
                this.masterPrivateKey
            );

            if (result.success) {
                console.log(`初始资金发送成功: ${amount} INJ to ${recipientAddress}, tx: ${result.txHash}`);
            } else {
                console.error(`初始资金发送失败: ${result.error}`);
            }

            return result;
        } catch (error) {
            console.error('Error sending initial funds:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 发送INJ代币到指定地址
     */
    async sendInjectiveTokens(
        toAddress: string,
        amount: string, // INJ数量，例如 "0.1"
        fromPrivateKey?: string // 如果不提供，使用主账户私钥
    ): Promise<{ success: boolean; txHash?: string; error?: string }> {
        try {
            const privateKey = fromPrivateKey || this.masterPrivateKey;
            if (!privateKey) {
                throw new Error('No private key available');
            }

            console.log(`Sending ${amount} INJ to ${toAddress}`);

            // 初始化私钥
            const privateKeyObj = PrivateKey.fromPrivateKey(privateKey);
            const publicKey = privateKeyObj.toPublicKey();
            const senderAddress = publicKey.toAddress().toBech32();

            // 确保接收地址是Injective格式
            const recipientAddress = toAddress.startsWith('inj')
                ? toAddress
                : getInjectiveAddress(toAddress);

            // 初始化API客户端
            const chainRestAuthApi = new ChainRestAuthApi(this.endpoints.rest);
            const txRestApi = new TxRestApi(this.endpoints.rest);

            // 获取账户信息
            const accountDetailsResponse = await chainRestAuthApi.fetchAccount(senderAddress);
            const baseAccount = BaseAccount.fromRestApi(accountDetailsResponse);

            // 创建发送消息
            const amount_wei = new BigNumberInWei(amount).toFixed();

            const msg = MsgSend.fromJSON({
                amount: {
                    amount: amount_wei,
                    denom: 'inj'
                },
                srcInjectiveAddress: senderAddress,
                dstInjectiveAddress: recipientAddress
            });

            // 创建交易
            const { txRaw } = createTransaction({
                message: [msg],
                memo: 'NFC Wallet Initial Funding',
                fee: DEFAULT_STD_FEE,
                pubKey: publicKey.toBase64(),
                sequence: baseAccount.sequence,
                accountNumber: baseAccount.accountNumber,
                chainId: this.network === Network.Mainnet ? 'injective-1' : 'injective-888'
            });

            // 签名交易
            const signatureBytes = await privateKeyObj.sign(Buffer.from(txRaw.bodyBytes));
            txRaw.signatures = [signatureBytes];

            // 广播交易
            const txResponse = await txRestApi.broadcast(txRaw);

            if (txResponse.code !== 0) {
                throw new Error(`Transaction failed: ${txResponse.rawLog}`);
            }

            console.log(`Successfully sent ${amount} INJ to ${recipientAddress}, tx: ${txResponse.txHash}`);

            return {
                success: true,
                txHash: txResponse.txHash
            };

        } catch (error) {
            console.error('Error sending Injective tokens:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
 * 查询账户余额
 */
    async getAccountBalance(address: string): Promise<{
        inj: string;
        usd?: string;
    }> {
        try {
            const injectiveAddress = address.startsWith('inj')
                ? address
                : getInjectiveAddress(address);

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

            // 创建发送消息
            const amount_wei = new BigNumberInWei(amount).toFixed();

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
                chainId: this.network === Network.Mainnet ? 'injective-1' : 'injective-888'
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
            chainId: this.network === Network.Mainnet ? 'injective-1' : 'injective-888',
            rpcUrl: this.endpoints.grpc,
            restUrl: this.endpoints.rest
        };
    }
} 