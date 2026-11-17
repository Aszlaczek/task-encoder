import { Button } from './Button';

type PaginationProps = {
  page: number;
  totalPages: number;
  onPrevious: () => void;
  onNext: () => void;
};

export function Pagination({ page, totalPages, onPrevious, onNext }: PaginationProps) {
  const lastPage = Math.max(totalPages - 1, 0);

  return (
    <nav
      aria-label="Paginacja wiadomości"
      className="flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-400"
    >
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={onPrevious}
        disabled={page === 0}
      >
        Poprzednia
      </Button>
      <span aria-live="polite">
        Strona {page + 1} z {lastPage + 1}
      </span>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={onNext}
        disabled={page >= lastPage}
      >
        Następna
      </Button>
    </nav>
  );
}
