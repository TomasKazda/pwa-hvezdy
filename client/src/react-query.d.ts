/**
 * Augmentace TanStack Query — defaultní typ chyb je `Error` (kvůli HttpError/OfflineError).
 */
import '@tanstack/react-query';

declare module '@tanstack/react-query' {
  interface Register {
    defaultError: Error;
  }
}
