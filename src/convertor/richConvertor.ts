import * as _ from "lodash";
import {SupportedTypes} from "../constant";
import {TNode, TSeg} from "../schema";
import {ConvertError, ConvertOptions, Convertor, ConvertResult} from "./baseConvertor";
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

    public validate(v: any, options: ConvertOptions = {}): ConvertResult {
        const basePath = options.path || [];
        if (this.tNode.tName === SupportedTypes.Array) {
            const items = !v ? [] : ((!_.isString(v) || v.indexOf("|") < 0) ? [v] : v.split("|").map((s) => s.trim()));
            const childResults = items.map((item, index) => {
                const childPath = [...basePath, index];
                return this.useConvertor.validate(item, { ...options, path: childPath });
            });
            const merged = this.merge(childResults);
            if (merged.ok) {
                return this.ok(merged.value);
            }
            return merged;
        } else if (this.tNode.tName === SupportedTypes.Pair) {
            if (!_.isString(v)) {
                return this.fail("pair requires string input", { raw: v, path: basePath });
            }
            if (v.indexOf(":") < 0) {
                return this.fail("pair value must contain ':'", { raw: v, path: basePath });
            }
            const split = v.split(":").map((s) => s.trim());
            const kv = {
                key: split[0],
                val: split[1],
            };
            const pre = this.useConvertor.validate(kv.val, { ...options, path: [...basePath, "val"] });
            if (!pre.ok) {
                return {
                    ok: false,
                    errors: pre.errors,
                };
            }
            kv.val = pre.value;
            return this.ok(kv);
        }
        return this.fail("unsupported template", { raw: v, path: basePath });
    }
}

export class RichConvertor extends Convertor {

    public convertors: Convertor[];

    constructor(public readonly tSeg: TSeg) {
        super();
        this.convertors = tSeg.nodes.map((tNode) => new TNodeConvertor(tNode));
    }

    public validate(v: any, options: ConvertOptions = {}): ConvertResult {
        const errors: ConvertError[] = [];
        for (const convertor of this.convertors) {
            const ret = convertor.validate(v, options);
            if (ret.ok) {
                return ret;
            }
            errors.push(...ret.errors);
        }
        return { ok: false, errors: errors.length > 0 ? errors : [{ message: "no union branch matched", raw: v, path: options.path }] };
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

    public validate(v: any, options: ConvertOptions = {}): ConvertResult {
        for (const key in this.enumNames) {
            /** will try to match value first */
            const meet = (v === this.enumNames[key]) || (("" + v).trim().toLowerCase() === key.toLowerCase());
            if (meet) {
                return this.ok(this.enumNames[key]);
            }
        }
        return this.fail("enum value not found", { raw: v, path: options.path });
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

    public validate(v: any, options: ConvertOptions = {}): ConvertResult {
        return this.useConvertor.validate(v, options);
    }
}
