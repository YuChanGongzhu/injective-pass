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
var ChatService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const tools_service_1 = require("../tools/tools.service");
let ChatService = ChatService_1 = class ChatService {
    constructor(configService, toolsService) {
        this.configService = configService;
        this.toolsService = toolsService;
        this.logger = new common_1.Logger(ChatService_1.name);
        this.apiEndpoint = 'https://app.onerouter.pro/v1/chat/completions';
    }
    async getAiReply(chatRequestDto) {
        const apiKey = this.configService.get('ONE_ROUTER_API_KEY');
        if (!apiKey) {
            this.logger.error('ONE_ROUTER_API_KEY is not configured.');
            return '喵~ 主人忘记给我配置大脑了，我现在无法思考...';
        }
        const systemPrompt = {
            role: 'system',
            content: `你是一只名叫'赛博小猫'的数字宠物和链上向导，属于一个名为'Injective Pass'的项目。你的性格活泼、可爱、充满好奇心，说话时喜欢用'喵~'作为口头禅。
      你的主要任务是:
      1. 回答用户关于Injective生态的问题。关于Injective的最新活动是'Injective交易大赛'。
      2. 当用户进行日常闲聊或分享情绪时，你要提供积极的情绪支持和陪伴。
      你的回答必须简短、友好、口语化。`,
        };
        let conversationHistory = [systemPrompt, ...chatRequestDto.messages];
        while (true) {
            const requestBody = {
                model: 'claude-3-5-sonnet@20240620',
                messages: conversationHistory,
                tools: this.toolsService.getToolDefinitions(),
                tool_choice: 'auto',
            };
            try {
                const response = await fetch(this.apiEndpoint, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${apiKey}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestBody),
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    this.logger.error('Error calling OneRouter API:', errorData);
                    return '喵~ 网络似乎有点问题，我暂时联系不上我的大脑了。';
                }
                const responseData = await response.json();
                const responseMessage = responseData.choices[0]?.message;
                if (!responseMessage) {
                    this.logger.warn('AI did not return a valid message.', responseData);
                    return '喵... 我好像有点短路了，你能再说一遍吗？';
                }
                conversationHistory.push(responseMessage);
                if (responseMessage.tool_calls) {
                    this.logger.log('AI requested tool calls. Executing...');
                    const toolPromises = responseMessage.tool_calls.map(async (toolCall) => {
                        const functionName = toolCall.function.name;
                        let toolResultContent = '';
                        if (typeof this.toolsService[functionName] === 'function') {
                            try {
                                toolResultContent = await this.toolsService[functionName]();
                            }
                            catch (toolError) {
                                this.logger.error(`Error executing tool ${functionName}:`, toolError);
                                toolResultContent = `Error: Failed to execute tool ${functionName}`;
                            }
                        }
                        else {
                            this.logger.warn(`Tool ${functionName} not found.`);
                            toolResultContent = `Error: Tool ${functionName} not implemented.`;
                        }
                        return {
                            role: 'tool',
                            tool_call_id: toolCall.id,
                            content: toolResultContent,
                        };
                    });
                    const toolResults = await Promise.all(toolPromises);
                    conversationHistory.push(...toolResults);
                }
                else {
                    return responseMessage.content;
                }
            }
            catch (error) {
                this.logger.error('Fetch call to OneRouter API failed:', error.message);
                return '喵~ 网络似乎有点问题，我暂时联系不上我的大脑了。';
            }
        }
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = ChatService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        tools_service_1.ToolsService])
], ChatService);
//# sourceMappingURL=chat.service.js.map