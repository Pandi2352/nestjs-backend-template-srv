import { Logger } from '@nestjs/common';

export class LoggerHelper {
    private static _instance = new LoggerHelper();
    private logger = new Logger('Application');

    static get Instance() {
        return this._instance;
    }

    info(requestId: string, message: string, data?: any) {
        this.logger.log(`[${requestId}] ${message} ${data ? JSON.stringify(data) : ''}`);
    }

    error(requestId: string, message: string, error?: any) {
        this.logger.error(
            `[${requestId}] ${message}`,
            error instanceof Error ? error.stack : JSON.stringify(error),
        );
    }
}
