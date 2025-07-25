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
exports.WalletResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class WalletResponseDto {
}
exports.WalletResponseDto = WalletResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Injective钱包地址',
        example: 'inj1...',
    }),
    __metadata("design:type", String)
], WalletResponseDto.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '以太坊格式地址（兼容性）',
        example: '0x742d35Cc6bb7C...',
        required: false,
    }),
    __metadata("design:type", String)
], WalletResponseDto.prototype, "ethAddress", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '公钥 (base64格式)',
        example: 'AuY3ASbyRHfgKNkg7rumWCXzSGCvvgtpR6KKWlpuuQ9Y',
    }),
    __metadata("design:type", String)
], WalletResponseDto.prototype, "publicKey", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'NFC UID',
        example: '04:1a:2b:3c:4d:5e:6f',
    }),
    __metadata("design:type", String)
], WalletResponseDto.prototype, "uid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '用户自定义.inj域名',
        example: 'alice.inj',
        required: false,
    }),
    __metadata("design:type", String)
], WalletResponseDto.prototype, "domain", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'NFT Token ID（如果铸造了NFT）',
        example: '123456',
        required: false,
    }),
    __metadata("design:type", String)
], WalletResponseDto.prototype, "nftTokenId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '是否为新创建的钱包',
        example: true,
    }),
    __metadata("design:type", Boolean)
], WalletResponseDto.prototype, "isNewWallet", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '是否为空白卡（未初始化）',
        example: false,
    }),
    __metadata("design:type", Boolean)
], WalletResponseDto.prototype, "isBlankCard", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '是否已进行初始资金发送',
        example: true,
    }),
    __metadata("design:type", Boolean)
], WalletResponseDto.prototype, "initialFunded", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '创建时间',
        example: '2024-01-01T00:00:00.000Z',
    }),
    __metadata("design:type", Date)
], WalletResponseDto.prototype, "createdAt", void 0);
//# sourceMappingURL=wallet-response.dto.js.map