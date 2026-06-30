import { IsEnum, IsOptional, IsString } from 'class-validator';
import { QuizMode } from '@prisma/client';

export class StartQuizDto {
  @IsString()
  deckId!: string;

  @IsOptional()
  @IsEnum(QuizMode)
  mode?: QuizMode;
}
