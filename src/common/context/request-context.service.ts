import { Injectable, Scope } from '@nestjs/common';
import { LoggerHelper, RequestContext } from '@skm-universe/code-utils';
import { TenantService } from '@Pandi2352/nestjs-backend-template-sdk/dist/src/modules/tenants-srv/services/classes/TenantsService';


@Injectable({ scope: Scope.REQUEST })
export class RequestContextPreparationService {
  private context: RequestContext = {} as RequestContext;
  // private logger = new Logger('CONTEXT');
  async prepareContext(req: any, res: any): Promise<RequestContext> {
    try {
      this.logIncommingRequest(req);
      this.context = new RequestContext(req, res);
      const tenant_config = await this.resolveTenentInfo(this.context.base_url);
      this.context.setTenantConfig(tenant_config);
      return Promise.resolve(this.context);
    } catch (error) {
      LoggerHelper.Instance.error("", "RequestContextPreparationService ", error);
      return Promise.reject(error);
    }
  }

  private async resolveTenentInfo(base_url: string): Promise<any> {
    // return {}; // replace this with your tenant resolver call
    return await TenantService.Instance.getTenantInfoByBaseURL(base_url);
  }

  private async logIncommingRequest(req: any) {
    try {
      // Do your logging here
      LoggerHelper.Instance.info("", "Incoming Request ", { headers: JSON.stringify(req.headers) });
    } catch (error) {

    }
  }

  updateUserContext(user: any) {
    this.context.setUserContext(user);
    // this.logger.debug("current context user updated", this.context);
  }

  getCurrentContext() {
    return this.context;
  }
}
