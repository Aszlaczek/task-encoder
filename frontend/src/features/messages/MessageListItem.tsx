import { useCallback, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useExpireSession } from '@/features/auth';
import { ApiError, apiErrorMessage, isUnauthorized } from '@/shared/api';
import { Alert, Button, CodeBlock, CopyButton } from '@/shared/ui';
import type { MessageSummary } from './api';
import { formatCreatedAt } from './format';
import {
  messageListsKey,
  useDecryptMessageMutation,
  useDeleteMessageMutation,
  useMessageDetailQuery,
} from './queries';

type MessageListItemProps = {
  message: MessageSummary;
  onDeleted?: () => void;
};

function describeError(error: unknown): string {
  if (error instanceof ApiError && error.code === 'MESSAGE_NOT_FOUND') {
    return 'Wiadomość nie jest już dostępna.';
  }
  return apiErrorMessage(error, 'Nie udało się wykonać operacji.');
}

export function MessageListItem({ message, onDeleted }: MessageListItemProps) {
  const queryClient = useQueryClient();
  const expireSession = useExpireSession();
  const decrypt = useDecryptMessageMutation();
  const remove = useDeleteMessageMutation();

  const [showPacket, setShowPacket] = useState(false);
  const [showPlaintext, setShowPlaintext] = useState(false);
  const [plaintext, setPlaintext] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const detail = useMessageDetailQuery(showPacket ? message.id : null);

  const handleError = useCallback(
    (error: unknown) => {
      if (isUnauthorized(error)) {
        expireSession();
        return;
      }

      if (error instanceof ApiError && error.code === 'MESSAGE_NOT_FOUND') {
        void queryClient.invalidateQueries({ queryKey: messageListsKey });
      }

      setActionError(describeError(error));
    },
    [expireSession, queryClient],
  );

  // Błąd pobierania pakietu obsługujemy jako stan zapytania, bez synchronizowania go
  // z lokalnym stanem komponentu. W efekcie zostają tylko skutki uboczne (sesja, cache).
  useEffect(() => {
    if (!detail.isError || !detail.error) {
      return;
    }

    if (isUnauthorized(detail.error)) {
      expireSession();
      return;
    }

    if (detail.error instanceof ApiError && detail.error.code === 'MESSAGE_NOT_FOUND') {
      void queryClient.invalidateQueries({ queryKey: messageListsKey });
    }
  }, [detail.error, detail.isError, expireSession, queryClient]);

  const detailError =
    detail.isError && detail.error && !isUnauthorized(detail.error)
      ? describeError(detail.error)
      : null;
  const visibleError = actionError ?? detailError;

  async function handleDecrypt() {
    setActionError(null);
    try {
      const result = await decrypt.mutateAsync(message.id);
      setPlaintext(result.plaintext);
      setShowPlaintext(true);
    } catch (error) {
      handleError(error);
    }
  }

  async function handleDelete() {
    setActionError(null);
    try {
      await remove.mutateAsync(message.id);
      setConfirmDelete(false);
      onDeleted?.();
    } catch (error) {
      handleError(error);
    }
  }

  const busy = decrypt.isPending || remove.isPending;

  return (
    <li
      data-message-id={message.id}
      className="space-y-3 rounded-lg border border-slate-200 p-4 dark:border-slate-700"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold">Wiadomość</p>
          <time dateTime={message.createdAt} className="text-xs text-slate-500 dark:text-slate-400">
            {formatCreatedAt(message.createdAt)}
          </time>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setShowPacket((current) => !current)}
          >
            {showPacket ? 'Ukryj pakiet' : 'Pokaż pakiet'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              if (showPlaintext) {
                setShowPlaintext(false);
              } else {
                void handleDecrypt();
              }
            }}
            isLoading={decrypt.isPending}
            disabled={busy && !decrypt.isPending}
          >
            {decrypt.isPending ? 'Odszyfruj…' : showPlaintext ? 'Ukryj tekst' : 'Odszyfruj'}
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => setConfirmDelete((current) => !current)}
            disabled={busy}
          >
            Usuń
          </Button>
        </div>
      </div>

      {visibleError ? <Alert variant="error">{visibleError}</Alert> : null}

      {confirmDelete ? (
        <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950">
          <p className="text-sm">Usunąć tę wiadomość? Tej operacji nie można cofnąć.</p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => void handleDelete()}
              isLoading={remove.isPending}
            >
              Potwierdź usunięcie
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setConfirmDelete(false)}
              disabled={remove.isPending}
            >
              Anuluj
            </Button>
          </div>
        </div>
      ) : null}

      {showPacket ? (
        <div className="space-y-3">
          {detail.isPending ? (
            <p className="text-xs text-slate-500 dark:text-slate-400" role="status">
              Ładowanie pakietu…
            </p>
          ) : null}
          {detail.data ? (
            <>
              <CodeBlock value={detail.data.packet} label="Pakiet szyfrogramu" />
              <CopyButton value={detail.data.packet} />
            </>
          ) : null}
        </div>
      ) : null}

      {showPlaintext && plaintext !== null ? (
        <div className="space-y-3">
          <CodeBlock value={plaintext} label="Odszyfrowany tekst" />
          <CopyButton value={plaintext} />
        </div>
      ) : null}
    </li>
  );
}
