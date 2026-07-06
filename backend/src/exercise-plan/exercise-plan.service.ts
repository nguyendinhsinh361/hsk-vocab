import { Injectable } from '@nestjs/common';
import { generateExercisePlan } from './exercise-plan.generator';
import type {
  PlanOptions,
  PlanWordInput,
  PlannedExercise,
} from './exercise-plan.types';

/**
 * Service mỏng bọc thuật toán sinh bài (thuần) để inject vào các feature:
 * luyện tập theo gốc từ, theo chủ đề, ôn tập... Logic thật nằm ở
 * exercise-plan.generator.ts (unit-test không cần Nest context).
 */
@Injectable()
export class ExercisePlanService {
  generate(words: PlanWordInput[], options: PlanOptions): PlannedExercise[] {
    return generateExercisePlan(words, options);
  }
}
