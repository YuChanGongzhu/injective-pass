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
exports.TransactionResponseDto = exports.WalletResponseDto = exports.TransactionDto = exports.NFCCardDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class NFCCardDto {
}
exports.NFCCardDto = NFCCardDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'NFC卡片UID',
        example: '04:f3:a1:8a:b2:5d:80:abc123'
    }),
    __metadata("design:type", String)
], NFCCardDto.prototype, "uid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '卡片昵称',
        example: '我的主卡',
        required: false
    }),
    __metadata("design:type", String)
], NFCCardDto.prototype, "nickname", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '卡片是否激活',
        example: true
    }),
    __metadata("design:type", Boolean)
], NFCCardDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '卡片创建时间',
        example: '2023-01-01T00:00:00.000Z'
    }),
    __metadata("design:type", Date)
], NFCCardDto.prototype, "createdAt", void 0);
class TransactionDto {
}
exports.TransactionDto = TransactionDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '交易哈希',
        example: '0x1234567890abcdef...'
    }),
    __metadata("design:type", String)
], TransactionDto.prototype, "txHash", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '交易类型',
        enum: ['SEND', 'RECEIVE', 'INITIAL_FUND', 'NFT_MINT', 'DOMAIN_REG', 'SWAP', 'STAKE', 'UNSTAKE']
    }),
    __metadata("design:type", String)
], TransactionDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '交易金额',
        example: '0.1',
        required: false
    }),
    __metadata("design:type", String)
], TransactionDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '代币符号',
        example: 'INJ',
        required: false
    }),
    __metadata("design:type", String)
], TransactionDto.prototype, "tokenSymbol", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '交易状态',
        enum: ['PENDING', 'CONFIRMED', 'FAILED', 'CANCELLED']
    }),
    __metadata("design:type", String)
], TransactionDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '创建时间',
        example: '2023-01-01T00:00:00.000Z'
    }),
    __metadata("design:type", Date)
], TransactionDto.prototype, "createdAt", void 0);
class WalletResponseDto {
}
exports.WalletResponseDto = WalletResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Injective地址',
        example: 'inj1...',
    }),
    __metadata("design:type", String)
], WalletResponseDto.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '以太坊地址',
        example: '0x...',
    }),
    __metadata("design:type", String)
], WalletResponseDto.prototype, "ethAddress", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '公钥',
        example: 'A2584XcrtLulyxpZsJ8AQuxl/tPgRcHKuo2PcRcQX8Ni',
    }),
    __metadata("design:type", String)
], WalletResponseDto.prototype, "publicKey", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '.inj域名',
        example: 'alice.inj',
        required: false,
    }),
    __metadata("design:type", String)
], WalletResponseDto.prototype, "domain", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'NFT代币ID',
        example: '12345',
        required: false,
    }),
    __metadata("design:type", String)
], WalletResponseDto.prototype, "nftTokenId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '是否是新创建的钱包',
        example: true,
    }),
    __metadata("design:type", Boolean)
], WalletResponseDto.prototype, "isNewWallet", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '是否已获得初始资金',
        example: false,
    }),
    __metadata("design:type", Boolean)
], WalletResponseDto.prototype, "initialFunded", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '关联的NFC卡片列表',
        type: [NFCCardDto]
    }),
    __metadata("design:type", Array)
], WalletResponseDto.prototype, "nfcCards", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '最近的交易记录',
        type: [TransactionDto]
    }),
    __metadata("design:type", Array)
], WalletResponseDto.prototype, "recentTransactions", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '创建时间',
        example: '2023-01-01T00:00:00.000Z',
    }),
    __metadata("design:type", Date)
], WalletResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '更新时间',
        example: '2023-01-01T00:00:00.000Z',
    }),
    __metadata("design:type", Date)
], WalletResponseDto.prototype, "updatedAt", void 0);
class TransactionResponseDto {
}
exports.TransactionResponseDto = TransactionResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '操作是否成功',
        example: true
    }),
    __metadata("design:type", Boolean)
], TransactionResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '交易哈希',
        example: '0x1234567890abcdef...',
        required: false
    }),
    __metadata("design:type", String)
], TransactionResponseDto.prototype, "txHash", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '错误信息',
        example: '余额不足',
        required: false
    }),
    __metadata("design:type", String)
], TransactionResponseDto.prototype, "error", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '交易状态',
        enum: ['PENDING', 'CONFIRMED', 'FAILED', 'CANCELLED'],
        required: false
    }),
    __metadata("design:type", String)
], TransactionResponseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '区块高度',
        example: '123456',
        required: false
    }),
    __metadata("design:type", String)
], TransactionResponseDto.prototype, "blockHeight", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '消耗的gas',
        example: '21000',
        required: false
    }),
    __metadata("design:type", String)
], TransactionResponseDto.prototype, "gasUsed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '交易手续费',
        example: '0.001',
        required: false
    }),
    __metadata("design:type", String)
], TransactionResponseDto.prototype, "fee", void 0);
//# sourceMappingURL=wallet-response.dto.js.map