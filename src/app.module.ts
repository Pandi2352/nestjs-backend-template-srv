import { Logger, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { RequestContextMiddleware } from './common/middlewares/request-context.middleware';
import { RequestContextPreparationService } from './common/context/request-context.service';
import { ConfigModule } from '@nestjs/config';
import { ProductsController } from './modules/products-srv/controllers/products.controller';

@Module({
  imports: [ConfigModule.forRoot({})],
  controllers: [
    AppController,
    ProductsController
  ],
  providers: [
    RequestContextMiddleware,
    RequestContextPreparationService,
    Logger
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
