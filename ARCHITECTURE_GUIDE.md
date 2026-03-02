# Architecture Guide

## 1. Project Overview

This is a **NestJS backend template** built with a two-layer architecture:

| Layer | Purpose |
|-------|---------|
| **SDK** | Shared business logic — database schemas, services, DTOs. Published as an npm package. |
| **SRV** | HTTP server — controllers, middleware, request context. Consumes the SDK. |

The separation allows multiple SRV services (admin API, public API, worker) to share the same SDK.

```
BE/
├── SDK/          ← Business logic (npm package)
├── SRV/          ← HTTP server (NestJS app)
└── ARCHITECTURE_GUIDE.md
```

---

## 2. Folder Structure

### SDK

```
SDK/
├── src/
│   ├── common/                          ← Shared types (extend as needed)
│   ├── database/
│   │   ├── DBContext.ts                 ← Multi-tenant connection manager
│   │   ├── DBModels.ts                  ← Model registry (auto-generated)
│   │   └── Enums/ConfigSource.ts        ← FILE | ENV config mode
│   ├── modules/
│   │   └── products-srv/                ← Example module
│   │       └── services/
│   │           ├── db/Product.ts        ← Mongoose schema + interface
│   │           ├── dto/                 ← CreateProduct, UpdateProduct, GetProductList
│   │           └── classes/ProductService.ts  ← Singleton service
│   ├── utils/
│   │   ├── core/CodeUtils.ts            ← ErrorEntity, LoggerHelper, RandomNumberGenerator
│   │   ├── ObjectUtil/ObjectUtil.ts     ← Slug generation, null checks, etc.
│   │   └── CacheHelper/CacheKey.ts      ← Cache key builder
│   └── index.ts                         ← Public API exports
├── generators/                          ← DBModels code generator
├── package.json
└── tsconfig.json
```

### SRV

```
SRV/
├── src/
│   ├── main.ts                          ← Bootstrap (Fastify, Swagger, Helmet)
│   ├── app.module.ts                    ← Root module
│   ├── app.controller.ts               ← Health check (/ping)
│   ├── common/
│   │   ├── entities/                    ← ResultEntity, RequestContext, LoggerHelper
│   │   ├── context/                     ← RequestContextPreparationService
│   │   ├── middlewares/                 ← Request context middleware, logger
│   │   ├── guards/                      ← JWT auth guard (ready to enable)
│   │   └── interceptors/               ← Validation entities
│   └── modules/
│       └── products-srv/                ← Example module
│           └── controllers/
│               └── products.controller.ts
├── .env                                 ← Environment variables
├── package.json
└── tsconfig.json
```

---

## 3. Setup Guide

### Prerequisites

- Node.js >= 18
- MongoDB (local or Atlas)
- npm

### Installation

```bash
# Install SDK dependencies and build
cd BE/SDK
npm install
npm run build

# Install SRV dependencies
cd ../SRV
npm install

# Copy SDK dist to SRV (local development)
# The SDK is referenced as a package in SRV — after building SDK,
# copy dist/ to SRV/node_modules/@Pandi2352/nestjs-backend-template-sdk/dist/
```

### Environment Configuration

Create `SRV/.env` (already provided):

```env
PROPERTY_RESOLVER_MODE=2
API_ENVIRONMENT=DEV
MANAGEMENT_KEY_NAME=click-to-cancel-dev    # Default tenant/database name
CUSTOM_SERVER_PORT=5011
MONGO_CONNECTION_STRING=mongodb://localhost:27017/{{db_name}}?retryWrites=true&w=majority
CONFIG_SOURCE=ENV                           # ENV or FILE
MULTI_TENANCY_ENABLED=false
CACHE_STATUS=ENABLE
```

### Running

```bash
cd BE/SRV
npm run start:dev
```

Swagger UI: `http://localhost:5011/api`

---

## 4. SDK Layer Deep-Dive

### Database Schema Pattern

Every mongoose schema follows this pattern:

