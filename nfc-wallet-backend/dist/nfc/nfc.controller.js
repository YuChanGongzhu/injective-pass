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
    async getWalletStats() {
        return this.nfcService.getWalletStats();
    }
};
exports.NFCController = NFCController;
__decorate([
    (0, common_1.Post)('register'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: '注册NFC卡片',
        description: '通过NFC UID注册并生成以太坊钱包，如果已存在则返回现有钱包信息',
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
                walletsWithUsername: {
                    type: 'number',
                    description: '设置了用户名的钱包数量',
                    example: 75,
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
exports.NFCController = NFCController = __decorate([
    (0, swagger_1.ApiTags)('NFC钱包管理'),
    (0, common_1.Controller)('api/nfc'),
    __metadata("design:paramtypes", [nfc_service_1.NFCService])
], NFCController);
//# sourceMappingURL=nfc.controller.js.map