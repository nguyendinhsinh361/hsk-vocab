import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { hashPassword, verifyPassword } from './password.util';

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
  constructor(private prisma: PrismaService) {}

  /** Đăng ký tài khoản mới (email duy nhất). */
  async register(
    email: string,
    name: string,
    password: string,
  ): Promise<{ user: AuthUser }> {
    const p = this.prisma as any;
    const normalized = email.trim().toLowerCase();

    const existed = await p.user.findUnique({
      where: { email: normalized },
      select: { id: true },
    });
    if (existed) throw new ConflictException('Email đã được đăng ký');

    const passwordHash = await hashPassword(password);
    const user = await p.user.create({
      data: { email: normalized, name: name.trim(), passwordHash },
      select: SAFE_SELECT,
    });
    return { user };
  }

  /** Đăng nhập bằng email + mật khẩu. */
  async login(email: string, password: string): Promise<{ user: AuthUser }> {
    const p = this.prisma as any;
    const normalized = email.trim().toLowerCase();

    const record = await p.user.findUnique({
      where: { email: normalized },
      select: { ...SAFE_SELECT, passwordHash: true },
    });
    const ok = record && (await verifyPassword(password, record.passwordHash));
    if (!ok) throw new UnauthorizedException('Email hoặc mật khẩu không đúng');

    const { passwordHash: _omit, ...user } = record;
    return { user };
  }
}
