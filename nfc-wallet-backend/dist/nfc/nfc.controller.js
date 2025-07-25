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
exports.NFCController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const nfc_service_1 = require("./nfc.service");
const register_nfc_dto_1 = require("./dto/register-nfc.dto");
const unbind_nfc_dto_1 = require("./dto/unbind-nfc.dto");
const wallet_response_dto_1 = require("./dto/wallet-response.dto");
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
    async createDomain(body) {
        return this.nfcService.createDomain(body.uid, body.domainName);
    }
    async unbindNFC(unbindNFCDto) {
        return this.nfcService.unbindNFC(unbindNFCDto);
    }
    async getWalletStats() {
        return this.nfcService.getWalletStats();
    }
    async getWalletBalance(address) {
        return this.nfcService.getWalletBalance(address);
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
    (0, common_1.Post)('domain/create'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: '创建.inj域名',
        description: '为指定的NFC卡片创建.inj域名',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '成功创建域名',
        schema: {
            type: 'object',
            properties: {
                success: {
                    type: 'boolean',
                    description: '是否成功',
                    example: true,
                },
                domain: {
                    type: 'string',
                    description: '创建的域名',
                    example: 'alice.inj',
                },
                error: {
                    type: 'string',
                    description: '错误信息（如果失败）',
                },
            },
        },
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NFCController.prototype, "createDomain", null);
__decorate([
    (0, common_1.Post)('unbind'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: '解绑NFC卡片',
        description: '解绑NFC卡片，删除钱包记录并销毁NFT',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '成功解绑',
        schema: {
            type: 'object',
            properties: {
                success: {
                    type: 'boolean',
                    description: '是否成功',
                    example: true,
                },
                nfcUnbound: {
                    type: 'boolean',
                    description: 'NFC是否已解绑',
                    example: true,
                },
                nftBurned: {
                    type: 'boolean',
                    description: 'NFT是否已销毁',
                    example: true,
                },
                message: {
                    type: 'string',
                    description: '操作结果消息',
                    example: '解绑成功',
                },
            },
        },
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
exports.NFCController = NFCController = __decorate([
    (0, swagger_1.ApiTags)('NFC钱包管理'),
    (0, common_1.Controller)('api/nfc'),
    __metadata("design:paramtypes", [nfc_service_1.NFCService])
], NFCController);
//# sourceMappingURL=nfc.controller.js.map