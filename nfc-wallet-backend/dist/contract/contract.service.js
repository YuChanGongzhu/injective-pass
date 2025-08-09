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
exports.ContractService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ethers_1 = require("ethers");
const path = require("path");
const fs = require("fs");
function loadABI(filename) {
    try {
        const abiPath = path.join(__dirname, './abis', filename);
        console.log(`Loading ABI from: ${abiPath}`);
        if (!fs.existsSync(abiPath)) {
            throw new Error(`ABI file not found: ${abiPath}`);
        }
        const abiContent = fs.readFileSync(abiPath, 'utf8');
        const parsed = JSON.parse(abiContent);
        return parsed.abi || parsed;
    }
    catch (error) {
        console.error(`Failed to load ABI from ${filename}:`, error);
        return [];
    }
}
const CatNFTABI = loadABI('CatNFT_SocialDraw.json');
const INJDomainNFTABI = loadABI('INJDomainNFT.json');
const NFCWalletRegistryABI = loadABI('NFCWalletRegistry.json');
let ContractService = class ContractService {
    constructor(configService) {
        this.configService = configService;
        this.initializeContracts();
    }
    async initializeContracts() {
        const rpcUrl = this.configService.get('INJECTIVE_RPC_URL') ||
            'https://k8s.testnet.json-rpc.injective.network/';
        console.log('Initializing Injective EVM connection:', rpcUrl);
        this.provider = new ethers_1.ethers.JsonRpcProvider(rpcUrl, {
            name: 'Injective EVM',
            chainId: Number(this.configService.get('INJECTIVE_CHAIN_ID') || '1439'),
        });
        const privateKey = this.configService.get('CONTRACT_PRIVATE_KEY');
        if (privateKey) {
            this.wallet = new ethers_1.ethers.Wallet(privateKey, this.provider);
        }
        const domainRegistryAddress = this.configService.get('DOMAIN_REGISTRY_ADDRESS');
        const nfcRegistryAddress = this.configService.get('NFC_REGISTRY_ADDRESS');
        const catNFTAddress = this.configService.get('CATNFT_CONTRACT_ADDRESS');
        if (domainRegistryAddress) {
            this.domainRegistryContract = new ethers_1.ethers.Contract(domainRegistryAddress, INJDomainNFTABI, this.wallet || this.provider);
        }
        if (nfcRegistryAddress) {
            this.nfcRegistryContract = new ethers_1.ethers.Contract(nfcRegistryAddress, NFCWalletRegistryABI, this.wallet || this.provider);
        }
        if (catNFTAddress) {
            this.nfcCardNFTContract = new ethers_1.ethers.Contract(catNFTAddress, CatNFTABI, this.wallet || this.provider);
        }
    }
    async isDomainAvailable(domainPrefix) {
        try {
            if (!this.domainRegistryContract) {
                throw new Error('Domain registry contract not initialized');
            }
            return await this.domainRegistryContract.isDomainAvailable(domainPrefix);
        }
        catch (error) {
            console.error('Error checking domain availability:', error);
            return false;
        }
    }
    async registerDomain(domainPrefix, userAddress) {
        try {
            if (!this.domainRegistryContract || !this.wallet) {
                throw new Error('Contract or wallet not initialized');
            }
            const isAvailable = await this.isDomainAvailable(domainPrefix);
            if (!isAvailable) {
                throw new Error('Domain not available');
            }
            const registrationFee = ethers_1.ethers.parseEther('0.001');
            const tx = await this.domainRegistryContract.register(domainPrefix, {
                value: registrationFee,
                gasLimit: 300000
            });
            const receipt = await tx.wait();
            if (receipt.status === 1) {
                const fullDomain = `${domainPrefix}.inj`;
                console.log(`Domain ${fullDomain} registered successfully`);
                return fullDomain;
            }
            else {
                throw new Error('Transaction failed');
            }
        }
        catch (error) {
            console.error('Error registering domain:', error);
            return null;
        }
    }
    async resolveDomain(domain) {
        try {
            if (!this.domainRegistryContract) {
                return null;
            }
            const address = await this.domainRegistryContract.resolveDomain(domain);
            return address === ethers_1.ethers.ZeroAddress ? null : address;
        }
        catch (error) {
            console.error('Error resolving domain:', error);
            return null;
        }
    }
    async reverseResolve(address) {
        try {
            if (!this.domainRegistryContract) {
                return null;
            }
            const domain = await this.domainRegistryContract.reverseResolve(address);
            return domain || null;
        }
        catch (error) {
            console.error('Error reverse resolving:', error);
            return null;
        }
    }
    async getUserDomains(userAddress) {
        try {
            if (!this.domainRegistryContract) {
                return [];
            }
            return await this.domainRegistryContract.getUserDomains(userAddress);
        }
        catch (error) {
            console.error('Error getting user domains:', error);
            return [];
        }
    }
    async recordNFCWalletBinding(nfcUID, walletAddress) {
        try {
            if (!this.nfcRegistryContract || !this.wallet) {
                throw new Error('Contract or wallet not initialized');
            }
            const isAlreadyBound = await this.isNFCBound(nfcUID);
            if (isAlreadyBound) {
                console.log(`NFC ${nfcUID} already bound`);
                return true;
            }
            const tx = await this.nfcRegistryContract.bindNFCWallet(nfcUID, walletAddress, {
                gasLimit: 200000
            });
            const receipt = await tx.wait();
            if (receipt.status === 1) {
                console.log(`NFC ${nfcUID} bound to wallet ${walletAddress}`);
                return true;
            }
            else {
                throw new Error('Transaction failed');
            }
        }
        catch (error) {
            console.error('Error recording NFC wallet binding:', error);
            return false;
        }
    }
    async isNFCBound(nfcUID) {
        try {
            if (!this.nfcRegistryContract) {
                return false;
            }
            return await this.nfcRegistryContract.isNFCBound(nfcUID);
        }
        catch (error) {
            console.error('Error checking NFC binding:', error);
            return false;
        }
    }
    async getNFCWallet(nfcUID) {
        try {
            if (!this.nfcRegistryContract) {
                return null;
            }
            const address = await this.nfcRegistryContract.getNFCWallet(nfcUID);
            return address === ethers_1.ethers.ZeroAddress ? null : address;
        }
        catch (error) {
            console.error('Error getting NFC wallet:', error);
            return null;
        }
    }
    async getWalletNFCs(walletAddress) {
        try {
            if (!this.nfcRegistryContract) {
                return [];
            }
            return await this.nfcRegistryContract.getWalletNFCs(walletAddress);
        }
        catch (error) {
            console.error('Error getting wallet NFCs:', error);
            return [];
        }
    }
    async detectAndBindBlankCard(nfcUID, newWalletAddress) {
        try {
            if (!this.nfcRegistryContract || !this.wallet) {
                throw new Error('Contract or wallet not initialized');
            }
            console.log(`Detecting blank card for NFC ${nfcUID}, creating wallet ${newWalletAddress}`);
            const tx = await this.nfcRegistryContract.detectAndBindBlankCard(nfcUID, newWalletAddress, {
                gasLimit: 300000
            });
            const receipt = await tx.wait();
            if (receipt.status === 1) {
                console.log(`Blank card ${nfcUID} detected and bound to ${newWalletAddress}`);
                return true;
            }
            else {
                throw new Error('Transaction failed');
            }
        }
        catch (error) {
            console.error('Error detecting and binding blank card:', error);
            return false;
        }
    }
    async initializeBlankCard(nfcUID, metadata = 'initialized') {
        try {
            if (!this.nfcRegistryContract || !this.wallet) {
                throw new Error('Contract or wallet not initialized');
            }
            const tx = await this.nfcRegistryContract.initializeBlankCard(nfcUID, metadata, {
                gasLimit: 200000
            });
            const receipt = await tx.wait();
            if (receipt.status === 1) {
                console.log(`Blank card ${nfcUID} initialized`);
                return true;
            }
            else {
                throw new Error('Transaction failed');
            }
        }
        catch (error) {
            console.error('Error initializing blank card:', error);
            return false;
        }
    }
    async unbindNFCWallet(nfcUID, ownerSignature) {
        try {
            if (!this.nfcRegistryContract || !this.wallet) {
                throw new Error('Contract or wallet not initialized');
            }
            const isBound = await this.isNFCBound(nfcUID);
            if (!isBound) {
                console.log(`NFC ${nfcUID} is not bound`);
                return false;
            }
            const tx = await this.nfcRegistryContract.unbindNFCWallet(nfcUID, ownerSignature, {
                gasLimit: 250000
            });
            const receipt = await tx.wait();
            if (receipt.status === 1) {
                console.log(`NFC ${nfcUID} unbound successfully`);
                return true;
            }
            else {
                throw new Error('Transaction failed');
            }
        }
        catch (error) {
            console.error('Error unbinding NFC wallet:', error);
            return false;
        }
    }
    async emergencyUnbindNFCWallet(nfcUID) {
        try {
            if (!this.nfcRegistryContract || !this.wallet) {
                throw new Error('Contract or wallet not initialized');
            }
            const tx = await this.nfcRegistryContract.emergencyUnbindNFCWallet(nfcUID, {
                gasLimit: 250000
            });
            const receipt = await tx.wait();
            if (receipt.status === 1) {
                console.log(`NFC ${nfcUID} emergency unbound successfully`);
                return true;
            }
            else {
                throw new Error('Transaction failed');
            }
        }
        catch (error) {
            console.error('Error emergency unbinding NFC wallet:', error);
            return false;
        }
    }
    async isNFCBlank(nfcUID) {
        try {
            if (!this.nfcRegistryContract) {
                return true;
            }
            return await this.nfcRegistryContract.isNFCBlank(nfcUID);
        }
        catch (error) {
            console.error('Error checking NFC blank status:', error);
            return true;
        }
    }
    async getNFCStatus(nfcUID) {
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
        }
        catch (error) {
            console.error('Error getting NFC status:', error);
            return { status: 0, description: 'blank' };
        }
    }
    async getNFCHistory(nfcUID) {
        try {
            if (!this.nfcRegistryContract) {
                return [];
            }
            return await this.nfcRegistryContract.getNFCHistory(nfcUID);
        }
        catch (error) {
            console.error('Error getting NFC history:', error);
            return [];
        }
    }
    async mintCardNFT(nfcUID, seriesId, ownerAddress) {
        try {
            if (!this.nfcCardNFTContract || !this.wallet) {
                throw new Error('NFT contract or wallet not initialized');
            }
            const isBound = await this.isNFCBound(nfcUID);
            if (!isBound) {
                throw new Error('NFC not bound to wallet');
            }
            const tx = await this.nfcCardNFTContract.mintCatCard(nfcUID, ownerAddress, {
                gasLimit: 300000
            });
            const receipt = await tx.wait();
            if (receipt.status === 1) {
                const mintEvent = receipt.logs.find((log) => log.topics[0] === ethers_1.ethers.id('CatMinted(uint256,string,address,string,uint8)'));
                if (mintEvent) {
                    const tokenId = Number(mintEvent.topics[1]);
                    console.log(`NFT minted for NFC ${nfcUID}, Token ID: ${tokenId}`);
                    return tokenId;
                }
            }
            throw new Error('Transaction failed or event not found');
        }
        catch (error) {
            console.error('Error minting card NFT:', error);
            return null;
        }
    }
    async unbindAndBurnCardNFT(nfcUID, ownerSignature = '0x') {
        try {
            if (!this.nfcCardNFTContract || !this.wallet) {
                throw new Error('NFT contract or wallet not initialized');
            }
            const tokenId = await this.nfcCardNFTContract.getTokenIdByNFC(nfcUID);
            if (tokenId === 0) {
                console.log(`No NFT found for NFC ${nfcUID}`);
                return true;
            }
            const tx = await this.nfcCardNFTContract.unbindAndBurnCat(nfcUID, ownerSignature, {
                gasLimit: 200000
            });
            const receipt = await tx.wait();
            if (receipt.status === 1) {
                console.log(`NFT for NFC ${nfcUID} unbound and burned successfully`);
                return true;
            }
            else {
                throw new Error('Transaction failed');
            }
        }
        catch (error) {
            console.error('Error unbinding and burning card NFT:', error);
            return false;
        }
    }
    async getCardNFTInfo(nfcUID) {
        try {
            if (!this.nfcCardNFTContract) {
                return null;
            }
            const tokenId = await this.nfcCardNFTContract.getTokenIdByNFC(nfcUID);
            if (tokenId === 0) {
                return null;
            }
            return await this.nfcCardNFTContract.getCatInfo(tokenId);
        }
        catch (error) {
            console.error('Error getting card NFT info:', error);
            return null;
        }
    }
    async interactWithCard(myNfcUID, targetNfcUID, interactionType, userAddress) {
        try {
            if (!this.nfcCardNFTContract) {
                throw new Error('NFT contract not initialized');
            }
            const data = this.nfcCardNFTContract.interface.encodeFunctionData('interactWithCat', [myNfcUID, targetNfcUID, interactionType, '']);
            console.log(`Card interaction initiated: ${myNfcUID} -> ${targetNfcUID}, type: ${interactionType}`);
            console.log(`Transaction data: ${data}`);
            console.log(`Contract address: ${await this.nfcCardNFTContract.getAddress()}`);
            return true;
        }
        catch (error) {
            console.error('Error preparing card interaction:', error);
            return false;
        }
    }
    async unbindAndTransferCardNFT(nfcUID, newOwner, ownerSignature) {
        try {
            if (!this.nfcCardNFTContract) {
                throw new Error('NFT contract not initialized');
            }
            const data = this.nfcCardNFTContract.interface.encodeFunctionData('unbindAndTransferCat', [nfcUID, newOwner, ownerSignature]);
            console.log(`Transfer card NFT prepared for NFC ${nfcUID} to ${newOwner}`);
            console.log(`Transaction data: ${data}`);
            return true;
        }
        catch (error) {
            console.error('Error preparing card transfer:', error);
            return false;
        }
    }
    async getWalletCardStats(walletAddress) {
        try {
            if (!this.nfcRegistryContract) {
                return null;
            }
            const result = await this.nfcRegistryContract.getWalletCardStats(walletAddress);
            return {
                totalCards: Number(result.totalCards),
                activeCards: Number(result.activeCards),
                blankCards: Number(result.blankCards)
            };
        }
        catch (error) {
            console.error('Error getting wallet card stats:', error);
            return null;
        }
    }
    async getCardOwnershipHistory(nfcUID) {
        try {
            if (!this.nfcCardNFTContract) {
                return [];
            }
            const tokenId = await this.nfcCardNFTContract.getTokenIdByNFC(nfcUID);
            if (tokenId === 0) {
                return [];
            }
            return await this.nfcCardNFTContract.getCatInteractions(tokenId);
        }
        catch (error) {
            console.error('Error getting card ownership history:', error);
            return [];
        }
    }
    async getCardOwnershipCount(nfcUID) {
        try {
            if (!this.nfcCardNFTContract) {
                return 0;
            }
            const tokenId = await this.nfcCardNFTContract.getTokenIdByNFC(nfcUID);
            if (tokenId === 0) {
                return 0;
            }
            return 0;
        }
        catch (error) {
            console.error('Error getting card ownership count:', error);
            return 0;
        }
    }
    async hasOwnedCard(nfcUID, ownerAddress) {
        try {
            if (!this.nfcCardNFTContract) {
                return false;
            }
            const tokenId = await this.nfcCardNFTContract.getTokenIdByNFC(nfcUID);
            if (tokenId === 0) {
                return false;
            }
            return false;
        }
        catch (error) {
            console.error('Error checking card ownership history:', error);
            return false;
        }
    }
    async getOwnershipDuration(nfcUID, ownerAddress) {
        try {
            if (!this.nfcCardNFTContract) {
                return 0;
            }
            const tokenId = await this.nfcCardNFTContract.getTokenIdByNFC(nfcUID);
            if (tokenId === 0) {
                return 0;
            }
            return 0;
        }
        catch (error) {
            console.error('Error getting ownership duration:', error);
            return 0;
        }
    }
    async batchGetCardOwners(nfcUIDs) {
        try {
            if (!this.nfcCardNFTContract) {
                return [];
            }
            const tokenIds = [];
            for (const nfcUID of nfcUIDs) {
                const tokenId = await this.nfcCardNFTContract.getTokenIdByNFC(nfcUID);
                tokenIds.push(Number(tokenId));
            }
            return [];
        }
        catch (error) {
            console.error('Error batch getting card owners:', error);
            return [];
        }
    }
    async mintCatNFT(ownerAddress, catName, description) {
        try {
            if (!this.nfcCardNFTContract || !this.wallet) {
                return {
                    success: false,
                    error: 'NFT contract or wallet not initialized'
                };
            }
            const tempNfcUID = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            console.log(`铸造小猫NFT: ${catName} for ${ownerAddress}`);
            const tx = await this.nfcCardNFTContract.mintCatCard(tempNfcUID, ownerAddress, {
                gasLimit: 500000
            });
            const receipt = await tx.wait();
            if (receipt.status === 1) {
                const mintEvent = receipt.logs.find((log) => {
                    try {
                        const parsed = this.nfcCardNFTContract.interface.parseLog(log);
                        return parsed && parsed.name === 'CatMinted';
                    }
                    catch {
                        return false;
                    }
                });
                if (mintEvent) {
                    const parsed = this.nfcCardNFTContract.interface.parseLog(mintEvent);
                    const tokenId = parsed.args.tokenId.toString();
                    console.log(`小猫NFT铸造成功: ${catName}, Token ID: ${tokenId}`);
                    return {
                        success: true,
                        tokenId: tokenId
                    };
                }
                else {
                    console.warn('铸造成功但未找到Mint事件');
                    return {
                        success: true,
                        tokenId: 'unknown'
                    };
                }
            }
            else {
                return {
                    success: false,
                    error: '交易失败'
                };
            }
        }
        catch (error) {
            console.error('小猫NFT铸造失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    async burnNFT(tokenId, ownerAddress) {
        try {
            if (!this.nfcCardNFTContract || !this.wallet) {
                return {
                    success: false,
                    error: 'NFT contract or wallet not initialized'
                };
            }
            console.log(`销毁NFT: Token ID ${tokenId} for ${ownerAddress}`);
            const tempNfcUID = `burn_${tokenId}_${Date.now()}`;
            const tx = await this.nfcCardNFTContract.unbindAndBurnCat(tempNfcUID, '0x', {
                gasLimit: 300000
            });
            const receipt = await tx.wait();
            if (receipt.status === 1) {
                console.log(`NFT销毁成功: Token ID ${tokenId}`);
                return {
                    success: true
                };
            }
            else {
                return {
                    success: false,
                    error: '销毁交易失败'
                };
            }
        }
        catch (error) {
            console.error('NFT销毁失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    async mintCatCardNFT(nfcUID, ownerAddress) {
        try {
            if (!this.nfcCardNFTContract || !this.wallet) {
                throw new Error('NFT contract or wallet not initialized');
            }
            const isBound = await this.isNFCBound(nfcUID);
            if (!isBound) {
                throw new Error('NFC not bound to wallet');
            }
            console.log(`Minting cat NFT for NFC ${nfcUID}, owner: ${ownerAddress}`);
            const tx = await this.nfcCardNFTContract.mintCatCard(nfcUID, ownerAddress, {
                gasLimit: 500000,
                value: ethers_1.ethers.parseEther('0.001')
            });
            const receipt = await tx.wait();
            if (receipt.status === 1) {
                const mintEvent = receipt.logs.find((log) => {
                    try {
                        const parsed = this.nfcCardNFTContract.interface.parseLog(log);
                        return parsed && parsed.name === 'CatMinted';
                    }
                    catch {
                        return false;
                    }
                });
                if (mintEvent) {
                    const parsed = this.nfcCardNFTContract.interface.parseLog(mintEvent);
                    const tokenId = Number(parsed.args.tokenId);
                    console.log(`Cat NFT minted for NFC ${nfcUID}, Token ID: ${tokenId}`);
                    return tokenId;
                }
            }
            throw new Error('Transaction failed or event not found');
        }
        catch (error) {
            console.error('Error minting cat NFT:', error);
            return null;
        }
    }
    async getWalletCats(walletAddress) {
        try {
            if (!this.nfcCardNFTContract) {
                return [];
            }
            const tokenIds = await this.nfcCardNFTContract.getWalletCats(walletAddress);
            const cats = [];
            for (const tokenId of tokenIds) {
                try {
                    const catInfo = await this.nfcCardNFTContract.getCatInfo(tokenId);
                    if (catInfo) {
                        cats.push({
                            tokenId: Number(tokenId),
                            nfcUID: catInfo[0],
                            catName: catInfo[1],
                            breed: Number(catInfo[2]),
                            mood: Number(catInfo[3]),
                            friendshipLevel: Number(catInfo[4]),
                            totalInteractions: Number(catInfo[5]),
                            lastInteraction: Number(catInfo[6]),
                            mintedAt: Number(catInfo[7]),
                            isActive: catInfo[8],
                            boundWallet: catInfo[9],
                            imageURI: catInfo[10]
                        });
                    }
                }
                catch (error) {
                    console.warn(`Failed to get info for cat token ${tokenId}:`, error);
                }
            }
            return cats;
        }
        catch (error) {
            console.error('Error getting wallet cats:', error);
            return [];
        }
    }
    async interactWithCats(myNfcUID, targetNfcUID, interactionType, message = '', userAddress) {
        try {
            if (!this.nfcCardNFTContract) {
                throw new Error('NFT contract not initialized');
            }
            const myTokenId = await this.nfcCardNFTContract.getTokenIdByNFC(myNfcUID);
            const targetTokenId = await this.nfcCardNFTContract.getTokenIdByNFC(targetNfcUID);
            if (myTokenId === 0 || targetTokenId === 0) {
                throw new Error('One or both NFCs do not have associated cat NFTs');
            }
            const data = this.nfcCardNFTContract.interface.encodeFunctionData('interactWithCat', [myNfcUID, targetNfcUID, interactionType, message]);
            return {
                success: true,
                transactionData: {
                    to: await this.nfcCardNFTContract.getAddress(),
                    data,
                    gasLimit: 300000,
                    value: '0'
                }
            };
        }
        catch (error) {
            console.error('Error preparing cat interaction:', error);
            return { success: false };
        }
    }
    async getCatInteractionHistory(nfcUID) {
        try {
            if (!this.nfcCardNFTContract) {
                return [];
            }
            const tokenId = await this.nfcCardNFTContract.getTokenIdByNFC(nfcUID);
            if (tokenId === 0) {
                return [];
            }
            const interactions = await this.nfcCardNFTContract.getCatInteractions(tokenId);
            return interactions.map((interaction) => ({
                timestamp: Number(interaction[0]),
                interactor: interaction[1],
                interactionType: Number(interaction[2]),
                message: interaction[3]
            }));
        }
        catch (error) {
            console.error('Error getting cat interaction history:', error);
            return [];
        }
    }
    async isAuthorizedMinter(address) {
        try {
            if (!this.nfcCardNFTContract) {
                return false;
            }
            return await this.nfcCardNFTContract.authorizedMinters(address);
        }
        catch (error) {
            console.error('Error checking minter authorization:', error);
            return false;
        }
    }
    async setAuthorizedMinter(minterAddress, authorized) {
        try {
            if (!this.nfcCardNFTContract || !this.wallet) {
                throw new Error('Contract or wallet not initialized');
            }
            const tx = await this.nfcCardNFTContract.setAuthorizedMinter(minterAddress, authorized, {
                gasLimit: 100000
            });
            const receipt = await tx.wait();
            if (receipt.status === 1) {
                console.log(`Minter ${minterAddress} ${authorized ? 'authorized' : 'deauthorized'}`);
                return true;
            }
            return false;
        }
        catch (error) {
            console.error('Error setting authorized minter:', error);
            return false;
        }
    }
    async getContractStatus() {
        try {
            const network = await this.provider.getNetwork();
            return {
                domainRegistry: !!this.domainRegistryContract,
                nfcRegistry: !!this.nfcRegistryContract,
                nfcCardNFT: !!this.nfcCardNFTContract,
                walletConnected: !!this.wallet,
                network: network.name || 'unknown'
            };
        }
        catch (error) {
            return {
                domainRegistry: false,
                nfcRegistry: false,
                nfcCardNFT: false,
                walletConnected: false,
                network: 'disconnected'
            };
        }
    }
    async getCurrentGasPrice() {
        try {
            const gasPrice = await this.provider.getFeeData();
            return ethers_1.ethers.formatUnits(gasPrice.gasPrice || 0, 'gwei');
        }
        catch (error) {
            console.error('Error getting gas price:', error);
            return '0';
        }
    }
    async estimateTransactionCost(type) {
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
            return ethers_1.ethers.formatEther(cost);
        }
        catch (error) {
            console.error('Error estimating transaction cost:', error);
            return '0';
        }
    }
    async completeNFCUnbindProcess(nfcUID, resetToBlank = true) {
        const result = {
            nfcUnbound: false,
            nftBurned: false,
            success: false
        };
        try {
            const nftBurnResult = await this.unbindAndBurnCardNFT(nfcUID);
            result.nftBurned = nftBurnResult;
            const nfcUnbindResult = await this.emergencyUnbindNFCWallet(nfcUID);
            result.nfcUnbound = nfcUnbindResult;
            result.success = result.nfcUnbound;
            return result;
        }
        catch (error) {
            console.error('Error in complete NFC unbind process:', error);
            return result;
        }
    }
    async socialInteraction(myNFC, otherNFC) {
        try {
            if (!this.nfcCardNFTContract || !this.wallet) {
                return {
                    success: false,
                    error: 'Cat NFT contract or wallet not initialized'
                };
            }
            console.log(`社交互动: ${myNFC} -> ${otherNFC}`);
            const tx = await this.nfcCardNFTContract.socialInteraction(myNFC, otherNFC, {
                gasLimit: 300000
            });
            const receipt = await tx.wait();
            if (receipt.status === 1) {
                const interactionEvent = receipt.logs.find((log) => {
                    try {
                        const parsed = this.nfcCardNFTContract.interface.parseLog(log);
                        return parsed?.name === 'SocialInteractionCompleted';
                    }
                    catch {
                        return false;
                    }
                });
                let rewardedDraws = 1;
                if (interactionEvent) {
                    const parsed = this.nfcCardNFTContract.interface.parseLog(interactionEvent);
                    rewardedDraws = Number(parsed.args.rewardedDraws);
                }
                return {
                    success: true,
                    rewardedDraws
                };
            }
            else {
                return {
                    success: false,
                    error: 'Transaction failed'
                };
            }
        }
        catch (error) {
            console.error('Error in social interaction:', error);
            return {
                success: false,
                error: error.message || 'Unknown error'
            };
        }
    }
    async drawCatNFTWithTickets(nfcUID, catName, userAddress) {
        try {
            if (!this.nfcCardNFTContract || !this.wallet) {
                return {
                    success: false,
                    error: 'Cat NFT contract or wallet not initialized'
                };
            }
            console.log(`使用抽卡次数铸造小猫: ${catName} for NFC ${nfcUID}`);
            const drawFee = await this.nfcCardNFTContract.drawFee();
            const tx = await this.nfcCardNFTContract.drawCatNFTWithTickets(nfcUID, catName, {
                value: drawFee,
                gasLimit: 500000
            });
            const receipt = await tx.wait();
            if (receipt.status === 1) {
                const drawEvent = receipt.logs.find((log) => {
                    try {
                        const parsed = this.nfcCardNFTContract.interface.parseLog(log);
                        return parsed?.name === 'CatDrawnWithTickets';
                    }
                    catch {
                        return false;
                    }
                });
                if (drawEvent) {
                    const parsed = this.nfcCardNFTContract.interface.parseLog(drawEvent);
                    return {
                        success: true,
                        tokenId: parsed.args.tokenId.toString(),
                        rarity: this.rarityToString(parsed.args.rarity),
                        color: parsed.args.color
                    };
                }
                return {
                    success: true,
                    tokenId: 'Unknown'
                };
            }
            else {
                return {
                    success: false,
                    error: 'Transaction failed'
                };
            }
        }
        catch (error) {
            console.error('Error drawing cat NFT with tickets:', error);
            return {
                success: false,
                error: error.message || 'Unknown error'
            };
        }
    }
    async getDrawStats(nfcUID) {
        try {
            if (!this.nfcCardNFTContract) {
                return { available: 0, used: 0, total: 0 };
            }
            const stats = await this.nfcCardNFTContract.getDrawStats(nfcUID);
            return {
                available: Number(stats.available),
                used: Number(stats.used),
                total: Number(stats.total)
            };
        }
        catch (error) {
            console.error('Error getting draw stats:', error);
            return { available: 0, used: 0, total: 0 };
        }
    }
    async hasInteracted(nfc1, nfc2) {
        try {
            if (!this.nfcCardNFTContract) {
                return false;
            }
            return await this.nfcCardNFTContract.hasInteracted(nfc1, nfc2);
        }
        catch (error) {
            console.error('Error checking interaction status:', error);
            return false;
        }
    }
    async getInteractedNFCs(nfcUID) {
        try {
            if (!this.nfcCardNFTContract) {
                return [];
            }
            return await this.nfcCardNFTContract.getInteractedNFCs(nfcUID);
        }
        catch (error) {
            console.error('Error getting interacted NFCs:', error);
            return [];
        }
    }
    async addDrawTickets(nfcUID, amount) {
        try {
            if (!this.nfcCardNFTContract || !this.wallet) {
                return false;
            }
            const tx = await this.nfcCardNFTContract.addDrawTickets(nfcUID, amount, {
                gasLimit: 200000
            });
            const receipt = await tx.wait();
            return receipt.status === 1;
        }
        catch (error) {
            console.error('Error adding draw tickets:', error);
            return false;
        }
    }
    rarityToString(rarity) {
        const rarities = ['R', 'SR', 'SSR', 'UR'];
        return rarities[rarity] || 'Unknown';
    }
};
exports.ContractService = ContractService;
exports.ContractService = ContractService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ContractService);
//# sourceMappingURL=contract.service.js.map