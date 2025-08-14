export declare class HealthController {
    getHealth(): {
        status: string;
        timestamp: string;
        service: string;
        version: string;
    };
    getApiHealth(): {
        status: string;
        timestamp: string;
        service: string;
        version: string;
    };
}
