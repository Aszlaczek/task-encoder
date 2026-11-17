import { useState } from 'react';
import { Button } from './Button';

type CopyButtonProps = {
  value: string;
  label?: string;
};

/** Kopiuje wynik do schowka i wyświetla krótki komunikat o rezultacie. */
export function CopyButton({ value, label = 'Kopiuj' }: CopyButtonProps) {
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => void copy()}
        disabled={!value}
      >
        {label}
      </Button>
      {status !== 'idle' ? (
        <p
          role="status"
          className={
            status === 'error'
              ? 'text-xs font-semibold text-red-700 dark:text-red-300'
              : 'text-xs text-emerald-700 dark:text-emerald-300'
          }
        >
          {status === 'success' ? 'Skopiowano.' : 'Nie udało się skopiować do schowka.'}
        </p>
      ) : null}
    </div>
  );
}
