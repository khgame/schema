import {MarkType, SDM, TDM} from "../schema";
import {Convertor} from "./base";
import {TSegConvertor} from "./tSegConvertor";

export class TDMConvertor extends TSegConvertor {

    constructor(public readonly tdm: TDM) {
        super(tdm.tSeg);
    }

}

export class SDMConvertor extends Convertor {

    constructor(public readonly sdm: SDM) {
        super();
    }

    public validate(vs: any[]): [boolean, any] {
        const ret: Array<[boolean, any]> = []
        for (const i in this.sdm.marks) {
            switch (this.sdm.marks[i].markType) {
                case MarkType.SDM:
                    const sdm = this.sdm.marks[i] as SDM;
                    const sdmConvert = new SDMConvertor(sdm).validate(vs);
                    if (!sdmConvert[0]) {
                        return [false, [i, sdmConvert[1]]];
                    } else {
                        ret.push(sdmConvert);
                    }
                    break;
                case MarkType.TDM:
                    const tdm = this.sdm.marks[i] as TDM;
                    const tdmConvert = new TDMConvertor(tdm).validate(vs[tdm.markInd]);
                    if (!tdmConvert[0]) {
                        return [false, [i, tdm.markInd]];
                    } else {
                        ret.push(tdmConvert);
                    }
                    break;
            }
        }
        return [true, ret];
    }
}
