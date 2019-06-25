import {TDM} from "./typeDescriptionMark";
import {IMark, MarkType, parseMD} from "./utils";

export enum SDMType {
    Obj = 0,
    Arr = 1,
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
                const {mds, strLeft} = parseMD(markStrs[ind]);
                if (strLeft.trim().length > 1) {
                    throw new Error(`SDM Error: the sdm start mark(${strLeft}) should only contains mds and start quote.`);
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
        // console.log("mds => ", mds)
        return new SDM(sdmType, mds, marks, markIndBegin, ind); // reach next index
    }

    public markType = MarkType.SDM;

    public get markInd() {
        return this.markIndBegin; // equal to the first element's position
    }

    constructor(
        public readonly sdmType: SDMType,
        public readonly mds: string[],
        public readonly marks: IMark[],
        public readonly markIndBegin: number = 0,
        public readonly markIndEnd: number = -1, // [)
    ) {
        // console.log("sdm created mds", this.mds, this.marks);
    }

    public hasDecorator(decorator: string) {
        return this.mds.indexOf(decorator) >= 0;
    }

    public toSchemaStr() {
        return `${
            this.mds.reduce((prev, cur) => prev + " " + cur, "").substr(1)} ${
            this.sdmType === SDMType.Obj ? "{" : "["} ${
            this.marks.reduce((prev, cur) => prev + ", " + cur.toSchemaStr(), "").substr(1).trim()} ${
            this.sdmType === SDMType.Obj ? "}" : "]"}`.trim();
    }

    public toSchemaJson() {
        return {
            mds: this.mds.length > 0 ? this.mds : undefined,
            fromTo: [this.markIndBegin, this.markIndEnd],
            children: this.marks.map((m) => m.toSchemaJson()),
        };
    }
}
