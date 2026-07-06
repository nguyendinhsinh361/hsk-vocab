import { IsOptional, IsString } from 'class-validator';

/** Body cho POST /practice/sessions — tạo phiên luyện tập mới. */
export class PracticeSessionInput {
  /** rootId hoặc alias FE (vd "people"). Mặc định "people". */
  @IsOptional()
  @IsString()
  root?: string;
}
