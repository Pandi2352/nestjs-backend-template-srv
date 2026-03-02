import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { VersioningType } from '@nestjs/common';
const fmp = require('@fastify/multipart');
import helmet from 'helmet';

async function bootstrap() {
  try {
    const MAX_BODY_SIZE = 200000000; // 200 MB
    const MAX_PARAM_LENGTH = 100;

    const fastifyAdapter = new FastifyAdapter({
      logger: true,
      bodyLimit: MAX_BODY_SIZE,
      maxParamLength: MAX_PARAM_LENGTH,
    });

    fastifyAdapter.register(fmp, {});

    const app = await NestFactory.create<NestFastifyApplication>(
      AppModule,
      fastifyAdapter,
    );

    app.enableCors();
    app.setGlobalPrefix('click-to-cancel-srv');
    app.enableVersioning({ type: VersioningType.URI });

    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: [`'self'`],
          styleSrc: [`'self'`, `'unsafe-inline'`],
          imgSrc: [`'self'`, 'data:', 'validator.swagger.io'],
          scriptSrc: [`'self'`, `https: 'unsafe-inline'`],
        },
      },
    }));

    const config = new DocumentBuilder()
      .setTitle('Click to Cancel')
      .setDescription('The click-to-cancel-srv API documentation')
      .setVersion('1.0.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
    app.listen(Number(process.env.CUSTOM_SERVER_PORT) || 5011, '0.0.0.0');

  } catch (error) {
    console.log("Error while starting the service", error)
  }
}
bootstrap();
