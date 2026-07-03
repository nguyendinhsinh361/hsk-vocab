'use client';

/**
 * Màn Đăng nhập / Đăng ký (email + mật khẩu) — theo style dự án:
 * nền teal gradient + coin 子, card trắng bo góc, nút teal border đáy.
 */

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { setSession } from '@/lib/session';
import { cn } from '@/lib/cn';

// Tài khoản demo (điền sẵn ở màn đăng nhập để dùng ngay, khỏi tạo mới).
const DEMO_EMAIL = 'demo@migii.local';
const DEMO_PASSWORD = 'demo1234';

export function AuthScreen({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter();
  const isRegister = mode === 'register';

  const [name, setName] = useState('');
  const [email, setEmail] = useState(isRegister ? '' : DEMO_EMAIL);
  const [password, setPassword] = useState(isRegister ? '' : DEMO_PASSWORD);
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isRegister && name.trim().length < 2) return setError('Vui lòng nhập tên (tối thiểu 2 ký tự).');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError('Email không hợp lệ.');
    if (password.length < 6) return setError('Mật khẩu tối thiểu 6 ký tự.');

    setLoading(true);
    try {
      const { user } = isRegister
        ? await api.register(email, name, password)
        : await api.login(email, password);
      setSession(user);
      router.push('/home');
    } catch (err) {
      setError(friendlyError((err as Error).message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] w-full flex items-center justify-center p-4 overflow-hidden bg-primary-300">
      {/* Nền brand: tablet-bg (<lg) · web-bg (lg+) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 block lg:hidden bg-cover bg-center"
        style={{ backgroundImage: 'url(/img/tablet-bg.png)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 hidden lg:block bg-cover bg-center"
        style={{ backgroundImage: 'url(/img/web-bg.png)' }}
      />

      <div className="relative z-10 w-full max-w-[42rem] rounded-[2rem] bg-white p-8 md:p-14 shadow-[0_1.5rem_3rem_-1rem_rgba(15,23,42,0.35)]">
        {/* Logo */}
        <div className="text-center">
          <span className="font-sans font-extrabold text-3xl text-primary-700">migii</span>
          <h1 className="mt-5 font-sans font-bold text-3xl md:text-4xl text-neutral-900">
            {isRegister ? 'Tạo tài khoản' : 'Chào mừng trở lại'}
          </h1>
          <p className="mt-2 font-sans text-base md:text-lg text-neutral-500">
            {isRegister
              ? 'Bắt đầu hành trình chinh phục HSK nào!'
              : 'Đăng nhập để tiếp tục học tiếng Trung.'}
          </p>
        </div>

        <form onSubmit={submit} className="mt-8 flex flex-col gap-4">
          {isRegister && (
            <Field
              icon={<User size={18} />}
              type="text"
              placeholder="Tên của bạn"
              value={name}
              onChange={setName}
              autoComplete="name"
            />
          )}
          <Field
            icon={<Mail size={18} />}
            type="email"
            placeholder="Email"
            value={email}
            onChange={setEmail}
            autoComplete="email"
          />
          <Field
            icon={<Lock size={18} />}
            type={show ? 'text' : 'password'}
            placeholder="Mật khẩu"
            value={password}
            onChange={setPassword}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            trailing={
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                className="text-neutral-400 hover:text-neutral-600"
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
          />

          {error && (
            <div className="flex items-start gap-2 rounded-xl bg-danger/10 border border-danger/30 px-3 py-2.5 font-sans text-sm text-danger">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={cn(
              'mt-1 h-14 rounded-full bg-[#00b2a5] border-b-4 border-[#008f85] text-white',
              'font-sans font-semibold text-lg flex items-center justify-center',
              'active:translate-y-[0.0625rem] transition disabled:opacity-60',
            )}
          >
            {loading ? 'Đang xử lý…' : isRegister ? 'Đăng ký' : 'Đăng nhập'}
          </button>
        </form>

        {!isRegister && (
          <p className="mt-4 text-center font-sans text-sm text-neutral-400">
            Tài khoản demo đã điền sẵn — chỉ cần bấm Đăng nhập.
          </p>
        )}

        <p className="mt-7 text-center font-sans text-base text-neutral-500">
          {isRegister ? 'Đã có tài khoản? ' : 'Chưa có tài khoản? '}
          <Link
            href={isRegister ? '/login' : '/register'}
            className="font-semibold text-primary-700 hover:underline"
          >
            {isRegister ? 'Đăng nhập' : 'Đăng ký ngay'}
          </Link>
        </p>
      </div>
    </div>
  );
}

/** 1 ô nhập có icon trái + phần tử phải (tuỳ chọn). */
function Field({
  icon,
  type,
  placeholder,
  value,
  onChange,
  autoComplete,
  trailing,
}: {
  icon: React.ReactNode;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="relative flex items-center">
      <span className="pointer-events-none absolute left-4 text-neutral-400">{icon}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        className={cn(
          'w-full h-14 rounded-xl border-2 border-neutral-200 bg-neutral-50 pl-12 pr-12',
          'font-sans text-lg text-neutral-900 placeholder:text-neutral-400 outline-none transition',
          'focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/15',
        )}
      />
      {trailing && <span className="absolute right-4">{trailing}</span>}
    </div>
  );
}

function friendlyError(msg: string): string {
  if (msg.includes('409')) return 'Email đã được đăng ký. Hãy đăng nhập.';
  if (msg.includes('401')) return 'Email hoặc mật khẩu không đúng.';
  if (msg.includes('400')) return 'Thông tin chưa hợp lệ, vui lòng kiểm tra lại.';
  return 'Có lỗi xảy ra, vui lòng thử lại.';
}
