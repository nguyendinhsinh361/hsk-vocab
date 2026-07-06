import { Body, Controller, Get, Post } from '@nestjs/common';
import { PracticeService } from './practice.service';
import { PracticeAnswerInput } from './dto/practice-answer.dto';
import { PracticeCompleteInput } from './dto/practice-complete.dto';
import { PracticeSessionInput } from './dto/practice-session.dto';
import { CurrentUserId } from '../common/current-user.decorator';

/**
 * LUỒNG LUYỆN TẬP (sau nút "Chiến luôn đi nào").
 * POST /practice/sessions  → tạo phiên (có side-effect ghi DB nên KHÔNG dùng GET).
 * POST /practice/answer    → chấm 1 câu QUIZ (ghi tiến trình).
 * POST /practice/complete  → hoàn thành phiên (idempotent), cập nhật XP/level/streak.
 */
@Controller('practice')
export class PracticeController {
  constructor(private practice: PracticeService) {}

  @Post('sessions')
  create(@Body() dto: PracticeSessionInput, @CurrentUserId() userId: string) {
    return this.practice.start(dto.root ?? 'people', userId);
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
  complete(
    @Body() dto: PracticeCompleteInput,
    @CurrentUserId() userId: string,
  ) {
    return this.practice.complete(dto.sessionId, userId);
  }

  @Get('history')
  history(@CurrentUserId() userId: string) {
    return this.practice.history(userId);
  }
}
