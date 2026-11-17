import { cn } from '@/shared/lib/cn';
import type { ComponentPropsWithRef, ReactNode } from 'react';

type AlertVariant = 'error' | 'info' | 'success';

type AlertProps = ComponentPropsWithRef<'div'> & {
  variant?: AlertVariant;
  children: ReactNode;
};

const variantClasses: Record<AlertVariant, string> = {
  error:
    'border-red-300 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200',
  info: 'border-sky-300 bg-sky-50 text-sky-900 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-200',
  success:
    'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
};

export function Alert({ variant = 'info', className, children, ...props }: AlertProps) {
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={cn('rounded-lg border px-4 py-3 text-sm', variantClasses[variant], className)}
      {...props}
    >
      {children}
    </div>
  );
}
