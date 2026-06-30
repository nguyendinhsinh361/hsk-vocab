import { Body, Controller, Param, Post } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { StartQuizDto } from './dto/start-quiz.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { CurrentUserId } from '../common/current-user.decorator';
import { UsersService } from '../users/users.service';
import { QuizMode } from '@prisma/client';

@Controller('quiz')
export class QuizController {
  constructor(
    private quiz: QuizService,
    private users: UsersService,
  ) {}

  @Post('start')
  async start(@CurrentUserId() userId: string, @Body() dto: StartQuizDto) {
    const id = await this.users.resolveUserId(userId);
    return this.quiz.start(id, dto.deckId, dto.mode ?? QuizMode.RECOGNITION);
  }

  @Post('answer')
  async answer(@CurrentUserId() userId: string, @Body() dto: SubmitAnswerDto) {
    const id = await this.users.resolveUserId(userId);
    return this.quiz.submitAnswer(id, dto.sessionId, dto.cardId, dto.answer);
  }

  @Post(':sessionId/complete')
  async complete(
    @CurrentUserId() userId: string,
    @Param('sessionId') sessionId: string,
  ) {
    const id = await this.users.resolveUserId(userId);
    return this.quiz.complete(id, sessionId);
  }
}
