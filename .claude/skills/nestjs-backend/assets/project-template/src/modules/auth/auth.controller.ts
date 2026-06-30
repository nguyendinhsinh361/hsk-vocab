import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { AuthUser } from '../../iam/auth-user';
import { CurrentUser } from '../../iam/decorators/current-user.decorator';
import { Public } from '../../iam/decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { TokenPairDto } from './dto/token-pair.dto';
import { AuthService } from './auth.service';

/** Thin controller: HTTP in/out only; token rules live in AuthService (SRP). */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** Stricter throttle than the global 100/min — login is the credential-stuffing target. */
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(dto);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto): Promise<TokenPairDto> {
    return this.authService.refresh(dto.refreshToken);
  }

  /** Requires a valid access token (global guard) AND the refresh token to revoke. */
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@CurrentUser() user: AuthUser, @Body() dto: RefreshTokenDto): Promise<null> {
    await this.authService.logout(user, dto.refreshToken);
    return null;
  }
}
