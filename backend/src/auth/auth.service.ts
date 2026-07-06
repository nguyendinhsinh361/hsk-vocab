import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { hashPassword, verifyPassword } from './password.util';
import { TokenService } from './token.service';

/** Hồ sơ trả về cho FE (không kèm mật khẩu). */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  xp: number;
  level: number;
  streak: number;
}

/** Response đăng ký / đăng nhập: hồ sơ + access token (Bearer). */
export interface AuthResult {
  user: AuthUser;
  accessToken: string;
}

const SAFE_SELECT = {
  id: true,
  email: true,
  name: true,
  avatar: true,
  xp: true,
  level: true,
  streak: true,
} as const;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private tokens: TokenService,
  ) {}

  /** Đăng ký tài khoản mới (email duy nhất). */
  async register(
    email: string,
    name: string,
    password: string,
  ): Promise<AuthResult> {
    const normalized = email.trim().toLowerCase();

    const existed = await this.prisma.user.findUnique({
      where: { email: normalized },
      select: { id: true },
    });
    if (existed) throw new ConflictException('Email đã được đăng ký');

    const passwordHash = await hashPassword(password);
    const user = await this.prisma.user.create({
      data: { email: normalized, name: name.trim(), passwordHash },
      select: SAFE_SELECT,
    });
    return { user, accessToken: this.issueToken(user) };
  }

  /** Đăng nhập bằng email + mật khẩu. */
  async login(email: string, password: string): Promise<AuthResult> {
    const normalized = email.trim().toLowerCase();

    const record = await this.prisma.user.findUnique({
      where: { email: normalized },
      select: { ...SAFE_SELECT, passwordHash: true },
    });
    // passwordHash NULL = tài khoản social → không đăng nhập bằng mật khẩu.
    const ok =
      record?.passwordHash != null &&
      (await verifyPassword(password, record.passwordHash));
    if (!ok || !record)
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');

    // Không trả passwordHash về FE.
    const { passwordHash, ...user } = record;
    void passwordHash;
    return { user, accessToken: this.issueToken(user) };
  }

  private issueToken(user: Pick<AuthUser, 'id' | 'email'>): string {
    return this.tokens.sign({ sub: user.id, email: user.email });
  }
}
