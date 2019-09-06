import {AliasTable, SupportedTypes} from "../constant";
import {MarkType, parseMD} from "./utils";
import * as _ from "lodash";

function reverseAlias() {
    const ret: { [typeStr: string]: string } = {};
    for (const key in AliasTable) {
        AliasTable[key].forEach((a) => {
            ret[a] = key;
        });
    }
    return ret;
}

export interface IContext {
    enums?: { [enumName: string]: { [key: string]: string | number } };
}

export const reverseAliasTable = reverseAlias();

export function getTypeNameByAlias(typeNameAlias: string) {
    return reverseAliasTable[typeNameAlias] || SupportedTypes.None;
}

export class TSegHolder {

    constructor(public readonly tSeg: TSeg,
                public readonly context?: IContext) {

    }

    public get innerCount() {
        return this.tSeg.length;
    }

    public inner(index: number) {
        return this.tSeg.nodes[index];
    }
}

export class TSeg {

    public static parse(strTSeg: string, context?: IContext): TSeg {
        let optional = false;
        if (!strTSeg) {
            return new TSeg();
        }

        if (strTSeg[strTSeg.length - 1] === "?") {
            strTSeg = strTSeg.substring(0, strTSeg.length - 1);
            optional = true;
        }
        const typeGroupStr = strTSeg.trim();

        const splitorPoses: Array<[number, number]> = [];
        for (let i = 0, depth = 0; i < typeGroupStr.length; i++) {
            switch (typeGroupStr[i]) {
                case "<":
                    depth += 1;
                    break;
                case ">":
                    depth -= 1;
                    break;
                case "|":
                    if (depth === 0) {
                        splitorPoses.push([
                            splitorPoses.length > 0 ? splitorPoses[splitorPoses.length - 1][1] + 1 : 0,
                            i,
                        ]);
                    }
                    break;
            }
        }
        splitorPoses.push([
                splitorPoses.length > 0 ? splitorPoses[splitorPoses.length - 1][1] + 1 : 0,
                typeGroupStr.length,
            ],
        );

        if (!typeGroupStr) {
            throw new Error("typeGroup not exist");
        }
        const tNodes: TNode[] = [];
        const tNodeStrs = splitorPoses.map(([from, to]: [number, number]) => typeGroupStr.substr(from, to - from));

        tNodeStrs.forEach((str: string) => {
            tNodes.push(TNode.parse(str, context));
        });

        if (optional) {
            tNodes.push(TNode.parse(SupportedTypes.Undefined, context));
        }
        return new TSeg(tNodes);
    }

    constructor(
        public readonly nodes: TNode[] = [],
    ) {
    }

    public get length() {
        return this.nodes.length;
    }

    public get(ind: number) {
        return this.nodes[ind];
    }

    public toSchemaStr() {
        return this.nodes.reduce(
            (prev, tObj) => prev + (tObj.tName === SupportedTypes.Undefined ? "?" : ("|" + tObj.toSchemaStr()))
            , "",
        ).substr(1);
    }
}

export class TNode extends TSegHolder {

    /** create node from mark string */
    public static parse(strTNode: string, context?: IContext): TNode {
        // parse template
        strTNode = strTNode.trim();
        const leftAngle = strTNode.indexOf("<");
        const rightAngle = strTNode[strTNode.length - 1] === ">" ? strTNode.length - 1 : -1;

        if (leftAngle >= 0 && rightAngle >= 0) {
            return new TNode(
                strTNode.substr(0, leftAngle).trim(),
                TSeg.parse(strTNode.substr(leftAngle + 1, rightAngle - leftAngle - 1), context),
                context,
            );
        } else if (leftAngle >= 0 || rightAngle >= 0) {
            throw new Error(`getTypeName error : angle not match ${strTNode} <(${leftAngle}) >(${rightAngle})`);
        }

        return new TNode(
            strTNode,
            new TSeg(),
            context,
        );
    }

    /**
     * the type mark in inputs, who will strict equal to the trimmed str of the mark
     * @type {string}
     */
    public rawName: string = "";

    /**
     * the trimmed and lowercase string of mark
     * @type {string}
     */
    public tName: string = "";

    protected constructor(
        name: string,
        public tSeg: TSeg,
        public context?: IContext,
    ) {
        super(tSeg, context);
        this.rawName = name.trim();
        this.tName = getTypeNameByAlias(this.rawName.toLowerCase());
    }

    public toSchemaStr() {
        if (!this.tName) {
            throw new Error("the type dose not exit");
        }
        const segStr: string = this.tSeg.toSchemaStr();
        return segStr ? `${this.tName}<${segStr}>` : `${this.tName}`;
    }

    public toSchemaJson(): any {
        if (!this.tName) {
            throw new Error("the type dose not exit");
        }
        return this.innerCount <= 0 ? this.tName : {
            tName: this.tName,
            innerTypes: this.tSeg.nodes.map((m) => m.toSchemaJson()),
        };
    }
}

export class TDM extends TSegHolder {

    public static parse(strTDM: string, markInd: number = 0, context?: IContext): TDM {
        const {mds, strLeft} = parseMD(strTDM);
        const tSeg = TSeg.parse(strLeft, context);
        return new TDM(mds, tSeg, markInd, context);
    }

    public markType = MarkType.TDM;

    constructor(
        public readonly mds: string[],
        public tSeg: TSeg,
        public readonly markInd: number = 0,
        public context?: IContext,
    ) {
        super(tSeg, context);
    }

    public toSchemaStr() {
        return `${
            this.mds.reduce((prev, cur) => prev + " " + cur, "").substr(1)} ${
            this.tSeg.toSchemaStr()}`.trim();
    }

    public toSchemaJson() {
        return {
            mds: this.mds.length > 0 ? this.mds : undefined,
            ind: this.markInd,
            tName: this.innerCount === 1 ? this.inner(0).toSchemaJson() : undefined,
            types: this.innerCount > 1 ? this.tSeg.nodes.map((m) => m.toSchemaJson()) : undefined,
        };
    }
}
