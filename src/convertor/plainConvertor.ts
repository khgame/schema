import * as _ from "lodash";
import {SupportedTypes, TrueType} from "../constant";
import {Convertor} from "./base";

const plainConvertors: { [typeStr: string]: PlainConvertor } = {};

export const format = (v: any) => _.isString(v) ? v.toLowerCase().trim() : v;

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
    (cellValue) => [!!cellValue, _.toString(cellValue)]); // 不允许空串

export const undefinedConvertor = new PlainConvertor(
    SupportedTypes.Undefined,
    (cellValue) => [!cellValue, undefined]);

export const floatConvertor = new PlainConvertor(
    SupportedTypes.Float,
    (cellValue) => {
        const ret = _.toNumber(format(cellValue));
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
        pre[0] = pre[0] && _.isInteger(pre[1]);
        return pre;
    });

export const uintConvertor = new PlainConvertor(
    SupportedTypes.UInt,
    (cellValue) => {
        const pre = ufloatConvertor.validate(cellValue);
        pre[0] = pre[0] && _.isInteger(pre[1]);
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
