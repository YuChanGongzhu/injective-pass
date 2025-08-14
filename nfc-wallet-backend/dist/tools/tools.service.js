"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ToolsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolsService = void 0;
const common_1 = require("@nestjs/common");
const tools_definition_1 = require("./tools.definition");
let ToolsService = ToolsService_1 = class ToolsService {
    constructor() {
        this.logger = new common_1.Logger(ToolsService_1.name);
    }
    getToolDefinitions() {
        return tools_definition_1.tools;
    }
    async get_injective_activities() {
        this.logger.log('Executing tool: get_injective_activities');
        const activities = [
            {
                name: 'Injective Global Hackathon 2025',
                type: '活动',
                description: '一个面向全球开发者的线上黑客松，旨在激励基于Injective的创新应用。',
                reward: '总奖池 $100,000',
            },
            {
                name: '交易大师赛 第3季',
                type: '任务',
                description: '在指定的DEX上完成交易任务，瓜分每日奖池。',
                reward: '每日1,000 INJ代币',
            },
        ];
        return JSON.stringify(activities);
    }
};
exports.ToolsService = ToolsService;
exports.ToolsService = ToolsService = ToolsService_1 = __decorate([
    (0, common_1.Injectable)()
], ToolsService);
//# sourceMappingURL=tools.service.js.map