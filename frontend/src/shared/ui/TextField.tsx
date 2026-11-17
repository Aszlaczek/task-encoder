import { cn } from '@/shared/lib/cn';
import type { ComponentPropsWithRef } from 'react';

type TextFieldProps = ComponentPropsWithRef<'input'> & {
  id: string;
  label: string;
  hint?: string;
  error?: string;
};

/**
 * Pole tekstowe z etykietą, podpowiedzią i błędem. `aria-describedby` jest budowane
 * automatycznie, żeby komunikaty były odczytywane razem z polem.
 */
export function TextField({ id, label, hint, error, className, ...props }: TextFieldProps) {
  const describedBy =
    [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(' ') ||
    undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-slate-800 dark:text-slate-200">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          'w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus-visible:border-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500',
          error ? 'border-red-400 dark:border-red-700' : 'border-slate-300 dark:border-slate-700',
          className,
        )}
        {...props}
      />
      {hint ? (
        <p id={`${id}-hint`} className="text-xs text-slate-500 dark:text-slate-400">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="text-xs font-semibold text-red-700 dark:text-red-300">
          {error}
        </p>
      ) : null}
    </div>
  );
}
