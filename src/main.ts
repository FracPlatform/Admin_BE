import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import 'dotenv/config';
import { LogLevel } from '@nestjs/common';
import {
  DocumentBuilder,
  SwaggerCustomOptions,
  SwaggerModule,
} from '@nestjs/swagger';
const expressBasicAuth = require('express-basic-auth')
import { AllExceptionFilter } from './common/exception/exception.filter';
import { ValidationPipe } from './common/validation/validation.pipe';
import { LoggingInterceptor } from './common/interceptor/logging.interceptor';

const origins = process.env.ORIGIN?.trim()?.split(' ') ?? [''];
// Need to convert origin to string in case env setting is `*` for `ORIGIN`
const allowedOrigin = origins.length === 1 ? origins.toString() : origins;
const corsOptions = {
  origin: allowedOrigin,
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: process.env.LOG_LEVEL.split(',') as LogLevel[],
  });

  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionFilter(httpAdapter));
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalInterceptors(new LoggingInterceptor());

  app.setGlobalPrefix(process.env.GLOBAL_API_PREFIX);
  app.enableCors(corsOptions);

  // Swagger
  if (process.env.NODE_ENV === 'dev') {
    app.use(
      ['/admin-swagger'],
      expressBasicAuth({
        challenge: true,
        users: {
          [process.env.SWAGGER_USER]: process.env.SWAGGER_PASSWORD,
        },
      }),
    );
    const config = new DocumentBuilder()
      .setTitle('Marketplace')
      .setDescription('The marketplace API description')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    const customOptions: SwaggerCustomOptions = {
      swaggerOptions: {
        persistAuthorization: true,
      },
      customSiteTitle: 'My API Docs',
    };
    SwaggerModule.setup('admin-swagger', app, document, customOptions);
  }

  await app.listen(process.env.PORT);
}
bootstrap();
