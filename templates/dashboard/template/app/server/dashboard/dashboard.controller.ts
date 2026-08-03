import { Controller, Get } from '@nestjs/common';
import { getDashboardSnapshot } from './dashboard.data.js';

@Controller('dashboard')
export class DashboardController {
  @Get('metrics')
  metrics() {
    return getDashboardSnapshot();
  }
}
