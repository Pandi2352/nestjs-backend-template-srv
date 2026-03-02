# Creating a New Module — End-to-End Guide

This guide walks you through creating a new module from scratch, building the SDK, publishing it, and wiring it into the SRV. We'll use **"Category"** as the example.

---

## Overview

Every module spans two layers:

| Layer | What you create | Location |
|-------|----------------|----------|
| **SDK** | DB schema, DTOs, Service class | `SDK/src/modules/categories-srv/` |
| **SRV** | Controller (REST endpoints) | `SRV/src/modules/categories-srv/` |

---

## Part 1: SDK — Business Logic

### Step 1: Create the folder structure

```
SDK/src/modules/categories-srv/
└── services/
    ├── db/
    │   └── Category.ts
    ├── dto/
    │   ├── CreateCategory.dto.ts
    │   ├── UpdateCategory.dto.ts
    │   └── GetCategoryList.dto.ts
    └── classes/
        └── CategoryService.ts
```

### Step 2: Create the Mongoose Schema

**File:** `SDK/src/modules/categories-srv/services/db/Category.ts`

```typescript
import { RandomNumberGenerator } from "../../../../utils/core/CodeUtils";
import mongoose = require("mongoose");

export interface ICategory extends mongoose.Document {
    _id: string;
    id: string;
    name: string;
    description: string;
    slug: string;
    is_active: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export var CategorySchema = new mongoose.Schema({
    _id: { type: String },
    name: { type: String, index: true, required: true },
    description: { type: String },
    slug: { type: String, unique: true },
    is_active: { type: Boolean, default: true },
}, {
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    timestamps: true
});

CategorySchema.pre('save', function (next) {
    const document = <ICategory>this;
    if (!document._id) {
        document.id = document._id = RandomNumberGenerator.getUniqueId();
    }
    next();
});

export const CollectionName = "Category";
```

**Rules:**
- `_id` must be `{ type: String }` — UUIDs, not ObjectIds
- Always include `is_active` for soft-delete
- Always set `timestamps: true`
- Always add the `pre('save')` hook for UUID generation
- `CollectionName` must be exported — the generator reads it

### Step 3: Create DTOs

**File:** `SDK/src/modules/categories-srv/services/dto/CreateCategory.dto.ts`

```typescript
import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsOptional, IsBoolean } from "class-validator";

export class CreateCategoryDto {
    @ApiProperty({ example: "Electronics", description: "Category name" })
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiProperty({ example: "All electronic products", required: false })
    @IsOptional()
    @IsString()
    description: string;

    @ApiProperty({ example: "electronics", required: false })
    @IsOptional()
    @IsString()
    slug: string;

    @ApiProperty({ example: true, required: false })
    @IsOptional()
    @IsBoolean()
    is_active?: boolean;
}
```

**File:** `SDK/src/modules/categories-srv/services/dto/UpdateCategory.dto.ts`

```typescript
import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, IsBoolean } from "class-validator";

export class UpdateCategoryDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    slug?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    is_active?: boolean;
}
```

**File:** `SDK/src/modules/categories-srv/services/dto/GetCategoryList.dto.ts`

```typescript
import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString } from "class-validator";

export class GetCategoryListDto {
    @ApiProperty({ default: 0, required: false })
    @IsNumber()
    @IsOptional()
    skip?: number;

    @ApiProperty({ default: 10, required: false })
    @IsNumber()
    @IsOptional()
    limit?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    name?: string;
}
```

### Step 4: Create the Service

**File:** `SDK/src/modules/categories-srv/services/classes/CategoryService.ts`

Copy the pattern from `ProductService.ts` and replace:
- `Product` → `Category`
- `product` → `category`
- Add/remove fields in the update method as needed

