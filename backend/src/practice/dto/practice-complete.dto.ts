import { IsString } from 'class-validator';

/** Body cho POST /practice/complete — hoàn thành 1 phiên luyện tập. */
export class PracticeCompleteInput {
  @IsString()
  sessionId!: string;
}
