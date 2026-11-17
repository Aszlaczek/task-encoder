import { ApiError } from './types';

export function isUnauthorized(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}

export function apiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError && error.message) {
    return error.message;
  }
  return fallback;
}

/**
 * Mapuje `fieldErrors` z backendu na pola formularza. Zwraca `true`, gdy udało się
 * przypisać przynajmniej jeden komunikat — wtedy nie pokazujemy już błędu ogólnego.
 */
export function mapFieldErrors<TField extends string>(
  error: unknown,
  fields: readonly TField[],
  setError: (field: TField, message: string) => void,
): boolean {
  if (!(error instanceof ApiError) || error.code !== 'VALIDATION_FAILED') {
    return false;
  }

  let mapped = false;
  for (const violation of error.fieldErrors) {
    if ((fields as readonly string[]).includes(violation.field)) {
      setError(violation.field as TField, violation.message);
      mapped = true;
    }
  }

  return mapped;
}
