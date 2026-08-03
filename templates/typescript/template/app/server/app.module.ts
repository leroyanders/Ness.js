import { Module } from '@nestjs/common';
import { ApiController } from './api.controller.js';

@Module({ controllers: [ApiController] })
export class AppModule {}

export default AppModule;
