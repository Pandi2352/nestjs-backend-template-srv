import { Body, Controller, Post, UseGuards, Get, Put, Delete, Param, Query, Response } from "@nestjs/common";
import { RequestContextPreparationService } from "../../../common/context/request-context.service";
// import { AuthGuard } from "../../../common/guards/auth-guard.guard";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { CrudTemplateService } from "@Pandi2352/nestjs-backend-template-sdk/dist/src/modules/crud-template-srv/services/classes/CrudTemplateService";
import { CreateCrudTemplateDto } from "@Pandi2352/nestjs-backend-template-sdk/dist/src/modules/crud-template-srv/services/dto/CreateCrudTemplate.dto";
import { GetCrudTemplateListDto } from "@Pandi2352/nestjs-backend-template-sdk/dist/src/modules/crud-template-srv/services/dto/GetCrudTemplateList.dto";
import { ResultEntity } from "@skm-universe/code-utils";

@ApiTags('Crud Testing Template')
@Controller('crud-template-srv')
export class CrudTemplateController {

    constructor(private requestContextPreparationService: RequestContextPreparationService) { }

    @Post("/")
    @UseGuards()
    @ApiOperation({
        summary: 'Create a Crud Template',
        description: 'Creates a new CRUD template record.'
    })
    @ApiResponse({
        status: 201,
        description: 'CRUD template created successfully.'
    })
    async createCrudTemplate(@Response() res, @Body() createCrudTemplateDto: CreateCrudTemplateDto) {
        const response = new ResultEntity({});
        try {
            const currentContext = this.requestContextPreparationService.getCurrentContext();
            const result = await CrudTemplateService.Instance.createCrudTemplate(currentContext, createCrudTemplateDto);
            response.setData({ data: result });
        } catch (error) {
            response.setError({ error: error });
        }
        return response.sendResponse(res);
    }

    @Get("/:crudTemplateId")
    // @UseGuards(AuthGuard)
    @ApiOperation({
        summary: 'Get Crud Template by ID',
        description: 'Retrieves a CRUD template record by its ID.'
    })
    @ApiResponse({
        status: 200,
        description: 'CRUD template retrieved successfully.'
    })
    @ApiResponse({
        status: 404,
        description: 'CRUD template record not found.',
    })
    async getCrudTemplateById(@Response() res, @Param('crudTemplateId') crudTemplateId: string) {
        const response = new ResultEntity({});
        try {
            const currentContext = this.requestContextPreparationService.getCurrentContext();
            const result = await CrudTemplateService.Instance.getCrudTemplateById(currentContext, crudTemplateId);
            response.setData({ data: result });
        } catch (error) {
            response.setError({ error: error });
        }
        return response.sendResponse(res);
    }

    @Put("/:crudTemplateId")
    // @UseGuards(AuthGuard)
    @ApiOperation({
        summary: 'Update Crud Template',
        description: 'Updates an existing CRUD template record.'
    })
    @ApiResponse({
        status: 200,
        description: 'CRUD template updated successfully.'
    })
    @ApiResponse({
        status: 404,
        description: 'CRUD template record not found.',
    })
    async updateCrudTemplate(
        @Response() res,
        @Param('crudTemplateId') crudTemplateId: string,
        @Body() updateCrudTemplateDto: CreateCrudTemplateDto
    ) {
        const response = new ResultEntity({});
        try {
            const currentContext = this.requestContextPreparationService.getCurrentContext();
            const result = await CrudTemplateService.Instance.updateCrudTemplateById(currentContext, crudTemplateId, updateCrudTemplateDto);
            response.setData({ data: result });
        } catch (error) {
            response.setError({ error: error });
        }
        return response.sendResponse(res);
    }

    @Post("/utils/list")
    // @UseGuards(AuthGuard)
    @ApiOperation({
        summary: 'Get Crud Template List',
        description: 'Retrieves a list of CRUD templates based on optional filters.'
    })
    @ApiResponse({
        status: 200,
        description: 'CRUD template list retrieved successfully.'
    })
    async getCrudTemplateList(@Response() res, @Body() filters: GetCrudTemplateListDto) {
        const response = new ResultEntity({});
        try {
            const currentContext = this.requestContextPreparationService.getCurrentContext();
            const result = await CrudTemplateService.Instance.getCrudTemplateList(currentContext, filters);
            response.setData({ data: result });
        } catch (error) {
            response.setError({ error: error });
        }
        return response.sendResponse(res);
    }

    @Delete("/:crudTemplateId")
    // @UseGuards(AuthGuard)
    @ApiOperation({
        summary: 'Delete Crud Template',
        description: 'Soft deletes a CRUD template record by its ID.'
    })
    @ApiResponse({
        status: 204,
        description: 'CRUD template record deleted successfully.',
    })
    @ApiResponse({
        status: 404,
        description: 'CRUD template record not found.',
    })
    async deleteCrudTemplateById(@Response() res, @Param('crudTemplateId') crudTemplateId: string) {
        const response = new ResultEntity({});
        try {
            const currentContext = this.requestContextPreparationService.getCurrentContext();
            const result = await CrudTemplateService.Instance.deleteCrudTemplateById(currentContext, crudTemplateId);
            response.setData({ data: result });
        } catch (error) {
            response.setError({ error: error });
        }
        return response.sendResponse(res);
    }

    @Get("/dropdown/list")
    // @UseGuards(AuthGuard)
    @ApiOperation({
        summary: 'Get Dropdown List for Crud Templates',
        description: 'Retrieves a dropdown list of CRUD templates.'
    })
    @ApiResponse({
        status: 200,
        description: 'Dropdown list retrieved successfully.'
    })
    async getDropDownListForCrudTemplate(@Response() res) {
        const response = new ResultEntity({});
        try {
            const currentContext = this.requestContextPreparationService.getCurrentContext();
            const result = await CrudTemplateService.Instance.getDropDownListForCrudTemplate(currentContext);
            response.setData({ data: result });
        } catch (error) {
            response.setError({ error: error });
        }
        return response.sendResponse(res);
    }
}