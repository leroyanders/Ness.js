import { Body, Controller, Get, Post } from '@nestjs/common';

@Controller()
export class ApiController {
  @Get('health')
  health() {
    return {
      healthy: true,
      framework: 'Ness.js',
      backend: 'NestJS',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('echo')
  echo(@Body() body: unknown) {
    return { body };
  }
}
