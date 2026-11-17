import { useSessionQuery } from '@/features/auth';
import { CryptoWorkspace } from '@/features/crypto';
import { MessagesPanel } from '@/features/messages';
import { Card } from '@/shared/ui';

export function DashboardPage() {
  const session = useSessionQuery();

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Panel</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Witaj{session.data ? `, ${session.data.username}` : ''}. Szyfruj tekst i zarządzaj
          własnymi wiadomościami.
        </p>
      </header>

      <CryptoWorkspace />
      <MessagesPanel />

      <Card title="Twoje konto">
        <dl className="grid gap-2 text-sm sm:grid-cols-[8rem_1fr]">
          <dt className="font-semibold text-slate-700 dark:text-slate-300">Login</dt>
          <dd className="font-mono text-slate-900 dark:text-slate-100">
            {session.data?.username ?? '—'}
          </dd>
          <dt className="font-semibold text-slate-700 dark:text-slate-300">Identyfikator</dt>
          <dd className="break-all font-mono text-slate-900 dark:text-slate-100">
            {session.data?.id ?? '—'}
          </dd>
        </dl>
      </Card>
    </div>
  );
}
