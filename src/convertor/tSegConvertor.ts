import * as _ from "lodash";
import {SupportedTypes} from "../constant";
import {TNode, TSeg} from "../schema";
import {Convertor} from "./base";
import {getPlainConvertor} from "./plainConvertor";

function isTemplateNode(tNode: TNode) {
    return tNode.tName === SupportedTypes.Pair || tNode.tName === SupportedTypes.Array;
}

export class TemplateConvertor extends Convertor {

    public useConvertor: Convertor;

    constructor(public readonly tNode: TNode) {
        super();
        if (tNode.innerCount <= 0) {
            this.useConvertor = getPlainConvertor(SupportedTypes.Any); // if template filled with empty, fallback to any
        } else if (tNode.innerCount === 1) {
            this.useConvertor = new TNodeConvertor(tNode.inner(0));
        } else {
            this.useConvertor = new TSegConvertor(tNode.tSeg);
        }
    }

    public validate(v: any): [boolean, any] {
        if (this.tNode.tName === SupportedTypes.Array) {
            const items = !v ? [] : ((!_.isString(v) || v.indexOf("|") < 0) ? [v] : v.split("|").map((s) => s.trim()));
            return items.map((item) => this.useConvertor.validate(item)).reduce((prev, item) => {
                prev[0] = prev[0] && item[0];
                prev[1].push(item[1]);
                return prev;
            }, [true, []]);
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

export class TNodeConvertor extends Convertor {

    public useConvertor: Convertor;

    constructor(public readonly tNode: TNode) {
        super();
        this.useConvertor = isTemplateNode(this.tNode) ?
            new TemplateConvertor(this.tNode) :
            getPlainConvertor(this.tNode.tName);
        if(!this.useConvertor) {
            throw new Error(`cannot find suitable convertor of tNode ${JSON.stringify(this.tNode)}`)
        }
    }

    public validate(v: any) {
        return this.useConvertor.validate(v);
    }
}

export class TSegConvertor extends Convertor {

    public convertors: Convertor[];

    constructor(public readonly tSeg: TSeg) {
        super();
        this.convertors = tSeg.nodes.map((tNode) => new TNodeConvertor(tNode));
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
