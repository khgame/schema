export function parseMD(markStr: string) {
    return {
        mds: markStr.match(/\$[a-zA-Z0-9_]+/g) || [],
        strLeft: markStr.replace(/\$[a-zA-Z0-9_]+/g, "").trim(),
    };
}

export enum MarkType {
    SDM,
    TDM,
}

export interface IMark {
    markType: MarkType;
}
