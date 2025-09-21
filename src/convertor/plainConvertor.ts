import * as _ from "lodash";
import {SupportedTypes, TrueType} from "../constant";
import {ConvertOptions, Convertor, ConvertResult} from "./baseConvertor";

const plainConvertors: { [typeStr: string]: PlainConvertor } = {};

export const format = (v: any) => _.isString(v) ? v.toLowerCase().trim() : v;

export const isEmpty = (v: any) => v === undefined || v === null || (_.isString(v) && v.trim() === "");

export function getPlainConvertor(typeStr: string) {
    return plainConvertors[typeStr];
}

export class PlainConvertor extends Convertor {
    constructor(public readonly typeName: string, private readonly validator: (this: PlainConvertor, v: any, options?: ConvertOptions) => ConvertResult) {
        super();
        plainConvertors[typeName] = this;
    }

    public validate(v: any, options: ConvertOptions = {}): ConvertResult {
        return this.validator.call(this, v, options);
    }
}

function failByType(this: PlainConvertor, raw: any, message: string, options?: ConvertOptions) {
    return this.fail(message, { raw, path: options?.path });
}

export const strConvertor = new PlainConvertor(
    SupportedTypes.String,
    function(cellValue, options) {
        if (cellValue === null || cellValue === undefined) {
            return failByType.call(this, cellValue, "string required", options);
        }
        return this.ok(_.toString(cellValue));
    });

export const undefinedConvertor = new PlainConvertor(
    SupportedTypes.Undefined,
    function(cellValue, options) {
        const allowed = cellValue === null || cellValue === undefined || (typeof cellValue === "string" && cellValue.trim() === "");
        return allowed ? this.ok(undefined) : failByType.call(this, cellValue, "must be empty or undefined", options);
    });

export const floatConvertor = new PlainConvertor(
    SupportedTypes.Float,
    function(cellValue, options) {
        if (isEmpty(cellValue)) {
            return failByType.call(this, cellValue, "number required", options);
        }
        const ret = _.toNumber(format(cellValue));
        if (_.isNaN(ret)) {
            return this.fail("invalid number", { raw: cellValue, path: options?.path });
        }
        return this.ok(ret);
    });

export const ufloatConvertor = new PlainConvertor(
    SupportedTypes.UFloat,
    function(cellValue, options) {
        const pre = floatConvertor.validate(cellValue, options);
        if (!pre.ok) {
            return pre;
        }
        if ((pre.value as number) < 0) {
            return this.fail("must be >= 0", { raw: cellValue, path: options?.path });
        }
        return pre;
    });

export const intConvertor = new PlainConvertor(
    SupportedTypes.Int,
    function(cellValue, options) {
        const pre = floatConvertor.validate(cellValue, options);
        if (!pre.ok) {
            return pre;
        }
        const intValue = Math.round(pre.value as number);
        if (Math.abs(intValue - (pre.value as number)) >= 0.0000000000001) {
            return this.fail("must be integer", { raw: cellValue, path: options?.path });
        }
        return this.ok(intValue);
    });

export const uintConvertor = new PlainConvertor(
    SupportedTypes.UInt,
    function(cellValue, options) {
        const pre = intConvertor.validate(cellValue, options);
        if (!pre.ok) {
            return pre;
        }
        if ((pre.value as number) < 0) {
            return this.fail("must be unsigned integer", { raw: cellValue, path: options?.path });
        }
        return pre;
    });

export const boolConvertor = new PlainConvertor(
    SupportedTypes.Boolean,
    function(cellValue, options) {
        const ret = format(cellValue);
        const acceptable = _.isBoolean(ret) || _.isNumber(ret) || _.isString(ret);
        if (!acceptable) {
            return this.fail("boolean required", { raw: cellValue, path: options?.path });
        }
        const value = ret === true ||
            (_.isNumber(ret) && ret > 0) ||
            (_.isString(ret) && TrueType.indexOf(ret) >= 0);
        return this.ok(value);
    });

export const anyConvertor = new PlainConvertor(
    SupportedTypes.Any,
    function(cellValue, _options) {
        return this.ok(cellValue);
    },
);

export const noneConvertor = new PlainConvertor(
    SupportedTypes.None,
    function(cellValue, _options) {
        return this.ok(cellValue);
    },
);
