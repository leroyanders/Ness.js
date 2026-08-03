import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('health')
  health() {
    return { healthy: true, service: 'ness-api' };
  }

  @Get('ready')
  ready() {
    return { ready: true };
  }
}
