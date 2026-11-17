import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { useExpireSession } from '@/features/auth';
import { apiErrorMessage, isUnauthorized, mapFieldErrors } from '@/shared/api';
import { Alert, Button, Card, CodeBlock, CopyButton, Textarea } from '@/shared/ui';
import { useEncryptMutation } from './queries';
import { encryptFormSchema, PLAINTEXT_MAX_LENGTH } from './validation';

type EncryptValues = z.infer<typeof encryptFormSchema>;

export function EncryptPanel() {
  const mutation = useEncryptMutation();
  const expireSession = useExpireSession();
  const [packet, setPacket] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EncryptValues>({
    resolver: zodResolver(encryptFormSchema),
    defaultValues: { plaintext: '' },
  });

  async function onSubmit(values: EncryptValues) {
    setFormError(null);
    setPacket(null);

    try {
      const result = await mutation.mutateAsync(values.plaintext);
      setPacket(result.packet);
      reset({ plaintext: '' });
    } catch (error) {
      if (isUnauthorized(error)) {
        expireSession();
        return;
      }
      if (mapFieldErrors(error, ['plaintext'], (field, message) => setError(field, { message }))) {
        return;
      }
      setFormError(apiErrorMessage(error, 'Nie udało się zaszyfrować tekstu.'));
    }
  }

  return (
    <Card
      title="Szyfrowanie tekstu"
      description="Szyfruje tekst bez zapisywania go w bazie. Wynikiem jest pakiet v1."
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        aria-busy={isSubmitting}
        className="space-y-4"
      >
        <Textarea
          id="encrypt-plaintext"
          label="Tekst jawny"
          hint={`Maksymalnie ${PLAINTEXT_MAX_LENGTH} znaków. Treść nie jest zapisywana.`}
          maxLength={PLAINTEXT_MAX_LENGTH}
          disabled={isSubmitting}
          error={errors.plaintext?.message}
          {...register('plaintext')}
        />

        {formError ? <Alert variant="error">{formError}</Alert> : null}

        <Button type="submit" isLoading={isSubmitting}>
          {isSubmitting ? 'Szyfrowanie…' : 'Zaszyfruj'}
        </Button>
      </form>

      {packet ? (
        <div className="mt-5 space-y-3 rounded-lg border border-slate-200 p-4 dark:border-slate-700">
          <CodeBlock value={packet} label="Pakiet szyfrogramu" />
          <CopyButton value={packet} />
        </div>
      ) : null}
    </Card>
  );
}
