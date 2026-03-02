import { Injectable, Scope } from '@nestjs/common';
import { LoggerHelper } from '../entities/LoggerHelper';
import { RequestContext } from '../entities/RequestContext';

@Injectable({ scope: Scope.REQUEST })
export class RequestContextPreparationService {
  private context: RequestContext = {} as RequestContext;

  async prepareContext(req: any, res: any): Promise<RequestContext> {
    try {
      this.logIncomingRequest(req);
      this.context = new RequestContext(req, res);
      // If you enable multi-tenancy, resolve tenant info here:
      // const tenant_config = await this.resolveTenantInfo(this.context.base_url);
      // this.context.setTenantConfig(tenant_config);
      return Promise.resolve(this.context);
    } catch (error) {
      LoggerHelper.Instance.error("", "RequestContextPreparationService ", error);
      return Promise.reject(error);
    }
  }

  private async logIncomingRequest(req: any) {
    try {
      LoggerHelper.Instance.info("", "Incoming Request ", { headers: JSON.stringify(req.headers) });
    } catch (error) {
      // Silently ignore logging errors
    }
  }

  updateUserContext(user: any) {
    this.context.setUserContext(user);
  }

  getCurrentContext() {
    return this.context;
  }
}
