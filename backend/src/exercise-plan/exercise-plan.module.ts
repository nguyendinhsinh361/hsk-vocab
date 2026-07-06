import { Module } from '@nestjs/common';
import { ExercisePlanService } from './exercise-plan.service';

/**
 * Thuật toán sinh bài tập theo spec "BNPD - Logic bài tập" —
 * dùng chung cho luyện tập gốc từ, chủ đề, ôn tập.
 */
@Module({
  providers: [ExercisePlanService],
  exports: [ExercisePlanService],
})
export class ExercisePlanModule {}
