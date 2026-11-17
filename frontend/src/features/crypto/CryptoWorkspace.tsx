import { DecryptPanel } from './DecryptPanel';
import { EncryptPanel } from './EncryptPanel';

export function CryptoWorkspace() {
  return (
    <section className="space-y-4" aria-labelledby="crypto-heading">
      <header className="space-y-1">
        <h2 id="crypto-heading" className="text-xl font-semibold tracking-tight">
          Szyfrowanie
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Szyfruj tekst jednorazowo lub odszyfruj otrzymany pakiet. Operacje nie zmieniają listy
          zapisanych wiadomości.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <EncryptPanel />
        <DecryptPanel />
      </div>
    </section>
  );
}
