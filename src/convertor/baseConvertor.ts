export interface ConvertError {
    message: string;
    path?: Array<string | number>;
    raw?: any;
    cause?: any;
}

export interface ConvertOptions {
    failFast?: boolean;
    path?: Array<string | number>;
}

export interface ConvertResult<T = any> {
    ok: boolean;
    value?: T;
    errors: ConvertError[];
}

export interface IConvertor<T = any> {
    convert(v: any, options?: ConvertOptions): ConvertResult<T>;
    validate(v: any, options?: ConvertOptions): ConvertResult<T>;
}

export abstract class Convertor<T = any> implements IConvertor<T> {

    public convert(v: any, options: ConvertOptions = {}): ConvertResult<T> {
        const result = this.validate(v, options);
        if (!result.ok && options.failFast) {
            const firstError = result.errors[0] || { message: "conversion failed", raw: v };
            const error = new TypeError(firstError.message);
            (error as any).convertErrors = result.errors;
            throw error;
        }
        return result;
    }

    public abstract validate(v: any, options?: ConvertOptions): ConvertResult<T>;

    public ok(value: T): ConvertResult<T> {
        return { ok: true, value, errors: [] };
    }

    public fail(message: string, data: { path?: Array<string | number>; raw?: any; cause?: any } = {}): ConvertResult<T> {
        return {
            ok: false,
            errors: [{ message, path: data.path, raw: data.raw, cause: data.cause }],
        };
    }

    protected merge(results: Array<ConvertResult<any>>): ConvertResult<any[]> {
        const value: any[] = [];
        const errors: ConvertError[] = [];
        let ok = true;
        results.forEach((r, index) => {
            if (r.ok) {
                value[index] = r.value;
            } else {
                ok = false;
                errors.push(...r.errors);
            }
        });
        return ok ? { ok, value, errors: [] } : { ok, errors };
    }
}