```typescript
import { ErrorEntity, HttpStatus, LoggerHelper, RequestContext } from "../../../../utils/core/CodeUtils";
import { DbContext } from "../../../../database/DBContext";
import { ObjectUtil } from "../../../../utils/ObjectUtil/ObjectUtil";
import { CreateCategoryDto } from "../dto/CreateCategory.dto";
import { UpdateCategoryDto } from "../dto/UpdateCategory.dto";
import { GetCategoryListDto } from "../dto/GetCategoryList.dto";

export class CategoryService {

    private static _instance: CategoryService;

    static get Instance() {
        if (!this._instance) {
            this._instance = new CategoryService();
        }
        return this._instance;
    }

    async createCategory(currentContext: RequestContext, data: CreateCategoryDto) {
        try {
            LoggerHelper.Instance.info(currentContext.x_request_id, "createCategory fn", { data });
            const dbContext = await DbContext.getContextByConfig(currentContext.tenant_key);

            const isExists = await this.isCategoryNameExists(currentContext, data.name);
            if (isExists) {
                throw new ErrorEntity({
                    http_code: HttpStatus.CONFLICT,
                    error_code: "invalid_request",
                    error_description: `Category name ${data.name} already exists.`
                });
            }

            if (!data?.slug) {
                data.slug = ObjectUtil.getSlug(data.name);
            }

            const newCategory = new dbContext.Category();
            Object.assign(newCategory, data);
            await newCategory.save();

            return Promise.resolve(newCategory);
        } catch (error) {
            LoggerHelper.Instance.error(currentContext.x_request_id, "Error in createCategory fn", error);
            return Promise.reject(error);
        }
    }

    async isCategoryNameExists(currentContext: RequestContext, name: string) {
        try {
            const dbContext = await DbContext.getContextByConfig(currentContext.tenant_key);
            const exists = await dbContext.Category.exists({ name: { $regex: `^${name}$`, $options: "i" } });
            return Promise.resolve(exists);
        } catch (error) {
            return Promise.reject(error);
        }
    }

    async getCategoryById(currentContext: RequestContext, categoryId: string) {
        try {
            LoggerHelper.Instance.info(currentContext.x_request_id, "getCategoryById fn", { categoryId });
            const dbContext = await DbContext.getContextByConfig(currentContext.tenant_key);
            const category = await dbContext.Category.findOne({ _id: categoryId, is_active: { $ne: false } });

            if (!category) {
                throw new ErrorEntity({
                    http_code: HttpStatus.NOT_FOUND,
                    error_code: "invalid_request",
                    error_description: `Category with ID ${categoryId} not found.`
                });
            }

            return Promise.resolve(category);
        } catch (error) {
            LoggerHelper.Instance.error(currentContext.x_request_id, "Error in getCategoryById fn", error);
            return Promise.reject(error);
        }
    }

    async getCategoryList(currentContext: RequestContext, filters: GetCategoryListDto) {
        try {
            LoggerHelper.Instance.info(currentContext.x_request_id, "getCategoryList fn", { filters });
            const dbContext = await DbContext.getContextByConfig(currentContext.tenant_key);

            const query: any = { is_active: { $ne: false } };
            if (filters?.name) {
                query['name'] = { $regex: filters.name.trim(), $options: "i" };
            }

            const totalCount = await dbContext.Category.countDocuments(query);
            const entities = await dbContext.Category.find(query)
                .skip(filters?.skip || 0)
                .limit(filters?.limit || 10)
                .sort({ createdAt: -1 });

            return Promise.resolve({ total_count: totalCount, entities });
        } catch (error) {
            LoggerHelper.Instance.error(currentContext.x_request_id, "Error in getCategoryList fn", error);
            return Promise.reject(error);
        }
    }

    async updateCategoryById(currentContext: RequestContext, categoryId: string, updateData: UpdateCategoryDto) {
        try {
            LoggerHelper.Instance.info(currentContext.x_request_id, "updateCategoryById fn", { categoryId, updateData });
            const existing = await this.getCategoryById(currentContext, categoryId);
            let isValueChanged = false;

            if (!ObjectUtil.isNullOrUndefined(updateData.name) && updateData.name !== existing.name) {
                const isNameExists = await this.isCategoryNameExists(currentContext, updateData.name!);
                if (isNameExists) {
                    throw new ErrorEntity({
                        http_code: HttpStatus.CONFLICT,
                        error_code: "invalid_request",
                        error_description: `Category name ${updateData.name} already exists.`
                    });
                }
                existing.name = updateData.name!;
                isValueChanged = true;
            }

            if (!ObjectUtil.isNullOrUndefined(updateData.slug) && updateData.slug !== existing.slug) {
                existing.slug = updateData.slug!;
                isValueChanged = true;
            }

            if (!ObjectUtil.isNullOrUndefined(updateData.description) && updateData.description !== existing.description) {
                existing.description = updateData.description!;
                isValueChanged = true;
            }

            if (isValueChanged) {
                await existing.save();
            }

            return Promise.resolve(existing);
        } catch (error) {
            LoggerHelper.Instance.error(currentContext.x_request_id, "Error in updateCategoryById fn", error);
            return Promise.reject(error);
        }
    }

    async deleteCategoryById(currentContext: RequestContext, categoryId: string) {
        try {
            LoggerHelper.Instance.info(currentContext.x_request_id, "deleteCategoryById fn", { categoryId });
            const existing = await this.getCategoryById(currentContext, categoryId);
            existing.is_active = false;
            await existing.save();
            return Promise.resolve(true);
        } catch (error) {
            LoggerHelper.Instance.error(currentContext.x_request_id, "Error in deleteCategoryById fn", error);
            return Promise.reject(error);
        }
    }

    async getDropDownListForCategory(currentContext: RequestContext) {
        try {
            const dbContext = await DbContext.getContextByConfig(currentContext.tenant_key);
            const entities = await dbContext.Category.find({ is_active: { $ne: false } }, { name: 1 }).sort({ createdAt: -1 });
            return Promise.resolve(entities);
        } catch (error) {
            LoggerHelper.Instance.error(currentContext.x_request_id, "Error in getDropDownListForCategory fn", error);
            return Promise.reject(error);
        }
    }
}
```

