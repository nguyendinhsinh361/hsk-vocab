import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginInput, RegisterInput } from './dto/auth.dto';

/**
 * XÁC THỰC (MVP email + mật khẩu).
 * POST /auth/register → tạo tài khoản.
 * POST /auth/login    → đăng nhập.
 * FE lưu user.id và gửi kèm header `x-user-id` cho các request sau.
 */
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterInput) {
    return this.auth.register(dto.email, dto.name, dto.password);
  }

  @Post('login')
  login(@Body() dto: LoginInput) {
    return this.auth.login(dto.email, dto.password);
  }
}
