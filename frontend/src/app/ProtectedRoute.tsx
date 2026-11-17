import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSessionQuery } from '@/features/auth';
import { Alert, Button, Spinner } from '@/shared/ui';

export function ProtectedRoute() {
  const location = useLocation();
  const session = useSessionQuery();

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

  if (session.isError) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md space-y-4">
          <h1 className="text-xl font-semibold">Nie udało się sprawdzić sesji</h1>
          <Alert variant="error">
            {session.error instanceof Error && session.error.message
              ? session.error.message
              : 'Spróbuj ponownie za chwilę.'}
          </Alert>
          <Button onClick={() => void session.refetch()}>Spróbuj ponownie</Button>
        </div>
      </main>
    );
  }

  if (!session.data) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