### Step 5: Run the DBModels Generator

```bash
cd SDK/generators/dbcontext
npx ts-node ./GenerateCollectionRef.ts
```

This scans all `SDK/src/modules/*/services/db/*.ts` files, reads `CollectionName`, and regenerates `SDK/src/database/DBModels.ts` automatically.

You should see output like:

```
Product.ts
Category.ts
```

### Step 6: Export the Service

**File:** `SDK/src/index.ts` — add the export:

```typescript
export * from './modules/products-srv/services/classes/ProductService';
export * from './modules/categories-srv/services/classes/CategoryService';   // ← add
```

### Step 7: Build the SDK

```bash
cd SDK
npm run build
```

Must complete with **0 errors**.

---

## Part 2: Publish the SDK

### First-time Setup

1. Create a GitHub Personal Access Token (classic) with `write:packages` scope
2. Configure `SDK/.npmrc`:

```
@Pandi2352:registry=https://npm.pkg.github.com/
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
```

3. Make sure `SDK/package.json` has:

```json
{
  "name": "@Pandi2352/nestjs-backend-template-sdk",
  "publishConfig": {
    "registry": "https://npm.pkg.github.com"
  }
}
```

### Bump Version & Publish

```bash
cd SDK

# Bump version (pick one)
npm version patch    # 0.0.1 → 0.0.2
npm version minor    # 0.0.1 → 0.1.0
npm version major    # 0.0.1 → 1.0.0

# Build and publish
npm run build
npm publish
```

### Local Development (Skip Publish)

During development, you can skip publishing and copy the dist directly:

```bash
cd SDK
npm run build

# Copy dist into SRV's node_modules
cp -r dist ../SRV/node_modules/@Pandi2352/nestjs-backend-template-sdk/dist
```

On Windows (cmd):

```cmd
cd SDK
npm run build
xcopy /E /Y dist ..\SRV\node_modules\@Pandi2352\nestjs-backend-template-sdk\dist\
```

---

## Part 3: SRV — Controller

### Step 8: Create the Controller

**File:** `SRV/src/modules/categories-srv/controllers/categories.controller.ts`

