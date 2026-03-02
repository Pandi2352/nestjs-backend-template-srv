import * as crypto from 'crypto';

export class RequestContext {
    x_request_id: string;
    tenant_key: string;
    base_url: string;
    tenant_config?: any;
    user?: any;
    req: any;
    res: any;
    [key: string]: any;

    constructor(req: any, res: any) {
        this.req = req;
        this.res = res;
        this.x_request_id = (req.headers?.['x-request-id'] as string) || crypto.randomUUID();
        this.tenant_key = (req.headers?.['x-tenant-key'] as string) || process.env.MANAGEMENT_KEY_NAME || '';
        this.base_url = req.headers?.['host'] || req.hostname || '';
    }

    setTenantConfig(config: any) {
        this.tenant_config = config;
        if (config?.tenant_key) {
            this.tenant_key = config.tenant_key;
        }
    }

    setUserContext(user: any) {
        this.user = user;
    }
}
