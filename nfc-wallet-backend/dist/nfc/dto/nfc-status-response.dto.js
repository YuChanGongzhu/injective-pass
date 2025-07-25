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
exports.NFCStatusResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class NFCStatusResponseDto {
}
exports.NFCStatusResponseDto = NFCStatusResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'NFC卡片UID',
        example: '04:1a:2b:3c:4d:5e:6f',
    }),
    __metadata("design:type", String)
], NFCStatusResponseDto.prototype, "uid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '卡片状态码',
        example: 1,
        enum: [0, 1, 2],
    }),
    __metadata("design:type", Number)
], NFCStatusResponseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '状态描述',
        example: 'bound',
        enum: ['blank', 'bound', 'frozen'],
    }),
    __metadata("design:type", String)
], NFCStatusResponseDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '是否为空白卡片',
        example: false,
    }),
    __metadata("design:type", Boolean)
], NFCStatusResponseDto.prototype, "isBlank", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '是否已绑定',
        example: true,
    }),
    __metadata("design:type", Boolean)
], NFCStatusResponseDto.prototype, "isBound", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '绑定的钱包地址（如果已绑定）',
        example: 'inj1abc123...',
        required: false,
    }),
    __metadata("design:type", String)
], NFCStatusResponseDto.prototype, "walletAddress", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'NFT Token ID（如果存在）',
        example: 1,
        required: false,
    }),
    __metadata("design:type", Number)
], NFCStatusResponseDto.prototype, "nftTokenId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '历史绑定次数',
        example: 2,
    }),
    __metadata("design:type", Number)
], NFCStatusResponseDto.prototype, "bindingHistory", void 0);
//# sourceMappingURL=nfc-status-response.dto.js.map