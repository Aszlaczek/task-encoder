import { useSessionQuery } from '@/features/auth';
import { Card } from '@/shared/ui';

export function DashboardPage() {
  const session = useSessionQuery();

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Panel</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Witaj{session.data ? `, ${session.data.username}` : ''}. To miejsce na szyfrowanie i
          zarządzanie wiadomościami.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <Card
          title="Szyfrowanie wiadomości"
          description="Panel szyfrowania i deszyfrowania pojawi się w kolejnym etapie."
        >
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Backend udostępnia już endpointy <code className="font-mono">/api/crypto</code> oraz{' '}
            <code className="font-mono">/api/messages</code>. Interfejs zostanie podłączony w etapie
            8.
          </p>
        </Card>

        <Card title="Bezpieczeństwo" description="Jak działa przechowywanie treści?">
          <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600 dark:text-slate-400">
            <li>AES-256-GCM z losowym nonce i tagiem 128 bitów.</li>
            <li>W bazie zapisany jest wyłącznie pakiet szyfrogramu.</li>
            <li>Dostęp do wiadomości wynika wyłącznie z sesji użytkownika.</li>
          </ul>
        </Card>
      </div>

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
