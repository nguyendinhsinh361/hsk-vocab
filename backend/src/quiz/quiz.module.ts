import { Module } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { QuizController } from './quiz.controller';
import { ProgressModule } from '../progress/progress.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [ProgressModule, UsersModule],
  providers: [QuizService],
  controllers: [QuizController],
})
export class QuizModule {}
