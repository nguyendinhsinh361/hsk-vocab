import { Module } from '@nestjs/common';

import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

/** Token issuance/rotation. JwtModule comes from the global IamModule;
 *  PrismaService (refresh-token store) from the global PrismaModule. */
@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
