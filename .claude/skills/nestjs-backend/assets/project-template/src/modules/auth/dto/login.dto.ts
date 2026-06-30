import { IsEmail, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @MaxLength(254)
  readonly email!: string;

  // No MinLength here: password policy is enforced at registration; a too-short
  // login attempt is simply a wrong password (401), revealing nothing.
  @IsString()
  @MaxLength(128)
  readonly password!: string;
}
