export type Result<T> = Success<T> | Failure;

export type Success<T> = { ok: true; data: T };
export type Failure = { ok: false; message: string };
