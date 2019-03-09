import {AliasTable, SupportedTypes} from "../constant";
import {MarkType, parseMD} from "./utils";

function reverseAlias() {
    const ret: { [typeStr: string]: string } = {};
    for (const key in AliasTable) {
        AliasTable[key].forEach((a) => {
            ret[a] = key;
        });
    }
    return ret;
}

export const reverseAliasTable = reverseAlias();

export function getTypeNameByAlias(typeNameAlias: string) {
    return reverseAliasTable[typeNameAlias] || SupportedTypes.None;
}

export class TSegHolder {
    constructor(public readonly tSeg: TSeg) {

    }

    public get innerCount() {
        return this.tSeg.length;
    }

    public inner(index: number) {
        return this.tSeg.nodes[index];
    }
}

export class TSeg {

    public static parse(strTSeg: string): TSeg {
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
        const nodes: TNode[] = splitorPoses.map(
            (splitorPos) => TNode.parse(typeGroupStr.substr(splitorPos[0], splitorPos[1] - splitorPos[0])),
        );
        if (optional) {
            nodes.push(new TNode(SupportedTypes.Undefined));
        }
        return new TSeg(nodes);
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

    public static parse(strTNode: string): TNode {
        // parse template
        strTNode = strTNode.toLowerCase().trim();
        const leftAngle = strTNode.indexOf("<");
        const rightAngle = strTNode[strTNode.length - 1] === ">" ? strTNode.length - 1 : -1;
        if (leftAngle >= 0 && rightAngle >= 0) {
            return new TNode(
                getTypeNameByAlias(strTNode.substr(0, leftAngle).trim()),
                TSeg.parse(strTNode.substr(leftAngle + 1, rightAngle - leftAngle - 1)),
            );
        } else if (leftAngle >= 0 || rightAngle >= 0) {
            throw new Error(`getTypeName error : angle not match ${strTNode} <(${leftAngle}) >(${rightAngle})`);
        }
        return new TNode(getTypeNameByAlias(strTNode));
    }

    constructor(
        public readonly tName: string,
        public readonly tSeg: TSeg = new TSeg(),
    ) {
        super(tSeg);
    }

    public toSchemaStr() {
        if (!this.tName) {
            throw new Error("the type dose not exit");
        }
        const segStr: string = this.tSeg.toSchemaStr();
        return segStr ? `${this.tName}<${segStr}>` : `${this.tName}`;
    }
}

export class TDM extends TSegHolder {

    public static parse(strTDM: string, markInd: number = 0): TDM {
        const {mds, strLeft} = parseMD(strTDM);
        const tSeg = TSeg.parse(strLeft);
        return new TDM(mds, tSeg, markInd);
    }

    public markType = MarkType.TDM;

    constructor(
        public readonly mds: string[],
        public readonly tSeg: TSeg,
        public readonly markInd: number = 0,
    ) {
        super(tSeg);
    }

    public toSchemaStr() {
        return `${
            this.mds.reduce((prev, cur) => prev + " " + cur, "")} ${
            this.tSeg.toSchemaStr()}`;
    }
}
