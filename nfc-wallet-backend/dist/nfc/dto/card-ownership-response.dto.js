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
exports.CardOwnershipResponseDto = exports.OwnershipRecord = void 0;
const swagger_1 = require("@nestjs/swagger");
class OwnershipRecord {
}
exports.OwnershipRecord = OwnershipRecord;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '所有者地址',
        example: 'inj1abc123...',
    }),
    __metadata("design:type", String)
], OwnershipRecord.prototype, "owner", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '开始拥有时间戳',
        example: 1640995200,
    }),
    __metadata("design:type", Number)
], OwnershipRecord.prototype, "fromTimestamp", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '结束拥有时间戳 (0表示当前所有者)',
        example: 1641081600,
    }),
    __metadata("design:type", Number)
], OwnershipRecord.prototype, "toTimestamp", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '转移原因',
        example: 'transfer',
        enum: ['mint', 'transfer', 'unbind'],
    }),
    __metadata("design:type", String)
], OwnershipRecord.prototype, "transferReason", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '拥有时长 (秒)',
        example: 86400,
    }),
    __metadata("design:type", Number)
], OwnershipRecord.prototype, "duration", void 0);
class CardOwnershipResponseDto {
}
exports.CardOwnershipResponseDto = CardOwnershipResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'NFC卡片UID',
        example: '04:1a:2b:3c:4d:5e:6f',
    }),
    __metadata("design:type", String)
], CardOwnershipResponseDto.prototype, "nfcUID", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'NFT Token ID',
        example: 1,
    }),
    __metadata("design:type", Number)
], CardOwnershipResponseDto.prototype, "tokenId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '当前所有者地址',
        example: 'inj1abc123...',
    }),
    __metadata("design:type", String)
], CardOwnershipResponseDto.prototype, "currentOwner", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '历史所有者数量',
        example: 3,
    }),
    __metadata("design:type", Number)
], CardOwnershipResponseDto.prototype, "ownershipCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '历史所有者记录',
        type: [OwnershipRecord],
    }),
    __metadata("design:type", Array)
], CardOwnershipResponseDto.prototype, "ownershipHistory", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '卡片创建时间',
        example: 1640995200,
    }),
    __metadata("design:type", Number)
], CardOwnershipResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '最后转移时间',
        example: 1641081600,
    }),
    __metadata("design:type", Number)
], CardOwnershipResponseDto.prototype, "lastTransferAt", void 0);
//# sourceMappingURL=card-ownership-response.dto.js.map