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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const user_service_1 = require("./user.service");
const update_domain_dto_1 = require("./dto/update-domain.dto");
const user_profile_dto_1 = require("./dto/user-profile.dto");
let UserController = class UserController {
    constructor(userService) {
        this.userService = userService;
    }
    async updateDomain(updateDomainDto) {
        return this.userService.updateDomain(updateDomainDto);
    }
    async getUserProfile(uid) {
        return this.userService.getUserProfile(uid);
    }
    async checkDomainAvailability(domainPrefix) {
        return this.userService.checkDomainAvailability(domainPrefix);
    }
    async removeDomain(uid) {
        return this.userService.removeDomain(uid);
    }
    async getUserByDomain(domain) {
        return this.userService.getUserByDomain(domain);
    }
    async getUserList(page, limit) {
        return this.userService.getUserList(page || 1, limit || 20);
    }
};
exports.UserController = UserController;
__decorate([
    (0, common_1.Put)('domain'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: '更新.inj域名',
        description: '为指定的NFC UID设置自定义.inj域名，域名必须唯一',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '成功更新.inj域名',
        type: user_profile_dto_1.UserProfileDto,
    }),
    (0, swagger_1.ApiBadRequestResponse)({
        description: '域名前缀格式无效',
    }),
    (0, swagger_1.ApiConflictResponse)({
        description: '该.inj域名已被占用',
    }),
    (0, swagger_1.ApiNotFoundResponse)({
        description: '未找到对应的钱包',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [update_domain_dto_1.UpdateDomainDto]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "updateDomain", null);
__decorate([
    (0, common_1.Get)('profile/:uid'),
    (0, swagger_1.ApiOperation)({
        summary: '获取用户资料',
        description: '根据NFC UID获取用户的详细资料',
    }),
    (0, swagger_1.ApiParam)({
        name: 'uid',
        description: 'NFC卡片UID',
        example: '04:1a:2b:3c:4d:5e:6f',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '成功获取用户资料',
        type: user_profile_dto_1.UserProfileDto,
    }),
    (0, swagger_1.ApiNotFoundResponse)({
        description: '未找到对应的用户',
    }),
    __param(0, (0, common_1.Param)('uid')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getUserProfile", null);
__decorate([
    (0, common_1.Get)('check-domain/:domainPrefix'),
    (0, swagger_1.ApiOperation)({
        summary: '检查.inj域名可用性',
        description: '检查指定的.inj域名前缀是否可用',
    }),
    (0, swagger_1.ApiParam)({
        name: 'domainPrefix',
        description: '要检查的域名前缀（不包含.inj后缀）',
        example: 'alice',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '成功检查域名可用性',
        schema: {
            type: 'object',
            properties: {
                available: {
                    type: 'boolean',
                    description: '域名是否可用',
                    example: true,
                },
            },
        },
    }),
    (0, swagger_1.ApiBadRequestResponse)({
        description: '域名前缀格式无效',
    }),
    __param(0, (0, common_1.Param)('domainPrefix')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "checkDomainAvailability", null);
__decorate([
    (0, common_1.Delete)('domain/:uid'),
    (0, swagger_1.ApiOperation)({
        summary: '删除.inj域名',
        description: '删除指定UID的.inj域名',
    }),
    (0, swagger_1.ApiParam)({
        name: 'uid',
        description: 'NFC卡片UID',
        example: '04:1a:2b:3c:4d:5e:6f',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '成功删除.inj域名',
        type: user_profile_dto_1.UserProfileDto,
    }),
    (0, swagger_1.ApiNotFoundResponse)({
        description: '未找到对应的钱包',
    }),
    __param(0, (0, common_1.Param)('uid')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "removeDomain", null);
__decorate([
    (0, common_1.Get)('search/:domain'),
    (0, swagger_1.ApiOperation)({
        summary: '根据.inj域名查找用户',
        description: '通过.inj域名查找对应的用户信息',
    }),
    (0, swagger_1.ApiParam)({
        name: 'domain',
        description: '.inj域名',
        example: 'alice.inj',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '成功找到用户',
        type: user_profile_dto_1.UserProfileDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: '未找到对应的用户',
    }),
    __param(0, (0, common_1.Param)('domain')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getUserByDomain", null);
__decorate([
    (0, common_1.Get)('list'),
    (0, swagger_1.ApiOperation)({
        summary: '获取用户列表',
        description: '获取分页的用户列表',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'page',
        required: false,
        description: '页码',
        example: 1,
    }),
    (0, swagger_1.ApiQuery)({
        name: 'limit',
        required: false,
        description: '每页数量',
        example: 20,
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '成功获取用户列表',
        schema: {
            type: 'object',
            properties: {
                users: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/UserProfileDto' },
                },
                total: {
                    type: 'number',
                    description: '总用户数',
                    example: 100,
                },
                page: {
                    type: 'number',
                    description: '当前页码',
                    example: 1,
                },
                totalPages: {
                    type: 'number',
                    description: '总页数',
                    example: 5,
                },
            },
        },
    }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getUserList", null);
exports.UserController = UserController = __decorate([
    (0, swagger_1.ApiTags)('用户管理'),
    (0, common_1.Controller)('api/user'),
    __metadata("design:paramtypes", [user_service_1.UserService])
], UserController);
//# sourceMappingURL=user.controller.js.map