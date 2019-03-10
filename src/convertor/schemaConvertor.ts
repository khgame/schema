import {MarkType, SDM, TDM} from "../schema";
import {Convertor} from "./base";
import {TSegConvertor} from "./tSegConvertor";
import stringify = Mocha.utils.stringify;

export class TDMConvertor extends TSegConvertor {

    constructor(public readonly tdm: TDM) {
        super(tdm.tSeg);
    }

}

export type MarkConvertorError = [number, number, any];
export type MarkConvertorResult = [boolean, any];

export class SDMConvertor extends Convertor {

    constructor(public readonly sdm: SDM) {
        super();
    }

    public validate(vs: any[]): [boolean, MarkConvertorError | (any[])] {
        const ret: any[] = [];
        for (const i in this.sdm.marks) {
            switch (this.sdm.marks[i].markType) {
                case MarkType.SDM:
                    const sdm = this.sdm.marks[i] as SDM;
                    const sdmValidate = new SDMConvertor(sdm).validate(vs);
                    if (!sdmValidate[0]) {
                        return [false, [Number(i), sdm.markIndBegin, sdmValidate[1]]];
                    } else {
                        ret.push(sdmValidate[1]);
                    }
                    break;
                case MarkType.TDM:
                    const tdm = this.sdm.marks[i] as TDM;
                    const tdmValidate = new TDMConvertor(tdm).validate(vs[tdm.markInd]);
                    if (!tdmValidate[0]) {
                        return [false, [Number(i), tdm.markInd, vs[tdm.markInd]]];
                    } else {
                        ret.push(tdmValidate[1]);
                    }
                    break;
            }
        }
        return [true, ret];
    }
}

export class SchemaConvertor extends SDMConvertor {

    public validate(vs: any[]): [boolean, MarkConvertorError | (any[])] {
        const result = super.validate(vs);
        if (result[0]) {
            return [true, result[1][0]];
        } else {
            return [false, result[1][2]];
        }
    }
}
