import { Navigate, useLocation } from 'react-router-dom';
import { Card, Spinner, ThemeToggle } from '@/shared/ui';
import { LoginForm } from './LoginForm';
import { useSessionQuery } from './queries';

type LocationState = {
  from?: { pathname?: string };
};

export function LoginPage() {
  const location = useLocation();
  const session = useSessionQuery();
  const redirectTo = (location.state as LocationState | null)?.from?.pathname ?? '/';

  if (session.isPending) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6" role="status">
        <span className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
          <Spinner className="size-5" />
          Sprawdzanie sesji…
        </span>
      </main>
    );
  }

  if (session.data) {
    return <Navigate to={redirectTo} replace />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-6 py-4">
        <span className="text-sm font-bold tracking-wide text-indigo-700 dark:text-indigo-300">
          TASK ENCODER
        </span>
        <ThemeToggle />
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold tracking-tight">Szyfrowanie wiadomości</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Zaloguj się, aby szyfrować, zapisywać i odczytywać własne wiadomości.
            </p>
          </div>

          <Card title="Zaloguj się" description="Użyj konta demonstracyjnego alice lub bob.">
            <LoginForm redirectTo={redirectTo} />
          </Card>

          <p className="text-center text-xs text-slate-500 dark:text-slate-400">
            Konta demo: <code className="font-mono">alice</code> /{' '}
            <code className="font-mono">AliceDemo123!</code> oraz{' '}
            <code className="font-mono">bob</code> / <code className="font-mono">BobDemo1234!</code>
          </p>
        </div>
      </main>

      <footer className="px-6 py-4 text-center text-xs text-slate-500 dark:text-slate-400">
        Projekt demonstracyjny. Nie służy do przechowywania prawdziwych sekretów.
      </footer>
    </div>
  );
}
