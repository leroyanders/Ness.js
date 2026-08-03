import { Module } from '@nestjs/common';
import { ApiController } from './api.controller.js';

class AppModule {}

Module({ controllers: [ApiController] })(AppModule);

export { AppModule };
export default AppModule;