```typescript
// 1. Interface extending mongoose.Document
export interface IProduct extends mongoose.Document {
    _id: string;
    id: string;
    name: string;
    is_active: boolean;     // Soft-delete flag
    createdAt: Date;
    updatedAt: Date;
}

// 2. Schema definition
export var ProductSchema = new mongoose.Schema({
    _id: { type: String },
    name: { type: String, index: true, required: true },
    is_active: { type: Boolean, default: true },
}, {
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    timestamps: true
});

// 3. Pre-save hook for UUID generation
ProductSchema.pre('save', function (next) {
    const document = <IProduct>this;
    if (!document._id) {
        document.id = document._id = RandomNumberGenerator.getUniqueId();
    }
    next();
});

// 4. Collection name export (REQUIRED — the generator reads this)
export const CollectionName = "Product";
```

### DBModels Generator

After creating or modifying any schema file under `SDK/src/modules/*/services/db/`, you must run the generator to update `DBModels.ts`:

```bash
cd SDK/generators/dbcontext
npx ts-node ./GenerateCollectionRef.ts
```

The generator scans every `SDK/src/modules/*/services/db/*.ts` file, reads the `CollectionName` export, and regenerates `SDK/src/database/DBModels.ts` with the correct imports, model declarations, and model initializations.

**Do NOT manually edit `DBModels.ts`** — always use the generator.

### Singleton Service Pattern

All services use a lazy-initialized singleton:

```typescript
export class ProductService {
    private static _instance: ProductService;

    static get Instance() {
        if (!this._instance) {
            this._instance = new ProductService();
        }
        return this._instance;
    }

    async createProduct(currentContext: RequestContext, data: CreateProductDto) {
        try {
            LoggerHelper.Instance.info(currentContext.x_request_id, "createProduct fn", { data });
            const dbContext = await DbContext.getContextByConfig(currentContext.tenant_key);
            // ... business logic
            return Promise.resolve(result);
        } catch (error) {
            LoggerHelper.Instance.error(currentContext.x_request_id, "Error in createProduct fn", error);
            return Promise.reject(error);
        }
    }
}
```

### Database Context (Multi-Tenancy)

`DbContext` manages per-tenant MongoDB connections:

```typescript
// Each tenant_key maps to a separate database
const dbContext = await DbContext.getContextByConfig(currentContext.tenant_key);
const product = new dbContext.Product();
```

The connection string template `{{db_name}}` is replaced with the tenant key, so each tenant gets its own database.

### DTOs

Use `class-validator` + `@nestjs/swagger` decorators:

```typescript
export class CreateProductDto {
    @ApiProperty({ example: "Keyboard", description: "Product name" })
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    price: number;
}
```

---

## 5. SRV Layer Deep-Dive

### Request Lifecycle

```
HTTP Request
  → Fastify
  → RequestContextMiddleware
    → RequestContextPreparationService.prepareContext()
      → Creates RequestContext (extracts headers, tenant key)
      → Optionally resolves tenant config
  → Controller
    → Gets context via requestContextPreparationService.getCurrentContext()
    → Calls SDK service singleton (e.g., ProductService.Instance.create(...))
    → Wraps result in ResultEntity
    → Sends response
```

### Controller Pattern

```typescript
@ApiTags('Products')
@Controller('products-srv')
export class ProductsController {
    constructor(private requestContextPreparationService: RequestContextPreparationService) {}

    @Post("/")
    async createProduct(@Response() res, @Body() dto: CreateProductDto) {
        const response = new ResultEntity({});
        try {
            const currentContext = this.requestContextPreparationService.getCurrentContext();
            const result = await ProductService.Instance.createProduct(currentContext, dto);
            response.setData({ data: result });
        } catch (error) {
            response.setError({ error: error });
        }
        return response.sendResponse(res);
    }
}
```

### ResultEntity Response Format

Success:
```json
{ "success": true, "data": { ... } }
```

Error:
```json
{ "success": false, "error": { "error_code": "...", "error_description": "..." } }
```

---

## 6. Creating a New Module (Example: "Category")

### Step 1: SDK — Create Database Schema

Create `SDK/src/modules/categories-srv/services/db/Category.ts`:

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

### Step 2: SDK — Create DTOs

Create `SDK/src/modules/categories-srv/services/dto/CreateCategory.dto.ts`:

```typescript
import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsOptional } from "class-validator";

export class CreateCategoryDto {
    @ApiProperty({ example: "Electronics" })
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    description: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    slug: string;
}
```

Create similar `UpdateCategory.dto.ts` (all fields optional) and `GetCategoryList.dto.ts` (skip, limit, name).

