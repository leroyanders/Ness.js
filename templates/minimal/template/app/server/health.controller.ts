import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('health')
  health() {
    return { healthy: true, framework: 'Ness.js', backend: 'NestJS' };
  }
}
