export function parseMD(markStr: string) {
    return {
        mds: markStr.match(/\$[a-zA-Z0-9_]+/g) || [],
        strLeft: markStr.replace(/\$[a-zA-Z0-9_]+/g, "").trim(),
    };
}

export enum MarkType {
    SDM = 0,
    TDM = 1,
}

export interface IMark {
    markType: MarkType;
    markInd: number; // indicates the index in origin marks list
    mds: string[]; // mark decorators list
    toSchemaStr(): string;

}
