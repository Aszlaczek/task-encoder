import { cn } from '@/shared/lib/cn';
import type { ComponentPropsWithRef, ReactNode } from 'react';

type CardProps = ComponentPropsWithRef<'section'> & {
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
};

export function Card({ title, description, children, className, ...props }: CardProps) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900',
        className,
      )}
      {...props}
    >
      {title || description ? (
        <header className="mb-4 space-y-1">
          {title ? (
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
          ) : null}
          {description ? (
            <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
          ) : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}
