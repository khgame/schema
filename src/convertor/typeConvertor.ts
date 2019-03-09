import * as _ from "lodash";
import {SupportedTypes} from "../constant";
import {SchemaNode} from "../schema";
import {Convertor} from "./base";
import {getPlainConvertor} from "./plainConvertor";

export class TemplateConvertor extends Convertor {

    public innerConvertor?: Convertor = undefined;

    constructor(public readonly schemaNode: SchemaNode) {
        super();
        if (schemaNode.innerCount > 0) {
            this.innerConvertor = getConvertor(schemaNode.nodes);
        }
    }

    get useConvertor() {
        if (this.innerConvertor) {
            return this.innerConvertor;
        }
        return getPlainConvertor(SupportedTypes.Any); // if template filled with empty, fallback to any
    }

    public validate(v: any): [boolean, any] {
        if (this.schemaNode.typeName === SupportedTypes.Array) {
            const items = !v ? [] : ((!_.isString(v) || v.indexOf("|") < 0) ? [v] : v.split("|").map((s) => s.trim()));
            const result = items.map((item) => this.useConvertor.validate(item)).reduce((prev, item) => {
                prev[0] = prev[0] && item[0];
                prev[1].push(item[1]);
                return prev;
            }, [true, []]);
            return result;
        } else if (this.schemaNode.typeName === SupportedTypes.Pair) {
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

    constructor(public readonly schemaNode: SchemaNode) {
        super();
        this.useConvertor = this.schemaNode.innerCount <= 0 ?
            getPlainConvertor(this.schemaNode.typeName) :
            new TemplateConvertor(schemaNode);
    }

    public validate(v: any) {
        return this.useConvertor.convert(v);
    }
}

export class GroupConvertor extends Convertor {

    public convertors: Convertor[];

    constructor(public readonly schemaNodes: SchemaNode[]) {
        super();
        this.convertors = schemaNodes.map((tObj) => new TypeConvertor(tObj));
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

export function getConvertor(schemaNodes: SchemaNode[]) {
    if (schemaNodes.length <= 0) {
        throw new Error("type missed");
    } else if (schemaNodes.length === 1) {
        return new TypeConvertor(schemaNodes[0]);
    } else {
        return new GroupConvertor(schemaNodes);
    }
}
