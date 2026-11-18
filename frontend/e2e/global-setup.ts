import {
  baseURL,
  discardStackMarker,
  isStackHealthy,
  startStack,
  stopStackIfOwned,
} from './compose-stack';

const maxAttempts = 120;

/** Używa działającego stosu lokalnie albo uruchamia Docker Compose na czas testów. */
export default async function globalSetup(): Promise<void> {
  discardStackMarker();

  if (await isStackHealthy()) {
    if (process.env.CI) {
      throw new Error(`Stos jest już uruchomiony pod ${baseURL} — nie można go użyć w CI.`);
    }
    return;
  }

  startStack();

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (await isStackHealthy()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }

  stopStackIfOwned();
  throw new Error(`Stos nie osiągnął zdrowia ${baseURL}/actuator/health w ciągu ${maxAttempts}s.`);
}
