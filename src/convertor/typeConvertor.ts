import * as _ from "lodash";
import {SupportedTypes} from "../constant";
import {TNode, TSeg} from "../schema";
import {Convertor} from "./base";
import {getPlainConvertor} from "./plainConvertor";

export class TemplateConvertor extends Convertor {

    public innerConvertor?: Convertor = undefined;

    constructor(public readonly tNode: TNode) {
        super();
        if (tNode.innerCount > 0) {
            this.innerConvertor = getConvertor(tNode.tSeg);
        }
    }

    get useConvertor() {
        if (this.innerConvertor) {
            return this.innerConvertor;
        }
        return getPlainConvertor(SupportedTypes.Any); // if template filled with empty, fallback to any
    }

    public validate(v: any): [boolean, any] {
        if (this.tNode.tName === SupportedTypes.Array) {
            const items = !v ? [] : ((!_.isString(v) || v.indexOf("|") < 0) ? [v] : v.split("|").map((s) => s.trim()));
            const result = items.map((item) => this.useConvertor.validate(item)).reduce((prev, item) => {
                prev[0] = prev[0] && item[0];
                prev[1].push(item[1]);
                return prev;
            }, [true, []]);
            return result;
        } else if (this.tNode.tName === SupportedTypes.Pair) {
            if (!_.isString(v)) {
                throw TypeError(`must be string value ${v} of pair that match the schema 'key:val'`);
            }
            if (v.indexOf(":") < 0) {
                throw TypeError(`must be ${v} of pair that match the schema 'key:val'`);
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

export class TypeConvertor extends Convertor {

    public useConvertor: Convertor;

    constructor(public readonly tNode: TNode) {
        super();
        this.useConvertor = this.tNode.innerCount <= 0 ?
            getPlainConvertor(this.tNode.tName) :
            new TemplateConvertor(this.tNode);
    }

    public validate(v: any) {
        return this.useConvertor.convert(v);
    }
}

export class GroupConvertor extends Convertor {

    public convertors: Convertor[];

    constructor(public readonly tSeg: TSeg) {
        super();
        this.convertors = tSeg.nodes.map((tObj) => new TypeConvertor(tObj));
    }

    public validate(v: any): [boolean, any] {
        for (const i in this.convertors) {
            const ret = this.convertors[i].validate(v);
            if (ret[0]) {
                return ret;
            }
        }
        return [false, undefined];
    }
}

export function getConvertor(tSeg: TSeg) {
    if (tSeg.length <= 0) {
        throw new Error("type missed");
    } else if (tSeg.length === 1) {
        return new TypeConvertor(tSeg.get(0));
    } else {
        return new GroupConvertor(tSeg);
    }
}
