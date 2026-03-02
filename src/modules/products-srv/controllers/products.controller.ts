import { Body, Controller, Post, Get, Put, Delete, Param, Response } from "@nestjs/common";
import { RequestContextPreparationService } from "../../../common/context/request-context.service";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ProductService } from "@Pandi2352/nestjs-backend-template-sdk/dist/src/modules/products-srv/services/classes/ProductService";
import { CreateProductDto } from "@Pandi2352/nestjs-backend-template-sdk/dist/src/modules/products-srv/services/dto/CreateProduct.dto";
import { UpdateProductDto } from "@Pandi2352/nestjs-backend-template-sdk/dist/src/modules/products-srv/services/dto/UpdateProduct.dto";
import { GetProductListDto } from "@Pandi2352/nestjs-backend-template-sdk/dist/src/modules/products-srv/services/dto/GetProductList.dto";
import { ResultEntity } from "../../../common/entities";

@ApiTags('Products')
@Controller('products-srv')
export class ProductsController {

    constructor(private requestContextPreparationService: RequestContextPreparationService) { }

    @Post("/")
    @ApiOperation({
        summary: 'Create a Product',
        description: 'Creates a new product record.'
    })
    @ApiResponse({ status: 201, description: 'Product created successfully.' })
    async createProduct(@Response() res, @Body() createProductDto: CreateProductDto) {
        const response = new ResultEntity({});
        try {
            const currentContext = this.requestContextPreparationService.getCurrentContext();
            const result = await ProductService.Instance.createProduct(currentContext, createProductDto);
            response.setData({ data: result });
        } catch (error) {
            response.setError({ error: error });
        }
        return response.sendResponse(res);
    }

    @Get("/:productId")
    @ApiOperation({
        summary: 'Get Product by ID',
        description: 'Retrieves a product record by its ID.'
    })
    @ApiResponse({ status: 200, description: 'Product retrieved successfully.' })
    @ApiResponse({ status: 404, description: 'Product not found.' })
    async getProductById(@Response() res, @Param('productId') productId: string) {
        const response = new ResultEntity({});
        try {
            const currentContext = this.requestContextPreparationService.getCurrentContext();
            const result = await ProductService.Instance.getProductById(currentContext, productId);
            response.setData({ data: result });
        } catch (error) {
            response.setError({ error: error });
        }
        return response.sendResponse(res);
    }

    @Put("/:productId")
    @ApiOperation({
        summary: 'Update Product',
        description: 'Updates an existing product record.'
    })
    @ApiResponse({ status: 200, description: 'Product updated successfully.' })
    @ApiResponse({ status: 404, description: 'Product not found.' })
    async updateProduct(
        @Response() res,
        @Param('productId') productId: string,
        @Body() updateProductDto: UpdateProductDto
    ) {
        const response = new ResultEntity({});
        try {
            const currentContext = this.requestContextPreparationService.getCurrentContext();
            const result = await ProductService.Instance.updateProductById(currentContext, productId, updateProductDto);
            response.setData({ data: result });
        } catch (error) {
            response.setError({ error: error });
        }
        return response.sendResponse(res);
    }

    @Delete("/:productId")
    @ApiOperation({
        summary: 'Delete Product',
        description: 'Soft deletes a product record by its ID.'
    })
    @ApiResponse({ status: 200, description: 'Product deleted successfully.' })
    @ApiResponse({ status: 404, description: 'Product not found.' })
    async deleteProductById(@Response() res, @Param('productId') productId: string) {
        const response = new ResultEntity({});
        try {
            const currentContext = this.requestContextPreparationService.getCurrentContext();
            const result = await ProductService.Instance.deleteProductById(currentContext, productId);
            response.setData({ data: result });
        } catch (error) {
            response.setError({ error: error });
        }
        return response.sendResponse(res);
    }

    @Post("/utils/list")
    @ApiOperation({
        summary: 'Get Product List',
        description: 'Retrieves a list of products with pagination and filters.'
    })
    @ApiResponse({ status: 200, description: 'Product list retrieved successfully.' })
    async getProductList(@Response() res, @Body() filters: GetProductListDto) {
        const response = new ResultEntity({});
        try {
            const currentContext = this.requestContextPreparationService.getCurrentContext();
            const result = await ProductService.Instance.getProductList(currentContext, filters);
            response.setData({ data: result });
        } catch (error) {
            response.setError({ error: error });
        }
        return response.sendResponse(res);
    }

    @Get("/dropdown/list")
    @ApiOperation({
        summary: 'Get Dropdown List for Products',
        description: 'Retrieves a dropdown list of products (id + name only).'
    })
    @ApiResponse({ status: 200, description: 'Dropdown list retrieved successfully.' })
    async getDropDownListForProduct(@Response() res) {
        const response = new ResultEntity({});
        try {
            const currentContext = this.requestContextPreparationService.getCurrentContext();
            const result = await ProductService.Instance.getDropDownListForProduct(currentContext);
            response.setData({ data: result });
        } catch (error) {
            response.setError({ error: error });
        }
        return response.sendResponse(res);
    }
}
