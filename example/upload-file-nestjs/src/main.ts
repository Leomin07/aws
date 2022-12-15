import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { Logger } from '@nestjs/common';
dotenv.config();

const port = process.env.PORT || 3000;
const logger = new Logger();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  await app.listen(port);

  logger.log('App running on port: ' + port);
}
bootstrap();
