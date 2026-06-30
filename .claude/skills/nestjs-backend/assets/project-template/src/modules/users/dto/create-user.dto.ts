import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  @MaxLength(254)
  readonly email!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(128)
  readonly password!: string;
  // NOTE: no `role` field — privilege is never client-supplied (mass-assignment safe).
}
