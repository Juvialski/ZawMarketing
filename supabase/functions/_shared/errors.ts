export class AppError extends Error {
  readonly code: string;
  readonly status: number;
  readonly publicMessage: string;

  constructor(code: string, status: number, publicMessage: string) {
    super(publicMessage);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.publicMessage = publicMessage;
  }
}

export class ProviderError extends Error {
  readonly code: string;

  constructor(code: string) {
    super(code);
    this.name = 'ProviderError';
    this.code = code;
  }
}

export function providerAppError(error: unknown): AppError {
  const code = error instanceof ProviderError ? error.code : 'provider_unavailable';
  const status = code === 'provider_disabled' || code === 'provider_pricing_unconfigured' || code === 'provider_not_configured' ? 503 : 502;
  return new AppError(code, status, 'The configured AI provider could not complete this request.');
}
