import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { useExpireSession } from '@/features/auth';
import { apiErrorMessage, isUnauthorized, mapFieldErrors } from '@/shared/api';
import { Alert, Button, Card, CodeBlock, CopyButton, TextField } from '@/shared/ui';
import { useDecryptMutation } from './queries';
import { decryptFormSchema } from './validation';

type DecryptValues = z.infer<typeof decryptFormSchema>;

const INVALID_PACKET_MESSAGE = 'Nieprawidłowy pakiet szyfrogramu.';

export function DecryptPanel() {
  const mutation = useDecryptMutation();
  const expireSession = useExpireSession();
  const [plaintext, setPlaintext] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<DecryptValues>({
    resolver: zodResolver(decryptFormSchema),
    defaultValues: { packet: '' },
  });

  async function onSubmit(values: DecryptValues) {
    setFormError(null);
    setPlaintext(null);

    try {
      const result = await mutation.mutateAsync(values.packet);
      setPlaintext(result.plaintext);
    } catch (error) {
      if (isUnauthorized(error)) {
        expireSession();
        return;
      }
      if (mapFieldErrors(error, ['packet'], (field, message) => setError(field, { message }))) {
        return;
      }
      setFormError(apiErrorMessage(error, INVALID_PACKET_MESSAGE));
    }
  }

  return (
    <Card
      title="Deszyfrowanie pakietu"
      description="Wklej pakiet odszyfrowywany w kontekście zalogowanego użytkownika."
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        aria-busy={isSubmitting}
        className="space-y-4"
      >
        <TextField
          id="decrypt-packet"
          label="Pakiet"
          hint="Format: v1.<nonce>.<ciphertext+tag>"
          autoComplete="off"
          spellCheck={false}
          disabled={isSubmitting}
          error={errors.packet?.message}
          {...register('packet')}
        />

        {formError ? <Alert variant="error">{formError}</Alert> : null}

        <Button type="submit" isLoading={isSubmitting} variant="secondary">
          {isSubmitting ? 'Deszyfrowanie…' : 'Odszyfruj'}
        </Button>
      </form>

      {plaintext !== null ? (
        <div className="mt-5 space-y-3 rounded-lg border border-emerald-200 p-4 dark:border-emerald-900">
          <CodeBlock value={plaintext} label="Odszyfrowany tekst" />
          <CopyButton value={plaintext} />
        </div>
      ) : null}
    </Card>
  );
}
