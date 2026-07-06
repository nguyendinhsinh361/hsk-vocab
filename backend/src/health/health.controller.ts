import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  // Public, plaintext — dùng cho healthcheck (docker / load balancer).
  @Get()
  check() {
    return {
      status: 'ok',
      service: 'migii-hsk-backend',
      ts: new Date().toISOString(),
    };
  }
}
