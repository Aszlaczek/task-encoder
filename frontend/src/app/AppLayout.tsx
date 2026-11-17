import { NavLink, Outlet } from 'react-router-dom';
import { useLogoutMutation, useSessionQuery } from '@/features/auth';
import { ApiError } from '@/shared/api';
import { Alert, Button, ThemeToggle } from '@/shared/ui';

const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
  [
    'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
    isActive
      ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200'
      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
  ].join(' ');

export function AppLayout() {
  const session = useSessionQuery();
  const logout = useLogoutMutation();

  const logoutError =
    logout.error instanceof ApiError
      ? logout.error.message
      : logout.isError
        ? 'Nie udało się wylogować. Spróbuj ponownie.'
        : null;

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main-content" className="skip-link">
        Przejdź do treści
      </a>

      <header className="border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <span className="text-sm font-bold tracking-wide text-indigo-700 dark:text-indigo-300">
            TASK ENCODER
          </span>

          <nav aria-label="Nawigacja główna" className="flex items-center gap-1">
            <NavLink to="/" end className={navLinkClasses}>
              Panel
            </NavLink>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {session.data ? (
              <span className="hidden text-sm text-slate-600 sm:inline dark:text-slate-300">
                Zalogowano jako <strong>{session.data.username}</strong>
              </span>
            ) : null}
            <ThemeToggle />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => logout.mutate()}
              isLoading={logout.isPending}
            >
              Wyloguj
            </Button>
          </div>
        </div>

        {logoutError ? (
          <div className="mx-auto w-full max-w-6xl px-4 pb-3 sm:px-6">
            <Alert variant="error">{logoutError}</Alert>
          </div>
        ) : null}
      </header>

      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6"
      >
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 px-4 py-4 text-center text-xs text-slate-500 sm:px-6 dark:border-slate-800 dark:text-slate-400">
        Projekt demonstracyjny. Nie służy do przechowywania prawdziwych sekretów.
      </footer>
    </div>
  );
}
