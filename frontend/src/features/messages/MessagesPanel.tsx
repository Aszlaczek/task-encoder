import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useExpireSession } from '@/features/auth';
import { apiErrorMessage, isUnauthorized, mapFieldErrors } from '@/shared/api';
import { Alert, Button, Card, Pagination, Spinner, Textarea } from '@/shared/ui';
import { MESSAGE_PAGE_SIZE_OPTIONS, type MessagePage } from './api';
import { MessageListItem } from './MessageListItem';
import { messageListKey, useCreateMessageMutation, useMessagesQuery } from './queries';

const MESSAGE_MAX_LENGTH = 10_000;

const messageFormSchema = z.object({
  plaintext: z
    .string()
    .min(1, 'Podaj tekst wiadomości.')
    .max(MESSAGE_MAX_LENGTH, `Wiadomość może mieć maksymalnie ${MESSAGE_MAX_LENGTH} znaków.`),
});

type MessageFormValues = z.infer<typeof messageFormSchema>;

export function MessagesPanel() {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState<number>(MESSAGE_PAGE_SIZE_OPTIONS[0]);
  const [notice, setNotice] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const messages = useMessagesQuery(page, size);
  const create = useCreateMessageMutation();
  const expireSession = useExpireSession();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<MessageFormValues>({
    resolver: zodResolver(messageFormSchema),
    defaultValues: { plaintext: '' },
  });

  useEffect(() => {
    if (messages.isError && isUnauthorized(messages.error)) {
      expireSession();
    }
  }, [messages.isError, messages.error, expireSession]);

  // Po usunięciu ostatniego elementu strony cofamy się, żeby nie wyświetlać pustej listy.
  // Mutacja usuwania kończy się po odświeżeniu listy, więc cache ma już aktualne dane.
  function handleMessageDeleted() {
    const data = queryClient.getQueryData<MessagePage>(messageListKey(page, size));
    if (data && page > 0 && data.totalElements <= page * size) {
      setPage(page - 1);
    }
  }

  async function onSubmit(values: MessageFormValues) {
    setNotice(null);
    setFormError(null);

    try {
      await create.mutateAsync(values.plaintext);
      reset({ plaintext: '' });
      setNotice('Wiadomość została zapisana.');
    } catch (error) {
      if (isUnauthorized(error)) {
        expireSession();
        return;
      }
      if (mapFieldErrors(error, ['plaintext'], (field, message) => setError(field, { message }))) {
        return;
      }
      setFormError(apiErrorMessage(error, 'Nie udało się zapisać wiadomości.'));
    }
  }

  return (
    <section className="space-y-4" aria-labelledby="messages-heading">
      <header className="space-y-1">
        <h2 id="messages-heading" className="text-xl font-semibold tracking-tight">
          Zapisane wiadomości
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          W bazie przechowywany jest wyłącznie szyfrogram. Tekst jawny można odczytać tylko przez
          odszyfrowanie.
        </p>
      </header>

      <Card>
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          aria-busy={isSubmitting}
          className="space-y-4"
        >
          <Textarea
            id="message-plaintext"
            label="Nowa wiadomość"
            hint={`Zostanie zaszyfrowana i zapisana. Maksymalnie ${MESSAGE_MAX_LENGTH} znaków.`}
            maxLength={MESSAGE_MAX_LENGTH}
            disabled={isSubmitting}
            error={errors.plaintext?.message}
            {...register('plaintext')}
          />

          {formError ? <Alert variant="error">{formError}</Alert> : null}
          {notice ? <Alert variant="success">{notice}</Alert> : null}

          <Button type="submit" isLoading={isSubmitting}>
            {isSubmitting ? 'Zapisywanie…' : 'Zapisz zaszyfrowaną wiadomość'}
          </Button>
        </form>
      </Card>

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold">Twoje wiadomości</h3>
          <div className="flex items-center gap-2 text-sm">
            <label htmlFor="messages-page-size" className="text-slate-600 dark:text-slate-400">
              Na stronie
            </label>
            <select
              id="messages-page-size"
              value={size}
              onChange={(event) => {
                setSize(Number(event.target.value));
                setPage(0);
              }}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
            >
              {MESSAGE_PAGE_SIZE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        {messages.isPending ? (
          <p
            className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400"
            role="status"
          >
            <Spinner className="size-4" />
            Ładowanie wiadomości…
          </p>
        ) : null}

        {messages.isError && !isUnauthorized(messages.error) ? (
          <div className="space-y-3">
            <Alert variant="error">
              {apiErrorMessage(messages.error, 'Nie udało się załadować wiadomości.')}
            </Alert>
            <Button variant="secondary" size="sm" onClick={() => void messages.refetch()}>
              Spróbuj ponownie
            </Button>
          </div>
        ) : null}

        {messages.data?.totalElements === 0 ? (
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Nie masz jeszcze żadnych zapisanych wiadomości.
          </p>
        ) : null}

        {messages.data && messages.data.items.length > 0 ? (
          <ul className="space-y-3">
            {messages.data.items.map((message) => (
              <MessageListItem
                key={message.id}
                message={message}
                onDeleted={handleMessageDeleted}
              />
            ))}
          </ul>
        ) : null}

        {messages.data && messages.data.totalElements > 0 ? (
          <div className="mt-5 border-t border-slate-200 pt-4 dark:border-slate-700">
            <Pagination
              page={page}
              totalPages={messages.data.totalPages}
              onPrevious={() => setPage((current) => Math.max(current - 1, 0))}
              onNext={() => setPage((current) => current + 1)}
            />
          </div>
        ) : null}
      </Card>
    </section>
  );
}
