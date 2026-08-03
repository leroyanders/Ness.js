import { Module } from '@nestjs/common';
import { HealthController } from './health.controller.js';
import { UsersModule } from './users/users.module.js';

@Module({ imports: [UsersModule], controllers: [HealthController] })
export class AppModule {}

export default AppModule;
