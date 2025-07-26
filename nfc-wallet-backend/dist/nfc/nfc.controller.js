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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContractController = exports.NFCController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const nfc_service_1 = require("./nfc.service");
const register_nfc_dto_1 = require("./dto/register-nfc.dto");
const unbind_nfc_dto_1 = require("./dto/unbind-nfc.dto");
const unbind_response_dto_1 = require("./dto/unbind-response.dto");
const wallet_response_dto_1 = require("./dto/wallet-response.dto");
const domain_nft_dto_1 = require("./dto/domain-nft.dto");
const cat_nft_dto_1 = require("./dto/cat-nft.dto");
let NFCController = class NFCController {
    constructor(nfcService) {
        this.nfcService = nfcService;
    }
    async registerNFC(registerNFCDto) {
        return this.nfcService.registerNFC(registerNFCDto);
    }
    async getWalletByUID(uid) {
        const wallet = await this.nfcService.getWalletByUID(uid);
        if (!wallet) {
            throw new common_1.NotFoundException('未找到对应的钱包');
        }
        return wallet;
    }
    async checkDomainAvailability(domain) {
        return this.nfcService.checkDomainAvailability(domain);
    }
    async registerDomainNFT(registerDomainDto) {
        return this.nfcService.registerDomainNFT(registerDomainDto);
    }
    async unbindNFC(unbindNFCDto) {
        return this.nfcService.unbindNFC(unbindNFCDto.uid);
    }
    async getWalletStats() {
        return this.nfcService.getWalletStats();
    }
    async getWalletBalance(address) {
        return this.nfcService.getWalletBalance(address);
    }
    async drawCatNFT(drawCatNFTDto) {
        return this.nfcService.drawCatNFT(drawCatNFTDto);
    }
    async getUserCatNFTs(uid) {
        return this.nfcService.getUserCatNFTs(uid);
    }
};
exports.NFCController = NFCController;
__decorate([
    (0, common_1.Post)('register'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: '注册NFC卡片',
        description: '通过NFC UID注册并生成以太坊钱包，如果已存在则返回现有钱包信息。新建钱包将自动发送初始资金和铸造NFT',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '成功注册或返回已有钱包',
        type: wallet_response_dto_1.WalletResponseDto,
    }),
    (0, swagger_1.ApiBadRequestResponse)({
        description: 'NFC UID格式无效或其他输入错误',
    }),
    (0, swagger_1.ApiConflictResponse)({
        description: '该NFC UID已被注册',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_nfc_dto_1.RegisterNFCDto]),
    __metadata("design:returntype", Promise)
], NFCController.prototype, "registerNFC", null);
__decorate([
    (0, common_1.Get)('wallet/:uid'),
    (0, swagger_1.ApiOperation)({
        summary: '根据UID获取钱包信息',
        description: '通过NFC UID查询对应的以太坊钱包信息',
    }),
    (0, swagger_1.ApiParam)({
        name: 'uid',
        description: 'NFC卡片UID',
        example: '04:1a:2b:3c:4d:5e:6f',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '成功获取钱包信息',
        type: wallet_response_dto_1.WalletResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: '未找到对应的钱包',
    }),
    __param(0, (0, common_1.Param)('uid')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NFCController.prototype, "getWalletByUID", null);
__decorate([
    (0, common_1.Get)('domain/check'),
    (0, swagger_1.ApiOperation)({
        summary: '检查域名可用性',
        description: '检查指定的.inj域名是否可用',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'domain',
        description: '域名（不包含.inj后缀）',
        example: 'alice',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '成功检查域名可用性',
        schema: {
            type: 'object',
            properties: {
                available: {
                    type: 'boolean',
                    description: '域名是否可用',
                    example: true,
                },
                domain: {
                    type: 'string',
                    description: '完整域名',
                    example: 'alice.inj',
                },
            },
        },
    }),
    __param(0, (0, common_1.Query)('domain')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NFCController.prototype, "checkDomainAvailability", null);
__decorate([
    (0, common_1.Post)('domain/register'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: '注册域名NFT',
        description: '为NFC卡片注册域名NFT（需要初始资金）',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '成功注册域名NFT',
        type: domain_nft_dto_1.DomainNFTResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: '请求参数无效或注册失败',
        schema: {
            type: 'object',
            properties: {
                statusCode: {
                    type: 'number',
                    description: 'HTTP状态码',
                    example: 400,
                },
                message: {
                    type: 'string',
                    description: '错误信息',
                    example: '域名已被占用',
                },
                error: {
                    type: 'string',
                    description: '错误类型',
                    example: 'Bad Request',
                },
            },
        },
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [domain_nft_dto_1.RegisterDomainDto]),
    __metadata("design:returntype", Promise)
], NFCController.prototype, "registerDomainNFT", null);
__decorate([
    (0, common_1.Post)('unbind'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: '解绑NFC卡片',
        description: '解绑NFC卡片，删除钱包记录并进行链上解绑操作',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '成功解绑',
        type: unbind_response_dto_1.UnbindResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: '请求参数错误',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'NFC卡片不存在',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [unbind_nfc_dto_1.UnbindNFCDto]),
    __metadata("design:returntype", Promise)
], NFCController.prototype, "unbindNFC", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({
        summary: '获取钱包统计信息',
        description: '获取系统中钱包的统计数据',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '成功获取统计信息',
        schema: {
            type: 'object',
            properties: {
                totalWallets: {
                    type: 'number',
                    description: '总钱包数量',
                    example: 100,
                },
                walletsWithDomain: {
                    type: 'number',
                    description: '设置了域名的钱包数量',
                    example: 75,
                },
                walletsWithNFT: {
                    type: 'number',
                    description: '拥有NFT的钱包数量',
                    example: 80,
                },
                fundedWallets: {
                    type: 'number',
                    description: '已获得初始资金的钱包数量',
                    example: 90,
                },
                recentRegistrations: {
                    type: 'number',
                    description: '最近24小时注册的钱包数量',
                    example: 5,
                },
            },
        },
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], NFCController.prototype, "getWalletStats", null);
__decorate([
    (0, common_1.Get)('balance/:address'),
    (0, swagger_1.ApiOperation)({
        summary: '查询钱包余额',
        description: '根据钱包地址查询 Injective 链上的余额信息',
    }),
    (0, swagger_1.ApiParam)({
        name: 'address',
        description: '钱包地址（支持 Injective 地址或以太坊地址）',
        example: 'inj1...'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '成功获取余额信息',
        schema: {
            type: 'object',
            properties: {
                inj: {
                    type: 'string',
                    description: 'INJ 余额',
                    example: '100.5000',
                },
                usd: {
                    type: 'string',
                    description: 'USD 估值（如果可用）',
                    example: '2500.00',
                },
            },
        },
    }),
    (0, swagger_1.ApiBadRequestResponse)({
        description: '地址格式无效',
    }),
    __param(0, (0, common_1.Param)('address')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NFCController.prototype, "getWalletBalance", null);
__decorate([
    (0, common_1.Post)('cat/draw'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: '抽卡获得小猫NFT',
        description: '为NFC卡片抽卡获得小猫NFT（需要初始资金）',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '成功抽到小猫NFT',
        type: cat_nft_dto_1.CatNFTResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: '请求参数无效或抽卡失败',
        schema: {
            type: 'object',
            properties: {
                statusCode: {
                    type: 'number',
                    description: 'HTTP状态码',
                    example: 400,
                },
                message: {
                    type: 'string',
                    description: '错误信息',
                    example: '小猫名称已被使用',
                },
                error: {
                    type: 'string',
                    description: '错误类型',
                    example: 'Bad Request',
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: '未找到对应的NFC卡片',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [cat_nft_dto_1.DrawCatNFTDto]),
    __metadata("design:returntype", Promise)
], NFCController.prototype, "drawCatNFT", null);
__decorate([
    (0, common_1.Get)('cat/list/:uid'),
    (0, swagger_1.ApiOperation)({
        summary: '获取用户的小猫NFT列表',
        description: '根据NFC UID获取用户拥有的所有小猫NFT',
    }),
    (0, swagger_1.ApiParam)({
        name: 'uid',
        description: 'NFC卡片UID',
        example: '04:1a:2b:3c:4d:5e:6f',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '成功获取小猫NFT列表',
        type: cat_nft_dto_1.CatNFTListDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: '未找到对应的NFC卡片',
    }),
    __param(0, (0, common_1.Param)('uid')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NFCController.prototype, "getUserCatNFTs", null);
exports.NFCController = NFCController = __decorate([
    (0, swagger_1.ApiTags)('NFC钱包管理'),
    (0, common_1.Controller)('api/nfc'),
    __metadata("design:paramtypes", [nfc_service_1.NFCService])
], NFCController);
let ContractController = class ContractController {
    constructor(nfcService) {
        this.nfcService = nfcService;
    }
    async getContractStatus() {
        return this.nfcService.getContractStatus();
    }
};
exports.ContractController = ContractController;
__decorate([
    (0, common_1.Get)('status'),
    (0, swagger_1.ApiOperation)({
        summary: '获取合约状态',
        description: '检查所有智能合约的连接状态和网络信息',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '成功获取合约状态',
        schema: {
            type: 'object',
            properties: {
                nfcRegistry: {
                    type: 'boolean',
                    description: 'NFC注册表合约状态',
                    example: true,
                },
                domainNFT: {
                    type: 'boolean',
                    description: '域名NFT合约状态',
                    example: true,
                },
                catNFT: {
                    type: 'boolean',
                    description: '小猫NFT合约状态',
                    example: true,
                },
                networkInfo: {
                    type: 'object',
                    description: '网络信息',
                    properties: {
                        network: {
                            type: 'string',
                            example: 'TestnetSentry',
                        },
                        chainId: {
                            type: 'string',
                            example: 'injective-888',
                        },
                        rpcUrl: {
                            type: 'string',
                            example: 'https://testnet.sentry.grpc.injective.network:443',
                        },
                        restUrl: {
                            type: 'string',
                            example: 'https://testnet.sentry.rest.injective.network',
                        },
                    },
                },
            },
        },
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ContractController.prototype, "getContractStatus", null);
exports.ContractController = ContractController = __decorate([
    (0, swagger_1.ApiTags)('合约状态'),
    (0, common_1.Controller)('api/contract'),
    __metadata("design:paramtypes", [nfc_service_1.NFCService])
], ContractController);
//# sourceMappingURL=nfc.controller.js.map