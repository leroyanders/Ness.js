import { Controller, Get } from '@nestjs/common';

class ApiController {
  health() {
    return { healthy: true, framework: 'NestJS' };
  }
}

Get('health')(
  ApiController.prototype,
  'health',
  Object.getOwnPropertyDescriptor(ApiController.prototype, 'health'),
);
Controller()(ApiController);

export { ApiController };
