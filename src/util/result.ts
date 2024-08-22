export type Result<T> = Success<T> | Failure;

export type Success<T> = { ok: true; data: T };
export type Failure = { ok: false; message: string };

export const failure = (message: string): Failure => ({ ok: false, message });
export const success = <T>(data: T): Success<T> => ({ ok: true, data });
export const unwrap = <T>(result: Result<T>) => {
	if (result.ok) return result.data;
	throw new Error(`Unwrap of failure: ${result.message}`);
}