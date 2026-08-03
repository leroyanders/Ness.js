import { Module } from '@nestjs/common';
import { ApiController } from './api.controller.js';

export default class AppModule {}

Module({ controllers: [ApiController] })(AppModule);
