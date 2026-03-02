import { Body, Controller, Delete, Get, Param, Post, Put, Response, UseGuards } from "@nestjs/common";
import { RequestContextPreparationService } from "../../../common/context/request-context.service";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ResultEntity } from "@skm-universe/code-utils";
import { TestService } from "@Pandi2352/nestjs-backend-template-sdk/dist/src/modules/test-srv/services/classes/TestService";
import { TenantService } from "@Pandi2352/nestjs-backend-template-sdk/dist/src/modules/tenants-srv/services/classes/TenantsService";

@ApiTags('Test')
@Controller('test-srv')
export class testController {
    constructor(private requestContextPreparationService: RequestContextPreparationService) { }

    @Get('/test')
    @ApiOperation({
        summary: `Test API`,
        description: `Test API`
    })
    @ApiResponse({
        status: 200,
        description: `Test API`,
    })
    async testService(@Response() res) {
        const currentContext = this.requestContextPreparationService.getCurrentContext();
        // const response = await TestService.Instance.testService(currentContext)
       
        const response = new ResultEntity({});
        try {
            // const result = await TestService.Instance.testService(currentContext);
            const result = await TenantService.Instance.getTenantInfoByBaseURL(currentContext.base_url);
            response.setData({ data: result });
        } catch (error) {
            response.setError({ error: error });
        }
        return response.sendResponse(res);
    }
}