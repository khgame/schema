import {IMark, MarkType, SDM, SDMType, TDM} from "../schema";
import {Convertor} from "./base";
import {TSegConvertor} from "./tSegConvertor";
import stringify = Mocha.utils.stringify;

export class TDMConvertor extends TSegConvertor {

    constructor(public readonly tdm: TDM) {
        super(tdm.tSeg);
    }

    public convert(v: any) {
        try {
            super.convert(v);
        } catch (e) {
            throw new Error(`tdm[${this.tdm.markInd}] ${e.message}`);
        }
    }

}

export type MarkConvertorError = [number, number, any];
export type MarkConvertorResult = [boolean, MarkConvertorError | any];

export class SDMConvertor extends Convertor {

    public converLst: Convertor[] = [];

    constructor(public readonly sdm: SDM) {
        super();
        console.log(`init sdm convertor ${this.sdm.markIndBegin} ${this.sdm.markIndEnd} ${this.sdm.mds}`);
    }

    public getConvertor(ind: number) {
        const mark = this.sdm.marks[ind];
        if (!mark) {
            return undefined;
        }
        if (this.converLst[ind]) {
            return this.converLst[ind];
        }
        switch (mark.markType) {
            case MarkType.SDM:
                this.converLst[ind] = new SDMConvertor(mark as SDM);
                break;
            case  MarkType.TDM:
                this.converLst[ind] = new TDMConvertor(mark as TDM);
                break;
        }
        return this.converLst[ind];
    }

    public validate(vs: any[]): MarkConvertorResult {
        // console.log("SDMConvertor.validate", this.sdm.markIndBegin, this.sdm.markIndEnd, JSON.stringify(this.sdm))

        const ret: MarkConvertorResult[] = [];
        for (const i in this.sdm.marks) {
            const ind = Number(i);
            const mark: IMark = this.sdm.marks[ind];
            // console.log(">", ind, mark.markInd, "in [", this.sdm.markIndBegin, this.sdm.markIndEnd, ")", mark.mds)
            switch (mark.markType) {
                case MarkType.SDM:
                    const sdmValidate = (this.getConvertor(ind) as SDMConvertor).validate(vs);
                    if (!sdmValidate[0]) {
                        ret.push([false, [ind, mark.markInd, sdmValidate[1]]]);
                    } else {
                        ret.push([true, [ind, mark.markInd, sdmValidate[1]]]);
                    }
                    break;
                case MarkType.TDM:
                    const originValue = vs[mark.markInd];
                    const tdmValidate = (this.getConvertor(ind) as TDMConvertor).validate(originValue);
                    if (!tdmValidate[0]) {
                        ret.push([false, [ind, mark.markInd, originValue]]);
                    } else {
                        ret.push([true, [ind, mark.markInd, tdmValidate[1]]]);
                    }
                    break;
            }
        }

        const allPassed = ret.reduce((aggregate, cur) => aggregate && cur[0], true);
        const allUndefined = ret.reduce((aggregate, cur) => aggregate && cur[1][2] === undefined, true);
        const allUnpassedUndefined = ret.reduce((aggregate, cur) => aggregate && (cur[0] || cur[1][2] === undefined), true);
        switch (this.sdm.sdmType) {
            case SDMType.Arr:
                // console.log(`$strict ${this.sdm.markIndBegin} ${this.sdm.markIndEnd} ${this.sdm.mds.length}`);
                if (this.sdm.mds.indexOf("$ghost") >= 0 && allUndefined) {
                    return [true, undefined];
                }
                if (this.sdm.mds.indexOf("$strict") < 0 && allUnpassedUndefined) {
                    return [true, ret];
                }
                break;
            case SDMType.Obj:
                // console.log(`$ghost ${this.sdm.markIndBegin} ${this.sdm.markIndEnd} ${this.sdm.mds.length}`);
                if (this.sdm.mds.indexOf("$ghost") >= 0 && allUndefined) {
                    return [true, undefined];
                }
                break;
        }
        return [allPassed, ret];
    }

    public convert(v: any) {
        try {
            super.convert(v);
        } catch (e) {
            throw new Error(`sdm[${this.sdm.markIndBegin},${this.sdm.markIndEnd}] ${e.message}`);
        }
    }
}

export class SchemaConvertor extends SDMConvertor {

    public validate(vs: any[]): MarkConvertorResult {
        const result = super.validate(vs);
        return result[1]; // jump over the first object
    }
}
