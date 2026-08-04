import { Module } from '@nestjs/common';
import { ApiController } from './api.controller.js';

@Module({ controllers: [ApiController] })
export default class AppModule {}