```typescript
import { Body, Controller, Post, Get, Put, Delete, Param, Response } from "@nestjs/common";
import { RequestContextPreparationService } from "../../../common/context/request-context.service";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { CategoryService } from "@Pandi2352/nestjs-backend-template-sdk/dist/src/modules/categories-srv/services/classes/CategoryService";
import { CreateCategoryDto } from "@Pandi2352/nestjs-backend-template-sdk/dist/src/modules/categories-srv/services/dto/CreateCategory.dto";
import { UpdateCategoryDto } from "@Pandi2352/nestjs-backend-template-sdk/dist/src/modules/categories-srv/services/dto/UpdateCategory.dto";
import { GetCategoryListDto } from "@Pandi2352/nestjs-backend-template-sdk/dist/src/modules/categories-srv/services/dto/GetCategoryList.dto";
import { ResultEntity } from "../../../common/entities";

@ApiTags('Categories')
@Controller('categories-srv')
export class CategoriesController {

    constructor(private requestContextPreparationService: RequestContextPreparationService) { }

    @Post("/")
    @ApiOperation({ summary: 'Create a Category' })
    @ApiResponse({ status: 201, description: 'Category created successfully.' })
    async createCategory(@Response() res, @Body() dto: CreateCategoryDto) {
        const response = new ResultEntity({});
        try {
            const currentContext = this.requestContextPreparationService.getCurrentContext();
            const result = await CategoryService.Instance.createCategory(currentContext, dto);
            response.setData({ data: result });
        } catch (error) {
            response.setError({ error: error });
        }
        return response.sendResponse(res);
    }

    @Get("/:categoryId")
    @ApiOperation({ summary: 'Get Category by ID' })
    @ApiResponse({ status: 200, description: 'Category retrieved successfully.' })
    @ApiResponse({ status: 404, description: 'Category not found.' })
    async getCategoryById(@Response() res, @Param('categoryId') categoryId: string) {
        const response = new ResultEntity({});
        try {
            const currentContext = this.requestContextPreparationService.getCurrentContext();
            const result = await CategoryService.Instance.getCategoryById(currentContext, categoryId);
            response.setData({ data: result });
        } catch (error) {
            response.setError({ error: error });
        }
        return response.sendResponse(res);
    }

    @Put("/:categoryId")
    @ApiOperation({ summary: 'Update Category' })
    @ApiResponse({ status: 200, description: 'Category updated successfully.' })
    async updateCategory(@Response() res, @Param('categoryId') categoryId: string, @Body() dto: UpdateCategoryDto) {
        const response = new ResultEntity({});
        try {
            const currentContext = this.requestContextPreparationService.getCurrentContext();
            const result = await CategoryService.Instance.updateCategoryById(currentContext, categoryId, dto);
            response.setData({ data: result });
        } catch (error) {
            response.setError({ error: error });
        }
        return response.sendResponse(res);
    }

    @Delete("/:categoryId")
    @ApiOperation({ summary: 'Delete Category' })
    @ApiResponse({ status: 200, description: 'Category deleted successfully.' })
    async deleteCategoryById(@Response() res, @Param('categoryId') categoryId: string) {
        const response = new ResultEntity({});
        try {
            const currentContext = this.requestContextPreparationService.getCurrentContext();
            const result = await CategoryService.Instance.deleteCategoryById(currentContext, categoryId);
            response.setData({ data: result });
        } catch (error) {
            response.setError({ error: error });
        }
        return response.sendResponse(res);
    }

    @Post("/utils/list")
    @ApiOperation({ summary: 'Get Category List' })
    @ApiResponse({ status: 200, description: 'Category list retrieved successfully.' })
    async getCategoryList(@Response() res, @Body() filters: GetCategoryListDto) {
        const response = new ResultEntity({});
        try {
            const currentContext = this.requestContextPreparationService.getCurrentContext();
            const result = await CategoryService.Instance.getCategoryList(currentContext, filters);
            response.setData({ data: result });
        } catch (error) {
            response.setError({ error: error });
        }
        return response.sendResponse(res);
    }

    @Get("/dropdown/list")
    @ApiOperation({ summary: 'Get Dropdown List for Categories' })
    @ApiResponse({ status: 200, description: 'Dropdown list retrieved successfully.' })
    async getDropDownListForCategory(@Response() res) {
        const response = new ResultEntity({});
        try {
            const currentContext = this.requestContextPreparationService.getCurrentContext();
            const result = await CategoryService.Instance.getDropDownListForCategory(currentContext);
            response.setData({ data: result });
        } catch (error) {
            response.setError({ error: error });
        }
        return response.sendResponse(res);
    }
}
```

### Step 9: Register the Controller

**File:** `SRV/src/app.module.ts` — add the import and controller:

```typescript
import { CategoriesController } from './modules/categories-srv/controllers/categories.controller';

@Module({
  controllers: [
    AppController,
    ProductsController,
    CategoriesController,    // ← add
  ],
  // ...
})
```

### Step 10: Build & Run SRV

```bash
cd SRV
npm run build          # Must compile with 0 errors
npm run start:dev      # Start dev server
```

Open Swagger UI at `http://localhost:5011/api` and verify the new **Categories** endpoints appear.

---

## Part 4: Debugging in VS Code

A `launch.json` has been created at `SRV/.vscode/launch.json` with three configurations:

### Option 1: "Debug SRV (nest start --debug)" (Recommended)

1. Open the **SRV** folder in VS Code
2. Press `F5` or go to **Run and Debug** panel
3. Select **"Debug SRV (nest start --debug)"**
4. Click the green play button
5. Set breakpoints anywhere in your `.ts` files — they will hit

### Option 2: "Debug SRV (NestJS)" — Direct ts-node

Uses `ts-node` directly without nest CLI. Good if `nest start` has issues.

### Option 3: "Attach to Running SRV"

1. Start the server manually: `npm run start:debug`
2. In VS Code, select **"Attach to Running SRV"** and press F5
3. Debugger attaches to the running process on port 9229

---

## Quick Reference Checklist

When creating a new module, make sure you've done all of these:

- [ ] **SDK** — `db/` schema file with interface, schema, pre-save hook, `CollectionName`
- [ ] **SDK** — `dto/` Create, Update, and GetList DTOs
- [ ] **SDK** — `classes/` Service with singleton pattern
- [ ] **SDK** — Run `cd generators/dbcontext && npx ts-node ./GenerateCollectionRef.ts`
- [ ] **SDK** — Add export to `src/index.ts`
- [ ] **SDK** — `npm run build` passes
- [ ] **SRV** — Controller file with all 6 endpoints (create, getById, update, delete, list, dropdown)
- [ ] **SRV** — Register controller in `app.module.ts`
- [ ] **SRV** — Copy SDK dist (local dev) or `npm install` (after publish)
- [ ] **SRV** — `npm run build` passes
- [ ] **SRV** — Verify endpoints in Swagger UI at `/api`
