import * as _ from "lodash";
import {SupportedTypes} from "../constant";
import {TNode, TSeg} from "../schema";
import {Convertor, ConvertResult} from "./baseConvertor";
import {getPlainConvertor} from "./plainConvertor";

export class TemplateConvertor extends Convertor {

    public static testName(name: string) {
        return name === SupportedTypes.Pair || name === SupportedTypes.Array;
    }

    public useConvertor: Convertor;

    constructor(public readonly tNode: TNode) {
        super();
        if (tNode.innerCount <= 0) {
            this.useConvertor = getPlainConvertor(SupportedTypes.Any); // if template filled with empty, fallback to any. todo: should it be something like this?
        } else if (tNode.innerCount === 1) {
            this.useConvertor = new TNodeConvertor(tNode.inner(0));
        } else {
            this.useConvertor = new RichConvertor(tNode.tSeg);
        }
    }

    public validate(v: any): ConvertResult {
        if (this.tNode.tName === SupportedTypes.Array) {
            const items = !v ? [] : ((!_.isString(v) || v.indexOf("|") < 0) ? [v] : v.split("|").map((s) => s.trim()));
            return items.map((item) => this.useConvertor.validate(item)).reduce((prev, item) => {
                prev[0] = prev[0] && item[0];
                prev[1].push(item[1]);
                return prev;
            }, [true, []]);
        } else if (this.tNode.tName === SupportedTypes.Pair) {
            if (!_.isString(v)) {
                return [false, v];
                // throw TypeError(`must be string value ${v} of pair that match the schema 'key:val'`);
            }
            if (v.indexOf(":") < 0) {
                return [false, v];
                // throw TypeError(`must be ${v} of pair that match the schema 'key:val'`);
            }
            const split = v.split(":").map((s) => s.trim());
            const kv = {
                key: split[0],
                val: split[1],
            };
            const pre = this.useConvertor.validate(kv.val);
            kv.val = pre[1];
            return [pre[0], kv];
        }
        return [false, undefined];
    }
}

export class RichConvertor extends Convertor {

    public convertors: Convertor[];

    constructor(public readonly tSeg: TSeg) {
        super();
        this.convertors = tSeg.nodes.map((tNode) => new TNodeConvertor(tNode));
    }

    public validate(v: any): ConvertResult {
        for (const i in this.convertors) {
            const ret = this.convertors[i].validate(v);
            if (ret[0]) {
                return ret;
            }
        }
        return [false, undefined];
    }
}

export class EnumConvertor extends Convertor {

    public static testName(name: string) {
        return name === SupportedTypes.Enum;
    }

    public enumNames: { [key: string]: any } = {};

    constructor(public readonly tNode: TNode) {
        super();
        // console.log("rawName", tNode.rawName);
        tNode.tSeg.nodes.forEach((tNode) => {
            let enumTable: { [key: string]: string | number | Array<string | number> };
            if (tNode.context && tNode.context.enums && (enumTable = tNode.context.enums[tNode.rawName])) {
                for (const key in enumTable) {
                    this.enumNames[key] = _.isArray(enumTable[key]) ? (enumTable[key] as Array<string | number>)[0] : enumTable[key] ;
                }
            } else {
                this.enumNames[tNode.rawName] = tNode.rawName;
            }
        });
        // console.log("enumNames", this.enumNames);
    }

    public validate(v: any): ConvertResult {
        for (const key in this.enumNames) {
            /** will try to match value first */
            const meet = (v === this.enumNames[key]) || (("" + v).trim().toLowerCase() === key.toLowerCase());
            if (meet) {
                return [true, this.enumNames[key]];
            }
        }
        return [false, v];
    }
}

export class TNodeConvertor extends Convertor {

    public useConvertor: Convertor;

    constructor(public readonly tNode: TNode) {
        super();

        if (TemplateConvertor.testName(this.tNode.tName)) {
            this.useConvertor = new TemplateConvertor(this.tNode);
        } else if (EnumConvertor.testName(this.tNode.tName)) {
            this.useConvertor = new EnumConvertor(this.tNode);
        } else {
            this.useConvertor = getPlainConvertor(this.tNode.tName);
        }

        if (!this.useConvertor) {
            throw new Error(`cannot find suitable convertor of tNode ${JSON.stringify(this.tNode)}`);
        }
    }

    public validate(v: any) {
        return this.useConvertor.validate(v);
    }
}
