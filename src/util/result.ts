export type Result<T> = Success<T> | Failure;

export type Success<T> = { ok: true; data: T; message: undefined };
export type Failure = { ok: false; message: string; data: undefined };

export const failure = (message: string): Failure => ({ ok: false, message, data: undefined });
export const success = <T>(data: T): Success<T> => ({ ok: true, data, message: undefined });
export const unwrap = <T>(result: Result<T>) => {
	if (result.ok) return result.data;
	throw new Error(`Unwrap of failure: ${result.message}`);
}