import { ConfigService } from '@nestjs/config';
import { ChatRequestDto } from './dto/chat.dto';
import { ToolsService } from '../tools/tools.service';
export declare class ChatService {
    private readonly configService;
    private readonly toolsService;
    private readonly logger;
    private readonly apiEndpoint;
    constructor(configService: ConfigService, toolsService: ToolsService);
    getAiReply(chatRequestDto: ChatRequestDto): Promise<string>;
}
