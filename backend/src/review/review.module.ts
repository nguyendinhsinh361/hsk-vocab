import { Module } from '@nestjs/common';
import { ReviewService } from './review.service';
import { ReviewController } from './review.controller';
import { ReviewRepository } from './review.repository';
import { UsersModule } from '../users/users.module';
import { PracticeSessionStore } from '../practice/practice-session.store';

/**
 * Hàng đợi ôn tập. KHÔNG import PracticeModule (tránh vòng lặp —
 * PracticeModule import ReviewModule để grading ghi lapse);
 * PracticeSessionStore là provider stateless (Redis global) nên
 * đăng ký lại ở đây được.
 */
@Module({
  imports: [UsersModule],
  providers: [ReviewService, ReviewRepository, PracticeSessionStore],
  controllers: [ReviewController],
  exports: [ReviewRepository],
})
export class ReviewModule {}
