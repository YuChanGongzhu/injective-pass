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
exports.CatNFTListDto = exports.CatNFTResponseDto = exports.DrawCatNFTDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class DrawCatNFTDto {
}
exports.DrawCatNFTDto = DrawCatNFTDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'NFC卡片UID',
        example: '04:1a:2b:3c:4d:5e:6f',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Length)(1, 255),
    __metadata("design:type", String)
], DrawCatNFTDto.prototype, "nfcUID", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '小猫名称',
        example: 'Lucky Cat',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Length)(1, 100),
    __metadata("design:type", String)
], DrawCatNFTDto.prototype, "catName", void 0);
class CatNFTResponseDto {
}
exports.CatNFTResponseDto = CatNFTResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'NFT代币ID (链上tokenId)',
        example: '1',
    }),
    __metadata("design:type", String)
], CatNFTResponseDto.prototype, "tokenId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '小猫名称',
        example: 'Lucky Cat',
    }),
    __metadata("design:type", String)
], CatNFTResponseDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '稀有度',
        example: 'SR',
        enum: ['R', 'SR', 'SSR', 'UR'],
    }),
    __metadata("design:type", String)
], CatNFTResponseDto.prototype, "rarity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '小猫颜色',
        example: 'green',
        enum: ['black', 'green', 'red', 'orange', 'purple', 'blue', 'rainbow'],
    }),
    __metadata("design:type", String)
], CatNFTResponseDto.prototype, "color", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '图片URL',
        example: 'https://example.com/cat.png',
    }),
    __metadata("design:type", String)
], CatNFTResponseDto.prototype, "imageUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '元数据',
        example: { 'description': 'A lucky cat' },
        required: false,
    }),
    __metadata("design:type", Object)
], CatNFTResponseDto.prototype, "metadata", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '交易哈希',
        example: '0x1234567890abcdef...',
    }),
    __metadata("design:type", String)
], CatNFTResponseDto.prototype, "txHash", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '铸造时间',
        example: '2023-01-01T00:00:00.000Z',
    }),
    __metadata("design:type", Date)
], CatNFTResponseDto.prototype, "mintedAt", void 0);
class CatNFTListDto {
}
exports.CatNFTListDto = CatNFTListDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '小猫NFT列表',
        type: [CatNFTResponseDto],
    }),
    __metadata("design:type", Array)
], CatNFTListDto.prototype, "cats", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '总数',
        example: 5,
    }),
    __metadata("design:type", Number)
], CatNFTListDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '当前页码',
        example: 1,
    }),
    __metadata("design:type", Number)
], CatNFTListDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '总页数',
        example: 1,
    }),
    __metadata("design:type", Number)
], CatNFTListDto.prototype, "totalPages", void 0);
//# sourceMappingURL=cat-nft.dto.js.map