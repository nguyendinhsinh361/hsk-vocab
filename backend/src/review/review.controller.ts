import { Controller, Get, Post } from '@nestjs/common';
import { ReviewService } from './review.service';
import { CurrentUserId } from '../common/current-user.decorator';

/**
 * HÀNG ĐỢI ÔN TẬP (spec BNPD: từ đã học trả lời sai → ôn lại).
 * GET  /review/queue     → số từ đến hạn + preview (Home hiện card ôn tập).
 * POST /review/sessions  → tạo phiên ôn; chấm & hoàn thành dùng chung
 *                          /practice/answer + /practice/complete.
 */
@Controller('review')
export class ReviewController {
  constructor(private review: ReviewService) {}

  @Get('queue')
  queue(@CurrentUserId() userId: string) {
    return this.review.queue(userId);
  }

  @Post('sessions')
  start(@CurrentUserId() userId: string) {
    return this.review.start(userId);
  }
}
