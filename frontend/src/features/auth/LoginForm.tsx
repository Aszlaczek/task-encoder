import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { ApiError } from '@/shared/api';
import { Alert, Button, TextField } from '@/shared/ui';
import { useLoginMutation } from './queries';

const loginSchema = z.object({
  username: z.string().trim().min(1, 'Podaj login.').max(50, 'Login może mieć najwyżej 50 znaków.'),
  password: z.string().min(1, 'Podaj hasło.').max(200, 'Hasło może mieć najwyżej 200 znaków.'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

type LoginFormProps = {
  /** Ścieżka, na którą wracamy po poprawnym zalogowaniu. */
  redirectTo?: string;
};

export function LoginForm({ redirectTo = '/' }: LoginFormProps) {
  const navigate = useNavigate();
  const loginMutation = useLoginMutation();
  const [formError, setFormError] = useState<string | null>(null);
  const alertRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });

  useEffect(() => {
    if (formError) {
      alertRef.current?.focus();
    }
  }, [formError]);

  function applyServerError(error: unknown) {
    if (!(error instanceof ApiError)) {
      setFormError('Nie można połączyć się z serwerem. Sprawdź połączenie i spróbuj ponownie.');
      return;
    }

    if (error.code === 'VALIDATION_FAILED') {
      let mapped = false;
      for (const violation of error.fieldErrors) {
        if (violation.field === 'username' || violation.field === 'password') {
          setError(violation.field, { message: violation.message });
          mapped = true;
        }
      }
      if (mapped) {
        return;
      }
    }

    if (error.status === 401) {
      setFormError('Nieprawidłowy login lub hasło.');
      return;
    }

    if (error.status === 403) {
      setFormError(
        'Nie udało się odświeżyć zabezpieczenia formularza. Odśwież stronę i spróbuj ponownie.',
      );
      return;
    }

    setFormError(error.message || 'Wystąpił nieoczekiwany błąd. Spróbuj ponownie.');
  }

  async function onSubmit(values: LoginFormValues) {
    setFormError(null);

    try {
      await loginMutation.mutateAsync(values);
      navigate(redirectTo, { replace: true });
    } catch (error) {
      applyServerError(error);
    }
  }

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-busy={isSubmitting}
    >
      {formError ? (
        <Alert variant="error" ref={alertRef} tabIndex={-1}>
          {formError}
        </Alert>
      ) : null}

      <TextField
        id="login-username"
        label="Login"
        hint="Login nie jest wrażliwy na wielkość liter."
        autoComplete="username"
        maxLength={50}
        disabled={isSubmitting}
        error={errors.username?.message}
        {...register('username')}
      />

      <TextField
        id="login-password"
        label="Hasło"
        hint="Hasło jest wrażliwe na wielkość liter i spacje."
        type="password"
        autoComplete="current-password"
        maxLength={200}
        disabled={isSubmitting}
        error={errors.password?.message}
        {...register('password')}
      />

      <Button type="submit" isLoading={isSubmitting}>
        {isSubmitting ? 'Logowanie…' : 'Zaloguj się'}
      </Button>
    </form>
  );
}
