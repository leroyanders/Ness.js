import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard/dashboard.controller.js';

@Module({ controllers: [DashboardController] })
export class AppModule {}

export default AppModule;
