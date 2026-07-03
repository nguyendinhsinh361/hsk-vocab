import { IsInt, IsOptional, IsString, Min } from 'class-validator';

/** Body cho POST /practice/answer — chấm 1 câu QUIZ. */
export class PracticeAnswerInput {
  @IsString()
  sessionId!: string;

  @IsString()
  exerciseId!: string;

  /** Chỉ số lựa chọn (mcq/boolean); -1 nếu là câu gõ chữ. */
  @IsInt()
  @Min(-1)
  optionIndex!: number;

  /** Chữ người dùng gõ (variant='input'). */
  @IsOptional()
  @IsString()
  text?: string;
}
