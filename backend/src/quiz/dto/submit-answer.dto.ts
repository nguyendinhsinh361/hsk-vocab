import { IsString } from 'class-validator';

export class SubmitAnswerDto {
  @IsString()
  sessionId!: string;

  @IsString()
  cardId!: string;

  @IsString()
  answer!: string;
}
