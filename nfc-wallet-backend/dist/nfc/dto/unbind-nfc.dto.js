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
exports.UnbindNFCDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class UnbindNFCDto {
    constructor() {
        this.resetToBlank = true;
    }
}
exports.UnbindNFCDto = UnbindNFCDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'NFC卡片UID',
        example: '04:1a:2b:3c:4d:5e:6f',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UnbindNFCDto.prototype, "uid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '是否重置为空白卡片状态',
        example: true,
        required: false,
        default: true,
    }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UnbindNFCDto.prototype, "resetToBlank", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '钱包所有者签名（用于验证授权）',
        example: '0x...',
        required: false,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UnbindNFCDto.prototype, "ownerSignature", void 0);
//# sourceMappingURL=unbind-nfc.dto.js.map