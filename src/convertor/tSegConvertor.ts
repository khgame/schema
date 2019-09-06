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
            this.useConvertor = new TSegConvertor(tNode.tSeg);
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

export class TSegConvertor extends Convertor {

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

    public enumNames: string[];

    constructor(public readonly tSeg: TSeg) {
        super();
        this.enumNames = tSeg.nodes.map((tNode) => tNode.rawName);
    }

    public validate(v: any): ConvertResult {
        for (const i in this.enumNames) {
            const ret = [("" + v).trim().toLowerCase() === this.enumNames[i].toLowerCase(), this.enumNames[i]] as ConvertResult;
            if (ret[0]) {
                return ret;
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
        }
        else if (EnumConvertor.testName(this.tNode.tName)) {
            this.useConvertor = new EnumConvertor(this.tNode.tSeg);
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
