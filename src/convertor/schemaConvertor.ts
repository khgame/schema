import {IMark, MarkType, SDM, SDMType, TDM} from "../schema";
import {Convertor, ConvertResult} from "./base";
import {isEmpty} from "./plainConvertor";
import {TSegConvertor} from "./tSegConvertor";

export interface ISDMConvertResult {
    [markInd: number]: ConvertResult;
}

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

export function MarkConvertorResultToErrorStack(result: [boolean, ISDMConvertResult | undefined]): any {
    if (!result[0]) { // when convertResult[0] is false, convertResult[1] is the error info
        const errorMap: any = {};
        const convertResults: ISDMConvertResult | undefined = result[1];
        if (!convertResults) {
            return "__UNDEFINED__";
        }
        // console.log("convertResults", convertResults);
        for (const markIndStr in convertResults) {
            const markInd = Number(markIndStr);
            const convertResult = convertResults[markInd];
            if (convertResult[0]) {
                continue;
            }
            // console.log("convertResult", convertResult);
            const child = MarkConvertorResultToErrorStack(convertResult);
            errorMap[markInd] = Object.keys(child).length <= 0 ? convertResult[1] : child;
        }
        return errorMap;
    }
}

export class SDMConvertor extends Convertor {

    public converLst: Convertor[] = [];

    constructor(public readonly sdm: SDM) {
        super();
        // console.log(`init sdm convertor ${this.sdm.markIndBegin} ${this.sdm.markIndEnd} ${this.sdm.mds}`);
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

    public validate(vs: any[]): [boolean, ISDMConvertResult | undefined] {
        // console.log("SDMConvertor.validate", this.sdm.markIndBegin, this.sdm.markIndEnd, JSON.stringify(this.sdm))

        const ret: any = {};

        /** validate all */
        for (const i in this.sdm.marks) {
            const ind = Number(i);
            const mark: IMark = this.sdm.marks[ind];
            // console.log(">", ind, mark.markInd, "in [", this.sdm.markIndBegin, this.sdm.markIndEnd, ")", mark.mds)
            switch (mark.markType) {
                case MarkType.SDM:
                    const sdmResult = (this.getConvertor(ind) as SDMConvertor).validate(vs);

                    if (sdmResult[1]) { // when it is [true, undefined] ?
                        ret[mark.markInd] = sdmResult;
                    }
                    break;
                case MarkType.TDM:
                    const originValue = vs[mark.markInd];
                    const tdmValidate = (this.getConvertor(ind) as TDMConvertor).validate(originValue);
                    if (!tdmValidate[0]) {
                        ret[mark.markInd] = [false, originValue]; // when failed, record originValue
                    } else {
                        ret[mark.markInd] = tdmValidate;
                    }
                    break;
            }
        }

        const allPassed = Object.keys(ret).reduce(
            (aggregate, ind) => aggregate && ret[Number(ind)][0], true);
        const allUndefined = Object.keys(ret).reduce(
            (aggregate, ind) => aggregate && isEmpty(ret[Number(ind)][1]), true);
        const allUnPassedUndefined = Object.keys(ret).reduce(
            (aggregate, ind) => aggregate && (ret[Number(ind)][0] || isEmpty(ret[Number(ind)][1])), true);
        switch (this.sdm.sdmType) {
            case SDMType.Arr:
                // console.log("arr ", this.sdm.markIndBegin + " " + this.sdm.markIndEnd + " " + this.sdm.mds.length, ret);
                if (this.sdm.hasDecorator("$ghost") && allUndefined) { // $ghost tag exist, when it's all undefined, returns undefined
                    return [true, undefined]; // just like a tdm
                }
                if (!this.sdm.hasDecorator("$strict") && allUnPassedUndefined) {
                    return [true, ret];
                }
                break;
            case SDMType.Obj:
                // console.log(`$ghost ${this.sdm.markIndBegin} ${this.sdm.markIndEnd} ${this.sdm.mds.length}`);
                if (this.sdm.hasDecorator("$ghost") && allUndefined) {
                    return [true, undefined]; // just like a tdm
                }
                break;
        }
        return [allPassed, ret];
    }

    public convert(v: any) {
        const validateRet = this.validate(v);
        if (!validateRet[0]) {
            const stack = MarkConvertorResultToErrorStack(validateRet);
            throw TypeError("Validate Failed : Error Stack :" +
                JSON.stringify(stack, null, 2));
        }
        return validateRet[1];
    }
}

export class SchemaConvertor extends SDMConvertor {

    // public validate(vs: any[]):[boolean, SDMConvertResult|undefined] {
    //     const result = super.validate(vs);
    //     return result; // jump over the first object
    // }
}
