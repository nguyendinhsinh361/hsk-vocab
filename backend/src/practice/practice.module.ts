import { Module } from '@nestjs/common';
import { PracticeService } from './practice.service';
import { PracticeController } from './practice.controller';
import { PracticeContentBuilder } from './practice-content.builder';
import { PracticeSessionStore } from './practice-session.store';
import { PracticeGradingService } from './practice-grading.service';
import { UsersModule } from '../users/users.module';
import { GamificationModule } from '../gamification/gamification.module';
import { ReviewModule } from '../review/review.module';

@Module({
  // exercise-plan dùng qua hàm thuần (assemblePracticeSteps) — không cần DI.
  // ReviewModule: grading ghi lapse / cập nhật lịch ôn.
  imports: [UsersModule, GamificationModule, ReviewModule],
  providers: [
    PracticeService,
    PracticeContentBuilder,
    PracticeSessionStore,
    PracticeGradingService,
  ],
  controllers: [PracticeController],
  exports: [PracticeService],
})
export class PracticeModule {}
