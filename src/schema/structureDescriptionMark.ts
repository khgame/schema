import {TDM} from "./typeDescriptionMark";
import {IMark, MarkType, parseMD} from "./utils";

export enum SDMType {
    Obj,
    Arr,
}

export class SDM implements IMark {

    public static checkBeginMark(mark: string) {
        mark = mark.trim().toLowerCase();
        return mark[mark.length - 1] === "{" || mark[mark.length - 1] === "[";
    }

    public static checkEndMark(mark: string) {
        mark = mark.trim().toLowerCase();
        return mark[mark.length - 1] === "}" || mark[mark.length - 1] === "]";
    }

    public static parse(sdmType: SDMType, mds: string[], markStrs: string[], markIndBegin: number = 0): SDM {
        let ind = markIndBegin;
        const marks: IMark[] = [];
        while (ind < markStrs.length) {
            if (SDM.checkBeginMark(markStrs[ind])) {
                const {mds, strLeft} = parseMD(markStrs[markIndBegin]);
                if (strLeft.trim().length > 1) {
                    throw new Error("SDM Error: a sdm start mark should only contains mds and start quote.");
                }
                const subSdmType = strLeft === "{" ? SDMType.Obj : SDMType.Arr;
                const sdm = SDM.parse(subSdmType, mds, markStrs, ind + 1);
                marks.push(sdm);
                ind = sdm.markIndEnd + 1; // cuz the return value will consider the end quote : [)
            } else if (SDM.checkEndMark(markStrs[ind])) {
                break;
            } else {
                const tdm = TDM.parse(markStrs[ind], ind);
                marks.push(tdm);
                ind++;
            }
        }
        return new SDM(sdmType, mds, marks, markIndBegin, ind); // reach next index
    }

    public markType = MarkType.SDM;

    constructor(
        public readonly sdmType: SDMType,
        public readonly mds: string[],
        public readonly marks: IMark[],
        public readonly markIndBegin: number = 0,
        public readonly markIndEnd: number = -1, // [)
    ) {
    }

    public toSchemaStr() {
        return `${
            this.mds.reduce((prev, cur) => prev + " " + cur, "")} ${
            this.marks.reduce((prev, cur) => prev + " , " + cur.toSchemaStr(), "")}`;
    }
}
