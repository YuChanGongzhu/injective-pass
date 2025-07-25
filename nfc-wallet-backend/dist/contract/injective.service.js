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
exports.InjectiveService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ethers_1 = require("ethers");
const sdk_ts_1 = require("@injectivelabs/sdk-ts");
const utils_1 = require("@injectivelabs/utils");
const networks_1 = require("@injectivelabs/networks");
let InjectiveService = class InjectiveService {
    constructor(configService) {
        this.configService = configService;
        this.masterPrivateKey = this.configService.get('CONTRACT_PRIVATE_KEY');
        this.network = this.configService.get('NODE_ENV') === 'production'
            ? networks_1.Network.Mainnet
            : networks_1.Network.TestnetSentry;
        this.endpoints = (0, networks_1.getNetworkEndpoints)(this.network);
    }
    getChainId() {
        return this.network === networks_1.Network.Mainnet ? 'injective-1' : 'injective-888';
    }
    generateInjectiveWallet() {
        try {
            const ethWallet = ethers_1.Wallet.createRandom();
            const privateKeyObj = sdk_ts_1.PrivateKey.fromPrivateKey(ethWallet.privateKey);
            const publicKey = privateKeyObj.toPublicKey();
            const address = publicKey.toAddress();
            return {
                privateKey: ethWallet.privateKey,
                address: address.toBech32(),
                ethAddress: ethWallet.address,
                publicKey: publicKey.toBase64()
            };
        }
        catch (error) {
            console.error('Error generating Injective wallet:', error);
            throw new Error('Failed to generate Injective wallet');
        }
    }
    getWalletFromPrivateKey(privateKeyHex) {
        try {
            const privateKeyObj = sdk_ts_1.PrivateKey.fromPrivateKey(privateKeyHex);
            const publicKey = privateKeyObj.toPublicKey();
            const address = publicKey.toAddress();
            return {
                address: address.toBech32(),
                ethAddress: address.toHex(),
                publicKey: publicKey.toBase64()
            };
        }
        catch (error) {
            console.error('Error recovering wallet from private key:', error);
            throw new Error('Failed to recover wallet from private key');
        }
    }
    convertAddresses(input) {
        try {
            if (input.startsWith('inj')) {
                return {
                    injectiveAddress: input,
                    ethereumAddress: (0, sdk_ts_1.getEthereumAddress)(input)
                };
            }
            else if (input.startsWith('0x')) {
                return {
                    injectiveAddress: (0, sdk_ts_1.getInjectiveAddress)(input),
                    ethereumAddress: input
                };
            }
            else {
                throw new Error('Invalid address format');
            }
        }
        catch (error) {
            console.error('Error converting addresses:', error);
            throw new Error('Failed to convert address format');
        }
    }
    async sendInitialFunds(recipientAddress, amount = '0.1') {
        try {
            console.log(`发送初始资金: ${amount} INJ to ${recipientAddress}`);
            const masterPrivateKey = sdk_ts_1.PrivateKey.fromPrivateKey(this.masterPrivateKey);
            const masterAddress = masterPrivateKey.toPublicKey().toAddress().toBech32();
            console.log(`主账户地址: ${masterAddress}`);
            try {
                const balance = await this.getAccountBalance(masterAddress);
                console.log(`主账户余额: ${balance.inj} INJ`);
                if (parseFloat(balance.inj) < parseFloat(amount)) {
                    const error = `主账户余额不足: ${balance.inj} INJ < ${amount} INJ. 请向主账户 ${masterAddress} 发送测试网INJ代币`;
                    console.error(error);
                    return { success: false, error };
                }
            }
            catch (balanceError) {
                console.warn(`无法获取主账户余额: ${balanceError.message}, 继续尝试发送交易...`);
            }
            const result = await this.sendInjectiveTokens(recipientAddress, amount, this.masterPrivateKey);
            if (result.success) {
                console.log(`初始资金发送成功: ${amount} INJ to ${recipientAddress}, tx: ${result.txHash}`);
            }
            else {
                console.error(`初始资金发送失败: ${result.error}`);
            }
            return result;
        }
        catch (error) {
            console.error('Error sending initial funds:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    async sendInjectiveTokens(toAddress, amount, fromPrivateKey) {
        try {
            const privateKey = fromPrivateKey || this.masterPrivateKey;
            if (!privateKey) {
                throw new Error('No private key available');
            }
            console.log(`Sending ${amount} INJ to ${toAddress}`);
            const formattedPrivateKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
            const privateKeyObj = sdk_ts_1.PrivateKey.fromPrivateKey(formattedPrivateKey);
            const senderAddress = privateKeyObj.toPublicKey().toAddress().toBech32();
            console.log(`发送方地址: ${senderAddress}`);
            const recipientAddress = toAddress.startsWith('inj')
                ? toAddress
                : (0, sdk_ts_1.getInjectiveAddress)(toAddress);
            const amountInWei = new utils_1.BigNumberInBase(amount).toWei().toFixed();
            console.log(`转换后的金额: ${amountInWei} wei`);
            const msg = sdk_ts_1.MsgSend.fromJSON({
                amount: {
                    amount: amountInWei,
                    denom: 'inj'
                },
                srcInjectiveAddress: senderAddress,
                dstInjectiveAddress: recipientAddress
            });
            const broadcaster = new sdk_ts_1.MsgBroadcasterWithPk({
                privateKey: formattedPrivateKey,
                network: this.network
            });
            console.log(`使用网络: ${this.network}, Chain ID: ${this.getChainId()}`);
            const txResponse = await broadcaster.broadcast({
                msgs: msg,
                memo: 'NFC Wallet Initial Funding'
            });
            console.log(`Successfully sent ${amount} INJ to ${recipientAddress}, tx: ${txResponse.txHash}`);
            return {
                success: true,
                txHash: txResponse.txHash
            };
        }
        catch (error) {
            console.error('Error sending Injective tokens:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    async getAccountBalance(address) {
        try {
            const injectiveAddress = address.startsWith('inj')
                ? address
                : (0, sdk_ts_1.getInjectiveAddress)(address);
            const chainRestBankApi = new sdk_ts_1.ChainRestBankApi(this.endpoints.rest);
            const balancesResponse = await chainRestBankApi.fetchBalances(injectiveAddress);
            const injBalance = balancesResponse.balances.find(balance => balance.denom === 'inj');
            const balance = injBalance ? injBalance.amount : '0';
            const injBalanceFormatted = new utils_1.BigNumberInWei(balance).toFixed(6);
            return {
                inj: injBalanceFormatted
            };
        }
        catch (error) {
            console.error('Error getting account balance:', error);
            return {
                inj: '0.000000'
            };
        }
    }
    async prepareTransaction(fromAddress, toAddress, amount, memo = '') {
        try {
            const senderAddress = fromAddress.startsWith('inj')
                ? fromAddress
                : (0, sdk_ts_1.getInjectiveAddress)(fromAddress);
            const recipientAddress = toAddress.startsWith('inj')
                ? toAddress
                : (0, sdk_ts_1.getInjectiveAddress)(toAddress);
            const chainRestAuthApi = new sdk_ts_1.ChainRestAuthApi(this.endpoints.rest);
            const accountDetailsResponse = await chainRestAuthApi.fetchAccount(senderAddress);
            const baseAccount = sdk_ts_1.BaseAccount.fromRestApi(accountDetailsResponse);
            const amount_wei = new utils_1.BigNumberInBase(amount).toWei().toFixed();
            const msg = sdk_ts_1.MsgSend.fromJSON({
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
        }
        catch (error) {
            console.error('Error preparing transaction:', error);
            throw new Error('Failed to prepare transaction');
        }
    }
    async broadcastTransaction(signedTxData) {
        try {
            const txRestApi = new sdk_ts_1.TxRestApi(this.endpoints.rest);
            const txResponse = await txRestApi.broadcast(signedTxData);
            if (txResponse.code !== 0) {
                throw new Error(`Transaction failed: ${txResponse.rawLog}`);
            }
            return {
                success: true,
                txHash: txResponse.txHash
            };
        }
        catch (error) {
            console.error('Error broadcasting transaction:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    isValidInjectiveAddress(address) {
        try {
            return address.startsWith('inj') && address.length === 42;
        }
        catch {
            return false;
        }
    }
    getNetworkInfo() {
        return {
            network: this.network,
            chainId: this.getChainId(),
            rpcUrl: this.endpoints.grpc,
            restUrl: this.endpoints.rest
        };
    }
};
exports.InjectiveService = InjectiveService;
exports.InjectiveService = InjectiveService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], InjectiveService);
//# sourceMappingURL=injective.service.js.map