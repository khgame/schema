import * as _ from "lodash";
import {SupportedTypes, TrueType} from "../constant";
import {Convertor} from "./base";

const plainConvertors: { [typeStr: string]: PlainConvertor } = {};

export const format = (v: any) => _.isString(v) ? v.toLowerCase().trim() : v;

export const isEmpty = (v: any) => v === undefined || v === null || (_.isString(v) && v.trim() === "");

export function getPlainConvertor(typeStr: string) {
    return plainConvertors[typeStr];
}

export class PlainConvertor extends Convertor {
    constructor(public readonly typeName: string, public validate: (v: any) => [boolean, any]) {
        super();
        plainConvertors[typeName] = this;
    }
}

export const strConvertor = new PlainConvertor(
    SupportedTypes.String,
    (cellValue) => [cellValue !== null && cellValue !== undefined, _.toString(cellValue)]); // 不允许空串

export const undefinedConvertor = new PlainConvertor(
    SupportedTypes.Undefined,
    (cellValue) => [cellValue === null || cellValue === undefined || (typeof cellValue === "string" && cellValue.trim() === ""), undefined]);

export const floatConvertor = new PlainConvertor(
    SupportedTypes.Float,
    (cellValue) => {
        if (isEmpty(cellValue)) {
            return [false, cellValue];
        }
        const ret = _.toNumber(format(cellValue));
        if (_.isNaN(ret)) { // its not empty, and parsed as NAN
            throw new Error(`ERROR!! : NAN detected => ${cellValue}`);
        }
        return [undefined !== ret && !_.isNaN(ret), ret];
    });

export const ufloatConvertor = new PlainConvertor(
    SupportedTypes.UFloat,
    (cellValue) => {
        const pre = floatConvertor.validate(cellValue);
        pre[0] = pre[0] && pre[1] >= 0;
        return pre;
    });

export const intConvertor = new PlainConvertor(
    SupportedTypes.Int,
    (cellValue) => {
        const pre = floatConvertor.validate(cellValue);
        const intValue = Math.round(pre[1]);
        pre[0] = pre[0] && Math.abs(intValue - pre[1]) < 0.0000000000001;
        if (pre[0]) {
            pre[1] = intValue;
        }
        return pre;
    });

export const uintConvertor = new PlainConvertor(
    SupportedTypes.UInt,
    (cellValue) => {
        const pre = ufloatConvertor.validate(cellValue);
        const intValue = Math.round(pre[1]);
        pre[0] = pre[0] && Math.abs(intValue - pre[1]) < 0.0000000000001;
        if (pre[0]) {
            pre[1] = intValue;
        }
        return pre;
    });

export const boolConvertor = new PlainConvertor(
    SupportedTypes.Boolean,
    (cellValue) => {
        const ret = format(cellValue);
        return [
            _.isBoolean(ret) || _.isNumber(ret) || _.isString(ret),
            ret === true ||
            (_.isNumber(ret) && ret > 0) ||
            (_.isString(ret) && TrueType.indexOf(ret) >= 0),
        ];
    });

export const anyConvertor = new PlainConvertor(
    SupportedTypes.Any,
    (cellValue) => [true, cellValue],
);
