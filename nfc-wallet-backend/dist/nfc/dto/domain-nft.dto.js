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
exports.DomainAvailabilityDto = exports.DomainNFTResponseDto = exports.RegisterDomainDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class RegisterDomainDto {
}
exports.RegisterDomainDto = RegisterDomainDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'NFC卡片的唯一标识符',
        example: '04:f3:a1:8a:b2:5d:80',
        minLength: 1,
        maxLength: 255,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Length)(1, 255),
    __metadata("design:type", String)
], RegisterDomainDto.prototype, "uid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '域名后缀（不包含advx-前缀和.inj后缀），1-25字符，只能包含小写字母、数字和连字符，不能以连字符开始或结束，不能有连续连字符。系统会自动添加advx-前缀',
        example: 'alice',
        minLength: 1,
        maxLength: 25,
        pattern: '^[a-z0-9]+([a-z0-9-]*[a-z0-9])?$',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Length)(1, 25),
    (0, class_validator_1.Matches)(/^[a-z0-9]+([a-z0-9-]*[a-z0-9])?$/, {
        message: '域名格式无效：只能包含小写字母、数字和连字符，不能以连字符开始或结束，不能有连续连字符'
    }),
    __metadata("design:type", String)
], RegisterDomainDto.prototype, "domainPrefix", void 0);
class DomainNFTResponseDto {
}
exports.DomainNFTResponseDto = DomainNFTResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '注册的域名',
        example: 'alice.inj',
    }),
    __metadata("design:type", String)
], DomainNFTResponseDto.prototype, "domain", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '域名NFT代币ID (链上tokenId)',
        example: '1',
    }),
    __metadata("design:type", String)
], DomainNFTResponseDto.prototype, "tokenId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '交易哈希',
        example: '0x1234567890abcdef...',
    }),
    __metadata("design:type", String)
], DomainNFTResponseDto.prototype, "txHash", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '注册时间',
        example: '2023-01-01T00:00:00.000Z',
    }),
    __metadata("design:type", Date)
], DomainNFTResponseDto.prototype, "registeredAt", void 0);
class DomainAvailabilityDto {
}
exports.DomainAvailabilityDto = DomainAvailabilityDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '完整域名',
        example: 'alice.inj',
    }),
    __metadata("design:type", String)
], DomainAvailabilityDto.prototype, "domain", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '域名是否可用',
        example: true,
    }),
    __metadata("design:type", Boolean)
], DomainAvailabilityDto.prototype, "available", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '域名所有者地址（如果已被占用）',
        example: 'inj1xwve656jwedjne0dtars3m406g2zh92uqpmkfs',
        required: false,
    }),
    __metadata("design:type", String)
], DomainAvailabilityDto.prototype, "ownerAddress", void 0);
//# sourceMappingURL=domain-nft.dto.js.map