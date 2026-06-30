import { IsString, MaxLength } from 'class-validator';

export class RefreshTokenDto {
  @IsString()
  @MaxLength(1024)
  readonly refreshToken!: string;
}
