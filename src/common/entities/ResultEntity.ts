import { HttpStatus } from '@nestjs/common';

export class ResultEntity {
    private data: any = null;
    private error: any = null;
    private statusCode: number = HttpStatus.OK;

    constructor(_options?: any) {}

    setData({ data, statusCode }: { data: any; statusCode?: number }) {
        this.data = data;
        if (statusCode) {
            this.statusCode = statusCode;
        }
    }

    setError({ error, statusCode }: { error: any; statusCode?: number }) {
        this.error = error;
        if (statusCode) {
            this.statusCode = statusCode;
        } else if (error?.status) {
            this.statusCode = error.status;
        } else if (error?.http_code) {
            this.statusCode = error.http_code;
        } else {
            this.statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
        }
    }

    sendResponse(res: any) {
        if (this.error) {
            const errorResponse = this.error?.response || this.error;
            return res.status(this.statusCode).send({
                success: false,
                error: errorResponse,
            });
        }
        return res.status(this.statusCode).send({
            success: true,
            data: this.data,
        });
    }
}
