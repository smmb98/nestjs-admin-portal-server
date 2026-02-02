import { NestFactory } from '@nestjs/core';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/exception.filter';
import type { FastifyInstance } from 'fastify';
import fastifyRawBody from 'fastify-raw-body';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, new FastifyAdapter());

  // Only register raw-body parser plugin for Stripe
  const fastify = app.getHttpAdapter().getInstance() as FastifyInstance;
  await fastify.register(fastifyRawBody, {
    field: 'rawBody', // request.rawBody
    global: false, // don’t override global JSON parser
    encoding: 'utf8',
    runFirst: true,
    routes: ['/stripe/webhook'], // apply only to webhook route(s)
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());

  const nodeEnv = process.env.NODE_ENV || 'development';
  const port = process.env.PORT ?? 3000;

  let serverUrl = `http://localhost:${port}`;
  if (nodeEnv === 'production') serverUrl = 'https://api.ilmi.com';
  else if (nodeEnv === 'development') serverUrl = 'https://api-dev.ilmi.com';

  const config = new DocumentBuilder()
    .setTitle('ILMI Admin Portal API')
    .setDescription(
      `API documentation for ILMI Admin Portal (${nodeEnv} environment)`,
    )
    .setVersion('1.0')
    .addServer(serverUrl, `${nodeEnv} server`)
    .addBearerAuth({ type: 'http', scheme: 'bearer' }, 'JWT-auth')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);

  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}

void bootstrap();
