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
exports.ChatResponseDto = exports.ChatRequestDto = exports.MessageDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class ToolCallDto {
}
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ToolCallDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ToolCallDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], ToolCallDto.prototype, "function", void 0);
class MessageDto {
}
exports.MessageDto = MessageDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'user', description: '消息发送者的角色' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['user', 'assistant', 'system', 'tool']),
    __metadata("design:type", String)
], MessageDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '你好呀！', description: '消息内容' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], MessageDto.prototype, "content", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: '工具调用ID' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], MessageDto.prototype, "tool_call_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [ToolCallDto], required: false, description: 'AI请求的工具调用' }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ToolCallDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], MessageDto.prototype, "tool_calls", void 0);
class ChatRequestDto {
}
exports.ChatRequestDto = ChatRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [MessageDto], description: '包含上下文的完整对话历史', example: [{ role: 'user', content: '最近 Injective 有什么活动吗？' }] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => MessageDto),
    __metadata("design:type", Array)
], ChatRequestDto.prototype, "messages", void 0);
class ChatResponseDto {
}
exports.ChatResponseDto = ChatResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '喵~ 最近有一个超酷的交易大赛哦！', description: 'AI生成的回复' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ChatResponseDto.prototype, "reply", void 0);
//# sourceMappingURL=chat.dto.js.map