export type FieldViolation = {
  field: string;
  message: string;
};

/** Wspólny format błędów zwracany przez backend. */
export type ApiErrorBody = {
  code: string;
  message: string;
  timestamp?: string;
  fieldErrors?: FieldViolation[];
};

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fieldErrors: FieldViolation[];

  constructor(status: number, code: string, message: string, fieldErrors: FieldViolation[] = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }

  static async fromResponse(response: Response): Promise<ApiError> {
    let body: unknown = null;

    try {
      body = await response.json();
    } catch {
      // Odpowiedź błędu nie musi być JSON-em (np. błąd proxy).
    }

    if (isApiErrorBody(body)) {
      return new ApiError(response.status, body.code, body.message, body.fieldErrors ?? []);
    }

    return new ApiError(response.status, 'UNKNOWN_ERROR', 'Wystąpił nieoczekiwany błąd serwera.');
  }
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return typeof candidate.code === 'string' && typeof candidate.message === 'string';
}
