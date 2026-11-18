import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const repoRoot = fileURLToPath(new URL('../..', import.meta.url));
export const baseURL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3000';

const markerDir = path.join(repoRoot, 'frontend', 'test-results');
const marker = path.join(markerDir, '.compose-stack');

/** Sprawdza healthcheck nginx + backendu przez publikowany port. */
export async function isStackHealthy(): Promise<boolean> {
  try {
    const response = await fetch(`${baseURL}/actuator/health`, {
      signal: AbortSignal.timeout(2_000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/** Uruchamia Compose w tle i zapisuje znacznik, że ten przebieg jest właścicielem stosu. */
export function startStack(): void {
  mkdirSync(markerDir, { recursive: true });
  execFileSync('docker', ['compose', 'up', '--build', '--remove-orphans', '-d'], {
    cwd: repoRoot,
    stdio: 'inherit',
  });
  writeFileSync(marker, new Date().toISOString());
}

/** Zatrzymuje stos tylko wtedy, gdy uruchomił go ten przebieg. */
export function stopStackIfOwned(): void {
  if (!existsSync(marker)) {
    return;
  }

  execFileSync('docker', ['compose', 'down'], {
    cwd: repoRoot,
    stdio: 'inherit',
  });
  rmSync(marker, { force: true });
}

export function discardStackMarker(): void {
  rmSync(marker, { force: true });
}
