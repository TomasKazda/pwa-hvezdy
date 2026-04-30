/**
 * Datová vrstva — wrapper nad fetch().
 * Rozlišuje:
 *   - fresh: úspěšná odpověď ze sítě
 *   - cached: odpověď ze SW cache (header X-From-Cache)
 *   - offline-unavailable: GET selhal a v cache nic není (4xx/5xx z SW)
 *   - offline-mutation: zápisová akce v offline → throw OfflineError
 *   - http-error: server odpověděl 4xx/5xx
 *   - auth-required: 401
 */

export type FetchSource = 'fresh' | 'cached' | 'offline-unavailable';

export interface ApiSuccess<T> {
  ok: true;
  data: T;
  source: FetchSource;
}

export interface ApiFailure {
  ok: false;
  status: number;
  message: string;
  offline: boolean;
}

export type ApiResult<T> = ApiSuccess<T> | ApiFailure;

export class OfflineError extends Error {
  constructor(message = 'Tato akce vyžaduje připojení k internetu') {
    super(message);
    this.name = 'OfflineError';
  }
}

export class HttpError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.body = body;
  }
}

const isOnline = () =>
  typeof navigator === 'undefined' ? true : navigator.onLine;

interface ApiFetchOptions extends RequestInit {
  /** Přeskočit JSON parsing (např. pro 204) */
  noJson?: boolean;
}

/**
 * Provede HTTP volání k `/api/...`. Vrací parsovaná data nebo hází.
 * Mutace v offline → OfflineError před opuštěním klienta.
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const method = (options.method ?? 'GET').toUpperCase();
  const isMutation = method !== 'GET' && method !== 'HEAD';

  if (isMutation && !isOnline()) {
    throw new OfflineError();
  }

  const url = path.startsWith('/') ? path : `/api/${path}`;
  const headers = new Headers(options.headers);
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });
  } catch (err) {
    // network failure
    throw new OfflineError(
      err instanceof Error ? err.message : 'Síťová chyba',
    );
  }

  // SW marker pro mutace v offline
  if (response.status === 503) {
    const isOfflinePayload = response.headers.get('X-Offline') === '1';
    if (isOfflinePayload) {
      throw new OfflineError();
    }
  }

  if (!response.ok) {
    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      /* ignore */
    }
    const message =
      (body as { message?: string } | null)?.message ??
      `HTTP ${response.status}`;
    throw new HttpError(response.status, message, body);
  }

  if (options.noJson || response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

/** Detekce, jestli error znamená offline. */
export function isOfflineError(err: unknown): boolean {
  return err instanceof OfflineError;
}
