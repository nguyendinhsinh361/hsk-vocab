import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

/** Body cho POST /auth/register. */
export class RegisterInput {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email!: string;

  @IsString()
  @MinLength(2, { message: 'Tên tối thiểu 2 ký tự' })
  @MaxLength(60)
  name!: string;

  @IsString()
  @MinLength(6, { message: 'Mật khẩu tối thiểu 6 ký tự' })
  @MaxLength(72)
  password!: string;
}

/** Body cho POST /auth/login. */
export class LoginInput {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email!: string;

  @IsString()
  @MinLength(1, { message: 'Vui lòng nhập mật khẩu' })
  password!: string;
}
