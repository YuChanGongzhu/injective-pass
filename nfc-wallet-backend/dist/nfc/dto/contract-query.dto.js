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
exports.UserNFTInfoDto = exports.AvailabilityResponseDto = exports.CatNameAvailabilityCheckDto = exports.DomainAvailabilityCheckDto = exports.ContractStatusDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class ContractStatusDto {
}
exports.ContractStatusDto = ContractStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'NFCWalletRegistry 合约状态',
        example: true,
    }),
    __metadata("design:type", Boolean)
], ContractStatusDto.prototype, "nfcRegistry", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'INJDomainNFT 合约状态',
        example: true,
    }),
    __metadata("design:type", Boolean)
], ContractStatusDto.prototype, "domainNFT", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'CatNFT 合约状态',
        example: true,
    }),
    __metadata("design:type", Boolean)
], ContractStatusDto.prototype, "catNFT", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '网络信息',
        example: {
            network: 'TestnetSentry',
            chainId: 'injective-888',
            rpcUrl: 'https://k8s.testnet.json-rpc.injective.network/',
            restUrl: 'https://k8s.testnet.tm.injective.network/'
        },
    }),
    __metadata("design:type", Object)
], ContractStatusDto.prototype, "networkInfo", void 0);
class DomainAvailabilityCheckDto {
}
exports.DomainAvailabilityCheckDto = DomainAvailabilityCheckDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '域名前缀',
        example: 'alice',
    }),
    __metadata("design:type", String)
], DomainAvailabilityCheckDto.prototype, "domainPrefix", void 0);
class CatNameAvailabilityCheckDto {
}
exports.CatNameAvailabilityCheckDto = CatNameAvailabilityCheckDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '小猫名称',
        example: 'Lucky Cat',
    }),
    __metadata("design:type", String)
], CatNameAvailabilityCheckDto.prototype, "catName", void 0);
class AvailabilityResponseDto {
}
exports.AvailabilityResponseDto = AvailabilityResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '是否可用',
        example: true,
    }),
    __metadata("design:type", Boolean)
], AvailabilityResponseDto.prototype, "available", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '检查的名称',
        example: 'alice.inj',
    }),
    __metadata("design:type", String)
], AvailabilityResponseDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '当前所有者地址（如果已被占用）',
        example: 'inj1abc123...',
        required: false,
    }),
    __metadata("design:type", String)
], AvailabilityResponseDto.prototype, "ownerAddress", void 0);
class UserNFTInfoDto {
}
exports.UserNFTInfoDto = UserNFTInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '用户域名信息',
        example: {
            hasDomain: true,
            domain: 'alice.inj',
            tokenId: '1'
        },
        required: false,
    }),
    __metadata("design:type", Object)
], UserNFTInfoDto.prototype, "domainInfo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '用户小猫NFT列表',
        example: {
            cats: [
                {
                    tokenId: '1',
                    name: 'Lucky Cat',
                    rarity: 'SR',
                    color: 'green',
                    mintedAt: '2023-01-01T00:00:00.000Z'
                }
            ],
            total: 1
        },
    }),
    __metadata("design:type", Object)
], UserNFTInfoDto.prototype, "catInfo", void 0);
//# sourceMappingURL=contract-query.dto.js.map