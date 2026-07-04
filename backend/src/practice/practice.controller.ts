import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { PracticeService } from './practice.service';
import { PracticeAnswerInput } from './dto/practice-answer.dto';
import { PracticeCompleteInput } from './dto/practice-complete.dto';
import { CurrentUserId } from '../common/current-user.decorator';

/**
 * LUỒNG LUYỆN TẬP (sau nút "Chiến luôn đi nào").
 * GET  /practice/session?root=people  → payload Trailer + Pattern + Test.
 * POST /practice/answer                → chấm 1 câu QUIZ (ghi tiến trình).
 * POST /practice/complete              → hoàn thành phiên, cập nhật XP/level/streak.
 */
@Controller('practice')
export class PracticeController {
  constructor(private practice: PracticeService) {}

  @Get('session')
  session(@Query('root') root = 'people', @CurrentUserId() userId: string) {
    return this.practice.start(root, userId);
  }

  @Post('answer')
  answer(@Body() dto: PracticeAnswerInput) {
    return this.practice.answer(
      dto.sessionId,
      dto.exerciseId,
      dto.optionIndex,
      dto.text,
    );
  }

  @Post('complete')
  complete(@Body() dto: PracticeCompleteInput, @CurrentUserId() userId: string) {
    return this.practice.complete(dto.sessionId, userId);
  }

  @Get('history')
  history(@CurrentUserId() userId: string) {
    return this.practice.history(userId);
  }
}