### Step 3: SDK — Create Service

Create `SDK/src/modules/categories-srv/services/classes/CategoryService.ts` following the same singleton pattern as `ProductService`.

### Step 4: SDK — Run the DBModels Generator

After creating the schema, run the generator to auto-register the model in `DBModels.ts`:

```bash
cd SDK/generators/dbcontext
npx ts-node ./GenerateCollectionRef.ts
```

You should see output listing all detected schema files:

```
Product.ts
Category.ts
```

This regenerates `SDK/src/database/DBModels.ts` automatically. **Do NOT manually edit that file.**

### Step 5: SDK — Export Service

Add to `SDK/src/index.ts`:

```typescript
export * from './modules/categories-srv/services/classes/CategoryService';
```

### Step 6: SDK — Build

```bash
cd SDK && npm run build
```

### Step 7: SRV — Create Controller

Create `SRV/src/modules/categories-srv/controllers/categories.controller.ts` following the same pattern as `products.controller.ts`.

### Step 8: SRV — Register Controller

Add to `SRV/src/app.module.ts`:

```typescript
import { CategoriesController } from './modules/categories-srv/controllers/categories.controller';

controllers: [AppController, ProductsController, CategoriesController],
```

### Step 9: SRV — Copy SDK & Build

```bash
# Copy fresh SDK dist to SRV node_modules
cp -r SDK/dist SRV/node_modules/@Pandi2352/nestjs-backend-template-sdk/dist

cd SRV && npm run build
```

---

## 7. Publishing SDK to GitHub Packages

The SDK is configured to publish to GitHub npm registry.

### Setup `.npmrc` (already configured)

```
@Pandi2352:registry=https://npm.pkg.github.com/
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
```

### Publish

```bash
cd SDK
npm run build
npm publish
```

Then in SRV, update the version in `package.json` and run `npm install`.

---

## 8. Environment Configuration Reference

| Variable | Description | Default |
|----------|-------------|---------|
| `CUSTOM_SERVER_PORT` | Server port | `5011` |
| `MONGO_CONNECTION_STRING` | MongoDB URI (use `{{db_name}}` placeholder) | — |
| `CONFIG_SOURCE` | `ENV` or `FILE` for DB config | `ENV` |
| `MANAGEMENT_KEY_NAME` | Default tenant/database name | `click-to-cancel-dev` |
| `MULTI_TENANCY_ENABLED` | Enable multi-tenant resolution | `false` |
| `API_ENVIRONMENT` | DEV / STAGING / PROD | `DEV` |
| `CACHE_STATUS` | ENABLE / DISABLE | `ENABLE` |
| `MONGO_CONFIG_FILE_PATH` | Path to mongo JSON config (FILE mode) | `/configs/dbconfig/mongo.json` |

---

## 9. Common Patterns

### Error Handling

Throw `ErrorEntity` with structured error info:

```typescript
throw new ErrorEntity({
    http_code: HttpStatus.CONFLICT,
    error_code: "invalid_request",
    error_description: "Product name already exists."
});
```

### Logging

All service methods log entry and errors:

```typescript
LoggerHelper.Instance.info(requestId, "methodName fn", { data });
LoggerHelper.Instance.error(requestId, "Error in methodName fn", error);
```

### Soft Delete

Documents are never physically deleted. Set `is_active = false`:

```typescript
existingProduct.is_active = false;
await existingProduct.save();
```

All queries filter with `{ is_active: { $ne: false } }`.

### Pagination

Use `skip`/`limit` with total count:

```typescript
const totalCount = await dbContext.Product.countDocuments(query);
const entities = await dbContext.Product.find(query)
    .skip(filters?.skip || 0)
    .limit(filters?.limit || 10)
    .sort({ createdAt: -1 });
return { total_count: totalCount, entities };
```

### Slug Generation

Auto-generate URL-friendly slugs:

```typescript
import { ObjectUtil } from "../../../../utils/ObjectUtil/ObjectUtil";

if (!data.slug) {
    data.slug = ObjectUtil.getSlug(data.name);
    // "Wireless Keyboard" → "wireless-keyboard"
}
```

### Unique Name Validation

Case-insensitive check before create/update:

```typescript
const exists = await dbContext.Product.exists({
    name: { $regex: `^${name}$`, $options: "i" }
});
```
