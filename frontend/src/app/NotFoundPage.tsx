import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="space-y-4 text-center">
        <p className="text-sm font-semibold tracking-wide text-indigo-700 dark:text-indigo-300">
          404
        </p>
        <h1 className="text-2xl font-bold tracking-tight">Nie znaleziono strony</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Wybrany adres nie istnieje w aplikacji.
        </p>
        <Link
          to="/"
          className="inline-flex rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
        >
          Wróć do panelu
        </Link>
      </div>
    </main>
  );
}
