import {IMark, MarkType, SDM, SDMType, TDM} from "../schema";
import {ConvertError, ConvertOptions, ConvertResult, Convertor} from "./baseConvertor";
import {isEmpty} from "./plainConvertor";
import {RichConvertor} from "./richConvertor";

export class TDMConvertor extends RichConvertor {

    constructor(public readonly tdm: TDM) {
        super(tdm.tSeg);
    }
}

export interface ISDMConvertResult {
    [markInd: number]: ConvertResult;
}

function appendPath(path: Array<string | number> | undefined, addition: string | number) {
    const next = path ? [...path] : [];
    next.push(addition);
    return next;
}

export class SDMConvertor extends Convertor<ISDMConvertResult | undefined> {

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

    public validate(vs: any[], options: ConvertOptions = {}): ConvertResult<ISDMConvertResult | undefined> {
        const ret: ISDMConvertResult = {};

        /** validate all */
        for (const i in this.sdm.marks) {
            const ind = Number(i);
            const mark: IMark = this.sdm.marks[ind];
            const markPath = appendPath(options.path, mark.markInd);
            switch (mark.markType) {
                case MarkType.SDM: {
                    const sdmResult = (this.getConvertor(ind) as SDMConvertor).validate(vs, { ...options, path: markPath });
                    ret[mark.markInd] = sdmResult;
                    break;
                }
                case MarkType.TDM: {
                    const originValue = vs[mark.markInd];
                    const tdmValidate = (this.getConvertor(ind) as TDMConvertor).validate(originValue, { ...options, path: markPath });
                    ret[mark.markInd] = tdmValidate;
                    break;
                }
            }
        }

        const entries = Object.keys(ret);
        const allPassed = entries.reduce((aggregate, ind) => aggregate && ret[Number(ind)].ok, true);
        const allUndefined = entries.reduce((aggregate, ind) => {
            const result = ret[Number(ind)];
            return aggregate && isEmpty(result.value);
        }, true);
        const allUnPassedUndefined = entries.reduce((aggregate, ind) => {
            const result = ret[Number(ind)];
            return aggregate && (result.ok || isEmpty(result.value));
        }, true);

        const errors: ConvertError[] = [];
        entries.forEach((ind) => {
            const result = ret[Number(ind)];
            if (!result.ok) {
                errors.push(...result.errors);
            }
        });

        let value: ISDMConvertResult | undefined = ret;
        switch (this.sdm.sdmType) {
            case SDMType.Arr:
                if (this.sdm.hasDecorator("$ghost") && allUndefined) {
                    return { ok: true, value: undefined, errors: [] };
                }
                if (!this.sdm.hasDecorator("$strict") && allUnPassedUndefined) {
                    return { ok: true, value: ret, errors: [] };
                }
                break;
            case SDMType.Obj:
                if (this.sdm.hasDecorator("$ghost") && allUndefined) {
                    return { ok: true, value: undefined, errors: [] };
                }
                break;
        }

        if (allPassed) {
            return { ok: true, value, errors: [] };
        }

        return { ok: false, value, errors };
    }
}

export class SchemaConvertor extends SDMConvertor {

    // public validate(vs: any[]):[boolean, SDMConvertResult|undefined] {
    //     const result = super.validate(vs);
    //     return result; // jump over the first object
    // }
}
