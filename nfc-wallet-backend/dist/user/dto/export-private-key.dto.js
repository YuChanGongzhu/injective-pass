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
exports.PrivateKeyResponseDto = exports.ExportPrivateKeyDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class ExportPrivateKeyDto {
}
exports.ExportPrivateKeyDto = ExportPrivateKeyDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'NFC卡片的唯一标识符',
        example: '04:1a:2b:3c:4d:5e:6f',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Length)(1, 255),
    __metadata("design:type", String)
], ExportPrivateKeyDto.prototype, "uid", void 0);
class PrivateKeyResponseDto {
}
exports.PrivateKeyResponseDto = PrivateKeyResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '用户地址',
        example: 'inj1xwve656jwedjne0dtars3m406g2zh92uqpmkfs'
    }),
    __metadata("design:type", String)
], PrivateKeyResponseDto.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '私钥（十六进制格式）',
        example: '0x1234567890abcdef...'
    }),
    __metadata("design:type", String)
], PrivateKeyResponseDto.prototype, "privateKey", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '导出时间',
        example: '2023-01-01T00:00:00.000Z'
    }),
    __metadata("design:type", Date)
], PrivateKeyResponseDto.prototype, "exportedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '安全警告',
        example: '请妥善保管您的私钥，不要与任何人分享'
    }),
    __metadata("design:type", String)
], PrivateKeyResponseDto.prototype, "warning", void 0);
//# sourceMappingURL=export-private-key.dto.js.map