import { NestFactory } from '@nestjs/core';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/exception.filter';
import type { FastifyInstance } from 'fastify';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, new FastifyAdapter());

  // Configure raw body access for Stripe webhooks
  const fastify = app.getHttpAdapter().getInstance() as FastifyInstance;
  fastify.addContentTypeParser(
    'application/json',
    { parseAs: 'buffer' },
    (
      req: any,
      body: Buffer,
      done: (err: Error | null, result?: any) => void,
    ) => {
      (req as any).rawBody = body;
      try {
        done(null, JSON.parse(body.toString()));
      } catch (error) {
        done(error as Error, null);
      }
    },
  );

  // Enable global validation pipe with transformation and whitelisting
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Enable global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Configure Swagger/OpenAPI
  const nodeEnv = process.env.NODE_ENV || 'development';
  const port = process.env.PORT ?? 3000;

  let serverUrl = `http://localhost:${port}`;
  if (nodeEnv === 'production') {
    serverUrl = 'https://api.ilmi.com';
  } else if (nodeEnv === 'development') {
    serverUrl = 'https://api-dev.ilmi.com';
  }

  const config = new DocumentBuilder()
    .setTitle('ILMI Admin Portal API')
    .setDescription(
      `API documentation for ILMI Admin Portal (${nodeEnv} environment)`,
    )
    .setVersion('1.0')
    .addServer(serverUrl, `${nodeEnv} server`)
    .addTag('auth', 'Authentication endpoints')
    .addTag('organizations', 'Organization management')
    .addTag('licenses', 'License management')
    .addTag('devices', 'Device management')
    .addTag('students', 'Student management')
    .addTag('subscriptions', 'Subscription management')
    .addTag('progress', 'Progress tracking')
    .addTag('messages', 'Messaging system')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'none',
      filter: true,
      showExtensions: true,
    },
  });

  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`API Documentation available at: http://localhost:${port}/api`);
  console.log(`Environment: ${nodeEnv}`);
}
bootstrap();
