export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null) as { message?: string; code?: string } | null;
    throw new ApiError(error?.message ?? 'サーバーへ接続できませんでした。', response.status, error?.code ?? 'REQUEST_FAILED');
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
