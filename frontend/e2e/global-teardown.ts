import { stopStackIfOwned } from './compose-stack';

/** Zatrzymuje Docker Compose tylko wtedy, gdy uruchomił go globalSetup tego przebiegu. */
export default function globalTeardown(): void {
  stopStackIfOwned();
}
