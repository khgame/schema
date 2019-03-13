import * as _ from "lodash";
import {ISDMConvertResult, MarkConvertorResultToErrorStack, SchemaConvertor} from "../convertor";
import {MarkType, SDM, SDMType} from "../schema";

interface IMarkDesc {
    row?: string[];
    col?: string[];
}

export function exportJson(schema: SDM, descList: Array<string|undefined>, convertedRows: any[][], markDescriptor: IMarkDesc = {}) {

    // console.log('markList:\n', JSON.stringify(markList))
    const convertor = new SchemaConvertor(schema);

    function ColOfMInd(markInd: number) {
        return markDescriptor.col ? markDescriptor.col[markInd] : `COL:${markInd}`;
    }

    function RowOfMInd(lineInd: number) {
        return markDescriptor.row ? markDescriptor.row[lineInd] : `ROW:${lineInd}`;
    }

    function replaceErrorStack(errStack: any) {
        const ret: any = {};
        Object.keys(errStack).forEach((markInd) => {
            ret[ColOfMInd(Number(markInd))] = _.isObject(errStack[markInd]) ? replaceErrorStack(errStack[markInd]) : errStack[markInd];
        });
        return ret;
    }

    function createObject(converted: ISDMConvertResult, sdm: SDM): any[] | any { // the node is sdm
        const retArr: any[] = [];
        const retObj: any = {};

        function setValue(markInd: number, value: any) {
            if (sdm.sdmType === SDMType.Arr) {
                const strict = sdm.mds.indexOf("$strict") >= 0;
                if (value || strict) {
                    retArr.push(value);
                }
            } else {
                const key = descList[markInd];
                if (key === undefined || key === null) {
                    throw new Error(`error: key in object not found; Col - ${ColOfMInd(markInd)}`);
                }
                retObj[key] = value;
            }
        }

        for (const childInd in sdm.marks) {
            const child = sdm.marks[childInd];
            const markInd = child.markInd;
            const value = converted[markInd] ? converted[markInd][1] : undefined;

            // const child = sdm.marks.find(v => v.markInd === markInd)
            if (child.markType === MarkType.TDM || value === undefined) {
                // console.log(child.markInd, value); // , child)
                setValue(markInd, value);
            } else {
                setValue(markInd - 1, createObject(value, child as SDM));
            }
        }
        // console.log("create", retArr, retObj);
        return sdm.sdmType === SDMType.Arr ? retArr : retObj;
    }

    const result: any[] = [];
    const tids = [];
    for (const lineInd in convertedRows) {
        const values = convertedRows[lineInd];
        // console.log('--\n', JSON.stringify(values))
        const validate = convertor.validate(values);
        if (!validate[0]) {
            const errorStack = MarkConvertorResultToErrorStack(validate);
            console.log(`error: parse row failed; row - ${RowOfMInd(Number(lineInd))}\nstack:\n${JSON.stringify(replaceErrorStack(errorStack), null, 2)}`);
            continue;
        }
        const converted = convertor.convert(values);
        // console.log('--- converted:\n', JSON.stringify(converted), '\n===')
        if (!converted) {
            console.log(``);
        } else {
            result[lineInd] = createObject(converted, schema);
        }
    }
    return result;
}
