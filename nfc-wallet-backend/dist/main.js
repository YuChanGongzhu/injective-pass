"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const helmet_1 = require("helmet");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.use((0, helmet_1.default)());
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.enableCors({
        origin: process.env.NODE_ENV === 'production' ? false : true,
        credentials: true,
    });
    const config = new swagger_1.DocumentBuilder()
        .setTitle('NFC钱包API')
        .setDescription('基于NFC的以太坊钱包管理系统')
        .setVersion('1.0')
        .addApiKey({
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
    }, 'api-key')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api', app, document);
    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log(`🚀 NFC钱包API服务运行在 http://localhost:${port}`);
    console.log(`📚 API文档地址: http://localhost:${port}/api`);
}
bootstrap();
//# sourceMappingURL=main.js.map