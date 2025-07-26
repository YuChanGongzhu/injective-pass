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
const path = require("path");
const fs = require("fs");
const NFCWalletRegistryABI = JSON.parse(fs.readFileSync(path.join(__dirname, '../../src/contract/abis/NFCWalletRegistry.json'), 'utf8')).abi;
const INJDomainNFTABI = JSON.parse(fs.readFileSync(path.join(__dirname, '../../src/contract/abis/INJDomainNFT.json'), 'utf8')).abi;
const CatNFTABI = JSON.parse(fs.readFileSync(path.join(__dirname, '../../src/contract/abis/CatNFT.json'), 'utf8')).abi;
let InjectiveService = class InjectiveService {
    constructor(configService) {
        this.configService = configService;
        this.masterPrivateKey = this.configService.get('CONTRACT_PRIVATE_KEY');
        this.network = this.configService.get('NODE_ENV') === 'production'
            ? networks_1.Network.Mainnet
            : networks_1.Network.TestnetSentry;
        this.endpoints = (0, networks_1.getNetworkEndpoints)(this.network);
        const rpcUrl = this.configService.get('INJECTIVE_RPC_URL');
        this.evmProvider = new ethers_1.JsonRpcProvider(rpcUrl);
        this.evmWallet = new ethers_1.Wallet(this.masterPrivateKey, this.evmProvider);
        this.initializeContracts();
    }
    initializeContracts() {
        try {
            const nfcRegistryAddress = this.configService.get('NFC_REGISTRY_ADDRESS');
            const domainRegistryAddress = this.configService.get('DOMAIN_REGISTRY_ADDRESS');
            const catNFTAddress = this.configService.get('CAT_NFT_ADDRESS');
            if (nfcRegistryAddress) {
                this.nfcRegistryContract = new ethers_1.Contract(nfcRegistryAddress, NFCWalletRegistryABI, this.evmWallet);
                console.log(`NFCWalletRegistry 合约初始化成功: ${nfcRegistryAddress}`);
            }
            if (domainRegistryAddress) {
                this.domainNFTContract = new ethers_1.Contract(domainRegistryAddress, INJDomainNFTABI, this.evmWallet);
                console.log(`INJDomainNFT 合约初始化成功: ${domainRegistryAddress}`);
            }
            if (catNFTAddress) {
                this.catNFTContract = new ethers_1.Contract(catNFTAddress, CatNFTABI, this.evmWallet);
                console.log(`CatNFT 合约初始化成功: ${catNFTAddress}`);
            }
        }
        catch (error) {
            console.error('合约初始化失败:', error);
        }
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
            console.log(`开始发送初始资金: ${amount} INJ -> ${recipientAddress}`);
            const masterAddress = this.getWalletFromPrivateKey(this.masterPrivateKey).address;
            const masterBalance = await this.getAccountBalance(masterAddress);
            const requiredAmount = new utils_1.BigNumberInBase(amount);
            if (new utils_1.BigNumberInBase(masterBalance.inj).lt(requiredAmount)) {
                return {
                    success: false,
                    error: `主账户余额不足: ${masterBalance.inj} INJ, 需要: ${amount} INJ`
                };
            }
            const msg = sdk_ts_1.MsgSend.fromJSON({
                amount: {
                    denom: 'inj',
                    amount: new utils_1.BigNumberInBase(amount).toWei().toFixed()
                },
                srcInjectiveAddress: masterAddress,
                dstInjectiveAddress: recipientAddress
            });
            const broadcaster = new sdk_ts_1.MsgBroadcasterWithPk({
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
            }
            else {
                console.error(`初始资金发送失败: ${txResponse.rawLog}`);
                return {
                    success: false,
                    error: `交易失败: ${txResponse.rawLog}`
                };
            }
        }
        catch (error) {
            console.error('发送初始资金失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    async sendInjectiveTokens(toAddress, amount, fromPrivateKey) {
        try {
            const privateKey = fromPrivateKey || this.masterPrivateKey;
            const masterAddress = this.getWalletFromPrivateKey(privateKey).address;
            const masterBalance = await this.getAccountBalance(masterAddress);
            const requiredAmount = new utils_1.BigNumberInBase(amount);
            if (new utils_1.BigNumberInBase(masterBalance.inj).lt(requiredAmount)) {
                return {
                    success: false,
                    error: `主账户余额不足: ${masterBalance.inj} INJ, 需要: ${amount} INJ`
                };
            }
            const msg = sdk_ts_1.MsgSend.fromJSON({
                amount: {
                    denom: 'inj',
                    amount: new utils_1.BigNumberInBase(amount).toWei().toFixed()
                },
                srcInjectiveAddress: masterAddress,
                dstInjectiveAddress: toAddress
            });
            const broadcaster = new sdk_ts_1.MsgBroadcasterWithPk({
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
            }
            else {
                return {
                    success: false,
                    error: `交易失败: ${txResponse.rawLog}`
                };
            }
        }
        catch (error) {
            console.error('发送INJ代币失败:', error);
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
    async mintDomainNFT(ownerAddress, domainName, nfcUID, tokenId) {
        try {
            if (!this.domainNFTContract) {
                throw new Error('域名NFT合约未初始化');
            }
            const domainPrefix = domainName.replace('.inj', '');
            console.log(`开始铸造域名NFT: ${domainName} -> ${ownerAddress}, NFC: ${nfcUID}`);
            const tx = await this.domainNFTContract.mintDomainNFT(domainPrefix, nfcUID, '', {
                gasLimit: 500000,
                gasPrice: (0, ethers_1.parseEther)('0.00000002'),
                value: 0
            });
            console.log(`域名NFT铸造交易已发送，交易哈希: ${tx.hash}`);
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
                        blockNumber: receipt.blockNumber,
                        gasUsed: receipt.gasUsed.toString(),
                        timestamp: new Date().toISOString()
                    }
                };
            }
            else {
                throw new Error('交易失败');
            }
        }
        catch (error) {
            console.error('域名NFT铸造失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    async mintCatNFT(ownerAddress, catName) {
        try {
            if (!this.catNFTContract) {
                throw new Error('小猫NFT合约未初始化');
            }
            console.log(`开始小猫NFT抽卡: ${catName} -> ${ownerAddress}`);
            const tx = await this.catNFTContract.drawCatNFT(catName, {
                gasLimit: 500000,
                gasPrice: (0, ethers_1.parseEther)('0.00000002'),
                value: (0, ethers_1.parseEther)('0.1')
            });
            console.log(`小猫NFT抽卡交易已发送，交易哈希: ${tx.hash}`);
            const receipt = await tx.wait();
            if (receipt.status === 1) {
                console.log(`小猫NFT抽卡成功: ${catName} -> ${ownerAddress}, 交易哈希: ${tx.hash}`);
                let rarity = 'R';
                let color = 'black';
                let tokenId = '';
                console.log(`开始解析交易日志，总共${receipt.logs.length}条日志`);
                for (const log of receipt.logs) {
                    try {
                        const parsedLog = this.catNFTContract.interface.parseLog(log);
                        console.log(`解析日志成功: ${parsedLog?.name || 'unknown'}`);
                        if (parsedLog && parsedLog.name === 'CatNFTMinted') {
                            tokenId = parsedLog.args.tokenId.toString();
                            const rarityIndex = parsedLog.args.rarity;
                            color = parsedLog.args.color;
                            console.log(`找到CatNFTMinted事件: tokenId=${tokenId}, rarity=${rarityIndex}, color=${color}`);
                            const rarityMap = ['R', 'SR', 'SSR', 'UR'];
                            rarity = rarityMap[rarityIndex] || 'R';
                            break;
                        }
                    }
                    catch (e) {
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
            }
            else {
                throw new Error('交易失败');
            }
        }
        catch (error) {
            console.error('小猫NFT抽卡失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    async getContractStatus() {
        try {
            return {
                nfcRegistry: !!this.nfcRegistryContract,
                domainNFT: !!this.domainNFTContract,
                catNFT: !!this.catNFTContract,
                networkInfo: this.getNetworkInfo()
            };
        }
        catch (error) {
            console.error('获取合约状态失败:', error);
            return {
                nfcRegistry: false,
                domainNFT: false,
                catNFT: false,
                networkInfo: null
            };
        }
    }
    async unbindNFCWallet(nfcUID, ownerSignature) {
        if (!this.nfcRegistryContract) {
            throw new Error('NFC注册表合约未初始化');
        }
        try {
            console.log(`解绑NFC钱包: ${nfcUID}`);
            const tx = await this.nfcRegistryContract.unbindNFCWallet(nfcUID, ownerSignature, {
                gasLimit: 500000,
                gasPrice: (0, ethers_1.parseEther)('0.00000002'),
            });
            console.log(`解绑交易已发送，交易哈希: ${tx.hash}`);
            const receipt = await tx.wait();
            if (receipt.status === 1) {
                console.log(`NFC解绑成功: ${nfcUID}, 交易哈希: ${tx.hash}`);
                return tx.hash;
            }
            else {
                throw new Error('解绑交易失败');
            }
        }
        catch (error) {
            console.error('解绑NFC钱包失败:', error);
            throw new Error(`解绑NFC钱包失败: ${error.message}`);
        }
    }
    async emergencyUnbindNFCWallet(nfcUID) {
        if (!this.nfcRegistryContract) {
            throw new Error('NFC注册表合约未初始化');
        }
        try {
            console.log(`紧急解绑NFC钱包: ${nfcUID}`);
            const tx = await this.nfcRegistryContract.emergencyUnbindNFCWallet(nfcUID, {
                gasLimit: 500000,
                gasPrice: (0, ethers_1.parseEther)('0.00000002'),
            });
            console.log(`紧急解绑交易已发送，交易哈希: ${tx.hash}`);
            const receipt = await tx.wait();
            if (receipt.status === 1) {
                console.log(`NFC紧急解绑成功: ${nfcUID}, 交易哈希: ${tx.hash}`);
                return tx.hash;
            }
            else {
                throw new Error('紧急解绑交易失败');
            }
        }
        catch (error) {
            console.error('紧急解绑NFC钱包失败:', error);
            throw new Error(`紧急解绑NFC钱包失败: ${error.message}`);
        }
    }
};
exports.InjectiveService = InjectiveService;
exports.InjectiveService = InjectiveService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], InjectiveService);
//# sourceMappingURL=injective.service.js.map