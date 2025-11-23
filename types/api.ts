
export type ApiProvider = 'gemini-official' | 'gemini-custom' | 'openai';

export interface ApiConfig {
    provider: ApiProvider;
    gemini: {
        model: string;
        apiKey?: string;
        baseUrl?: string;
    };
    openai: {
        baseUrl: string;
        apiKey: string;
        model: string;
    };
}
    