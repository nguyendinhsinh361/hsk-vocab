import { Module } from '@nestjs/common';

import { UsersController } from './users.controller';
import { UsersService } from './users.service';

/** PrismaService and CacheService come from global modules — nothing to import. */
@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // other modules consume the service, never the data layer
})
export class UsersModule {}
