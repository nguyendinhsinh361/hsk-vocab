import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PracticeModule } from './practice/practice.module';
import { HomeModule } from './home/home.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RedisModule,
    UsersModule,
    AuthModule,
    PracticeModule,
    HomeModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
