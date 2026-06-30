import { SetMetadata } from '@nestjs/common';

export const SKIP_ENVELOPE_KEY = 'skipEnvelope';

/**
 * Opt a handler (or whole controller) out of the ApiResponse envelope.
 * Use only for endpoints whose body shape is mandated externally —
 * e.g. terminus health checks or third-party webhook contracts.
 */
export const SkipEnvelope = () => SetMetadata(SKIP_ENVELOPE_KEY, true);
