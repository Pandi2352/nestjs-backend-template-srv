# NestJS Backend Template Service (SRV)

The service implementation layer, built on top of the `@pandi2352/nestjs-backend-template-sdk`.

## ⚙️ Prerequisites
- **Node.js**: v18+
- **MongoDB**: Active connection string.
- **GitHub PAT**: Required to download the SDK package.

## 🚀 Setup

### 1. Configure Authentication
Create a `.npmrc` file in the root directory:
```text
@pandi2352:registry=https://npm.pkg.github.com/
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
```

### 2. Environment Configuration
Create a `.env` file based on the environment variables needed:
```ini
API_ENVIRONMENT=DEV
MONGO_CONNECTION_STRING=mongodb://localhost:27017/your-db
CUSTOM_SERVER_PORT=5011
# Add additional variables as required
```

### 3. Install Dependencies
```bash
npm install
```

## 🛠 Running the Application

### Development
```bash
npm run start:dev
```

### Debugging in VS Code
1.  Open the "Run and Debug" sidebar (`Ctrl+Shift+D`).
2.  Choose **"Debug Backend (SRV)"**.
3.  Press **F5**.

It will automatically load environment variables from the `.env` file.

## 📂 Architecture
This project follows the **Split SDK/SRV** pattern:
- **SDK**: Core business logic, DB models, and shared utilities.
- **SRV**: API endpoints (Controllers), Middleware, and Service-specific orchestration.

## 📄 License
Internal template. All rights reserved.
