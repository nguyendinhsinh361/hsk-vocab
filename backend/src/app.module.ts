import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { UsersModule } from './users/users.module';
import { DecksModule } from './decks/decks.module';
import { CardsModule } from './cards/cards.module';
import { QuizModule } from './quiz/quiz.module';
import { ProgressModule } from './progress/progress.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RedisModule,
    UsersModule,
    DecksModule,
    CardsModule,
    QuizModule,
    ProgressModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
