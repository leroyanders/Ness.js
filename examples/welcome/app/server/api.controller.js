import { Body, Controller, Get, Post } from '@nestjs/common';

class ApiController {
  health() {
    return {
      healthy: true,
      framework: 'Ness.js',
      backend: 'NestJS',
      timestamp: new Date().toISOString(),
    };
  }

  echo(body) {
    return { body };
  }
}

Get('health')(
  ApiController.prototype,
  'health',
  Object.getOwnPropertyDescriptor(ApiController.prototype, 'health'),
);
Post('echo')(
  ApiController.prototype,
  'echo',
  Object.getOwnPropertyDescriptor(ApiController.prototype, 'echo'),
);
Body()(ApiController.prototype, 'echo', 0);
Controller()(ApiController);

export { ApiController };
