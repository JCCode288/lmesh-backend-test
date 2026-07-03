import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationError, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import fastifyHelmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import { TransformInterceptor } from './commons/interceptors/TransformInterceptor';
import { InvalidPayload } from './commons/exceptions/InvalidPayload';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  app.setGlobalPrefix('/api');

  app.useGlobalInterceptors(new TransformInterceptor(app.get(Reflector)));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: (errors: ValidationError[]) => {
        const fields = errors.reduce<Record<string, string[]>>((acc, err) => {
          acc[err.property] = Object.values(err.constraints ?? {});
          return acc;
        }, {});

        return new InvalidPayload('Validation failed', { fields });
      },
    }),
  );
  const config = new DocumentBuilder()
    .setTitle('Backend LMesh Swagger OpenAPI')
    .setDescription('Analyze Pipeline API description')
    .setVersion('1.0')
    .addTag('Backend LMesh')
    .addBearerAuth({ type: 'http' }, 'jwt')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/api/docs', app, documentFactory, {
    swaggerUiEnabled: process.env.NODE_ENV !== 'development' ? false : true,
  });

  await app.register(multipart, {
    limits: { fileSize: 5 * 1024 * 1024 },
  });

  await app.register(fastifyHelmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: [`'self'`, 'unpkg.com'],
        styleSrc: [
          `'self'`,
          `'unsafe-inline'`,
          'cdn.jsdelivr.net',
          'fonts.googleapis.com',
          'unpkg.com',
        ],
        fontSrc: [`'self'`, 'fonts.gstatic.com', 'data:'],
        imgSrc: [`'self'`, 'data:', 'cdn.jsdelivr.net'],
        scriptSrc: [
          `'self'`,
          `https: 'unsafe-inline'`,
          `cdn.jsdelivr.net`,
          `'unsafe-eval'`,
        ],
      },
    },
  });

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
