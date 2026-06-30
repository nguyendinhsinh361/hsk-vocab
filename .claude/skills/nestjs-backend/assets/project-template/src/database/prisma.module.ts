import { Global, Module } from '@nestjs/common';

import { PrismaService } from './prisma.service';

/** Global for the same reason IamModule is: the data layer is cross-cutting
 *  infrastructure — feature modules inject PrismaService without re-importing.
 *  Schema lives in prisma/schema.prisma; SQL in prisma/migrations (migrate deploy). */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
