declare global {
    interface Promise<T> {
        toResult<T, E> (this: Promise<T>): Promise<Result<T, E>>;
    }
}

Promise.prototype.toResult = async function<T, E> (this: Promise<T>) {
    return Result.tryCatchAsync<T, E>(this);
}

export class ResultEmptyError extends Error {
    constructor() {
        super("ResultEmptyError")
    }
}

export class Result<R, E> {
    readonly result: R | null;
    readonly error: E | null;

    private constructor(result: R | null, error: E | null) {
        this.result = result;
        this.error = error;
    }

    orElse(other: R): R {
        if (this.error) return other;
        return this.result as R;
    }

    orElseGet(supplier: () => R): R {
        if (this.error) return supplier();
        return this.result as R;
    }

    async orElseAwait(supplier: () => Promise<R>): Promise<R> {
        if (this.error) return await supplier();
        return this.result as R;
    }

    orElseThrow(supplier: () => E): R {
        if (this.error) throw supplier();
        return this.result as R;
    }

    orThrow(): R {
        if (this.isError()) throw this.error ?? new ResultEmptyError();
        return this.result as R;
    }

    orNull(): R | null {
        if (this.isError()) return null;
        return this.result;
    }

    isError() {
        return !this.result || !!this.error;
    }

    hasResult() {
        return !!this.result && !this.error;
    }

    toString() {
        return this.isError() ? `${this.error}` : `${this.result}`;
    }

    static of<R> (value: R | null | undefined): Result<R, ResultEmptyError | null> {
        if (!!value) return new Result(value as R, null);
        return new Result(null as R, new ResultEmptyError());
    }

    static ok<R, E> (result: R): Result<R, E> {
        return new Result(result, null as E);
    }

    static err<R, E> (error: E): Result<R, E> {
        return new Result(null as R, error);
    }

    static empty<R> (): Result<R, ResultEmptyError> {
        return new Result(null as R, new ResultEmptyError());
    }

    static tryCatch<R, E>(supplier: () => R): Result<R, E> {
        try {
            return new Result(supplier(), null as E);
        } catch (error) {
            return new Result(null as R, error as E);
        }
    }

    static async tryCatchAsync<R, E>(promise: Promise<R>): Promise<Result<R, E>> {
        try {
            return new Result(await promise, null as E);
        } catch (error) {
            return new Result(null as R, error as E);
        }
    }
};
