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
    async bindNFCToContract(uid) {
        return this.nfcService.manualBindNFCToContract(uid);
    }
    async checkDomainAvailability(domainPrefix) {
        return this.nfcService.checkDomainAvailability(domainPrefix);
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
    async getUserCatNFTs(uid) {
        return this.nfcService.getUserCatNFTs(uid);
    }
    async getSocialStats(uid) {
        return this.nfcService.getSocialStats(uid);
    }
    async checkInteraction(body) {
        const hasInteracted = await this.nfcService.checkInteraction(body.nfc1, body.nfc2);
        return {
            hasInteracted,
            nfc1: body.nfc1,
            nfc2: body.nfc2
        };
    }
    async socialInteraction(socialInteractionDto) {
        return this.nfcService.socialInteraction(socialInteractionDto);
    }
    async drawCatWithTickets(drawCatWithTicketsDto) {
        return this.nfcService.drawCatWithTickets(drawCatWithTicketsDto);
    }
    async drawCatTraditional(drawCatTraditionalDto) {
        return this.nfcService.drawCatTraditional(drawCatTraditionalDto);
    }
    async getDrawStats(nfcUID) {
        return this.nfcService.getDrawStats(nfcUID);
    }
    async getInteractedNFCs(nfcUID) {
        return this.nfcService.getInteractedNFCs(nfcUID);
    }
};
exports.NFCController = NFCController;
__decorate([
    (0, common_1.Post)('register'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: '注册NFC卡片',
        description: `通过NFC UID注册并生成Injective钱包。功能包括：
        1. 生成新的Injective钱包地址
        2. 自动发送0.1 INJ初始资金
        3. 在链上绑定NFC与钱包的关系
        4. 如果NFC已注册则返回现有钱包信息
        
        注意：NFC UID格式支持十六进制字符串，可使用冒号分隔`
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
    (0, common_1.Post)('bind-to-contract/:uid'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: '手动绑定NFC到合约',
        description: '手动将已注册的NFC绑定到NFCWalletRegistry合约。用于修复绑定失败的情况。',
    }),
    (0, swagger_1.ApiParam)({
        name: 'uid',
        description: 'NFC卡片UID',
        example: '04:1a:2b:3c:4d:5e:6f',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '成功绑定NFC到合约',
        schema: {
            type: 'object',
            properties: {
                success: {
                    type: 'boolean',
                    description: '绑定是否成功',
                    example: true,
                },
                message: {
                    type: 'string',
                    description: '绑定结果消息',
                    example: 'NFC成功绑定到合约',
                },
                transactionHash: {
                    type: 'string',
                    description: '交易哈希',
                    example: '0x1234567890abcdef...',
                },
            },
        },
    }),
    (0, swagger_1.ApiBadRequestResponse)({
        description: 'NFC UID格式无效或NFC未注册',
    }),
    __param(0, (0, common_1.Param)('uid')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NFCController.prototype, "bindNFCToContract", null);
__decorate([
    (0, common_1.Get)('domain/check'),
    (0, swagger_1.ApiOperation)({
        summary: '检查域名可用性',
        description: '检查指定的.inj域名是否可用。系统会自动添加 advx- 前缀，最终域名格式为 advx-{输入}.inj',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'domainPrefix',
        description: '域名后缀（不包含advx-前缀和.inj后缀，长度1-25字符，只允许小写字母、数字、连字符）',
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
    __param(0, (0, common_1.Query)('domainPrefix')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NFCController.prototype, "checkDomainAvailability", null);
__decorate([
    (0, common_1.Post)('domain/register'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: '注册域名NFT',
        description: `为NFC卡片注册.inj域名NFT。要求：
        1. NFC必须已注册并绑定钱包
        2. 域名后缀格式：1-25字符，只能包含小写字母、数字和连字符
        3. 不能以连字符开始或结束，不能有连续连字符
        4. 系统自动添加 advx- 前缀，最终域名格式为 advx-{输入}.inj
        5. 域名全局唯一
        6. 免费注册（测试网络）
        
        成功后将在链上铸造域名NFT并绑定到NFC钱包`
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
                    example: '域名已被占用或格式无效',
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
__decorate([
    (0, common_1.Get)('cat/social/:uid'),
    (0, swagger_1.ApiOperation)({
        summary: '获取NFC的社交统计信息',
        description: '获取NFC的抽卡次数、已互动NFC列表和社交奖励信息',
    }),
    (0, swagger_1.ApiParam)({
        name: 'uid',
        description: 'NFC卡片UID',
        example: '04:1a:2b:3c:4d:5e:6f',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '成功获取社交统计信息',
        type: cat_nft_dto_1.SocialStatsDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: '未找到对应的NFC卡片',
    }),
    __param(0, (0, common_1.Param)('uid')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NFCController.prototype, "getSocialStats", null);
__decorate([
    (0, common_1.Post)('cat/check-interaction'),
    (0, swagger_1.ApiOperation)({
        summary: '检查两个NFC是否已经互动过',
        description: '检查两个NFC卡片是否已经进行过社交抽卡互动',
    }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                nfc1: {
                    type: 'string',
                    description: '第一个NFC UID',
                    example: '04:1a:2b:3c:4d:5e:6f',
                },
                nfc2: {
                    type: 'string',
                    description: '第二个NFC UID',
                    example: '04:2b:3c:4d:5e:6f:7a',
                },
            },
            required: ['nfc1', 'nfc2'],
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '成功检查互动状态',
        schema: {
            type: 'object',
            properties: {
                hasInteracted: {
                    type: 'boolean',
                    description: '是否已经互动过',
                    example: false,
                },
                nfc1: {
                    type: 'string',
                    description: '第一个NFC UID',
                    example: '04:1a:2b:3c:4d:5e:6f',
                },
                nfc2: {
                    type: 'string',
                    description: '第二个NFC UID',
                    example: '04:2b:3c:4d:5e:6f:7a',
                },
            },
        },
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NFCController.prototype, "checkInteraction", null);
__decorate([
    (0, common_1.Post)('social-interaction'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: '社交互动获取抽卡次数',
        description: `通过NFC社交互动获取抽卡券。功能包括：
        1. 验证两个NFC都已注册
        2. 确保用户不与自己互动
        3. 防止重复互动刷券
        4. 成功互动后获得1张抽卡券
        
        注意：每对NFC只能互动一次`
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '社交互动成功',
        type: cat_nft_dto_1.SocialInteractionResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: '互动失败（重复互动、自己与自己互动等）',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [cat_nft_dto_1.SocialInteractionDto]),
    __metadata("design:returntype", Promise)
], NFCController.prototype, "socialInteraction", null);
__decorate([
    (0, common_1.Post)('draw-cat-with-tickets'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: '使用抽卡券抽取猫咪NFT',
        description: `使用抽卡券抽取猫咪NFT。功能包括：
        1. 消耗1张抽卡券
        2. 基于社交奖励提升稀有度概率
        3. 随机生成猫咪属性（颜色、稀有度）
        4. 铸造NFT到用户钱包
        
        稀有度：R(65%), SR(25%), SSR(8%), UR(2%)
        社交互动越多，稀有度概率越高`
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '抽卡成功',
        type: cat_nft_dto_1.CatNFTResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: '抽卡失败（无抽卡券、NFC未注册等）',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [cat_nft_dto_1.DrawCatWithTicketsDto]),
    __metadata("design:returntype", Promise)
], NFCController.prototype, "drawCatWithTickets", null);
__decorate([
    (0, common_1.Post)('draw-cat-traditional'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: '传统付费抽卡',
        description: `付费抽取猫咪NFT。功能包括：
        1. 直接支付抽卡费用
        2. 标准稀有度概率（不受社交奖励影响）
        3. 随机生成猫咪属性
        4. 铸造NFT到用户钱包
        
        稀有度：R(65%), SR(25%), SSR(8%), UR(2%)`
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '抽卡成功',
        type: cat_nft_dto_1.CatNFTResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: '抽卡失败（支付不足、NFC未注册等）',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [cat_nft_dto_1.DrawCatTraditionalDto]),
    __metadata("design:returntype", Promise)
], NFCController.prototype, "drawCatTraditional", null);
__decorate([
    (0, common_1.Get)('draw-stats/:nfcUID'),
    (0, swagger_1.ApiOperation)({
        summary: '获取NFC抽卡统计信息',
        description: '获取指定NFC的抽卡次数统计和社交奖励信息',
    }),
    (0, swagger_1.ApiParam)({
        name: 'nfcUID',
        description: 'NFC卡片UID',
        example: '04:1a:2b:3c:4d:5e:6f',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '成功获取抽卡统计',
        type: cat_nft_dto_1.DrawStatsDto,
    }),
    __param(0, (0, common_1.Param)('nfcUID')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NFCController.prototype, "getDrawStats", null);
__decorate([
    (0, common_1.Get)('interacted-nfcs/:nfcUID'),
    (0, swagger_1.ApiOperation)({
        summary: '获取已互动的NFC列表',
        description: '获取指定NFC已经互动过的其他NFC列表',
    }),
    (0, swagger_1.ApiParam)({
        name: 'nfcUID',
        description: 'NFC卡片UID',
        example: '04:1a:2b:3c:4d:5e:6f',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '成功获取已互动NFC列表',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                data: {
                    type: 'object',
                    properties: {
                        interactedNFCs: {
                            type: 'array',
                            items: { type: 'string' },
                            example: ['04:aa:bb:cc:dd:ee:ff', '04:11:22:33:44:55:66']
                        }
                    }
                }
            }
        }
    }),
    __param(0, (0, common_1.Param)('nfcUID')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NFCController.prototype, "getInteractedNFCs", null);
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