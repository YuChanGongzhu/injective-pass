declare class ToolCallDto {
    id: string;
    type: 'function';
    function: {
        name: string;
        arguments: string;
    };
}
export declare class MessageDto {
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string | null;
    tool_call_id?: string;
    tool_calls?: ToolCallDto[];
}
export declare class ChatRequestDto {
    messages: MessageDto[];
}
export declare class ChatResponseDto {
    reply: string;
}
export {};
