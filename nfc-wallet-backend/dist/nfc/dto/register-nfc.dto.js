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
exports.BindNFCDto = exports.RegisterNFCDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class RegisterNFCDto {
}
exports.RegisterNFCDto = RegisterNFCDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'NFC卡片的唯一标识符',
        example: '04:1a:2b:3c:4d:5e:6f',
        minLength: 1,
        maxLength: 255,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Length)(1, 255),
    __metadata("design:type", String)
], RegisterNFCDto.prototype, "uid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '要绑定到的现有用户地址（可选，如果不提供则创建新用户）',
        example: 'inj1xwve656jwedjne0dtars3m406g2zh92uqpmkfs',
        required: false
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RegisterNFCDto.prototype, "userAddress", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'NFC卡片昵称（可选）',
        example: '我的主卡',
        required: false
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RegisterNFCDto.prototype, "nickname", void 0);
class BindNFCDto {
}
exports.BindNFCDto = BindNFCDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'NFC卡片UID',
        example: '04:1a:2b:3c:4d:5e:6f'
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], BindNFCDto.prototype, "uid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '用户Injective地址',
        example: 'inj1xwve656jwedjne0dtars3m406g2zh92uqpmkfs'
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], BindNFCDto.prototype, "userAddress", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'NFC卡片昵称（可选）',
        example: '工作卡',
        required: false
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], BindNFCDto.prototype, "nickname", void 0);
//# sourceMappingURL=register-nfc.dto.js.map