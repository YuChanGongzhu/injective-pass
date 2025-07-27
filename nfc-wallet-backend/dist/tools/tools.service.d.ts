export declare class ToolsService {
    private readonly logger;
    getToolDefinitions(): {
        type: string;
        function: {
            name: string;
            description: string;
            parameters: {
                type: string;
                properties: {};
                required: any[];
            };
        };
    }[];
    get_injective_activities(): Promise<string>;
}
