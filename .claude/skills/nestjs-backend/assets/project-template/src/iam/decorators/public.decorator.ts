import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
/** Opt-OUT of auth. Everything is guarded by default (secure by default). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
