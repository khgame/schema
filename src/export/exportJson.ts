import {ConvertError, ISDMConvertResult, SchemaConvertor} from "../convertor";
import {MarkType, SDM, SDMType} from "../schema";

interface IMarkDesc {
    row?: Array<string|number>;
    col?: string[];
}

export function exportJson(schema: SDM, descList: Array<string|undefined|null>, convertedRows: any[][], markDescriptor: IMarkDesc = {}) {

    // console.log('markList:\n', JSON.stringify(markList))
    const convertor = new SchemaConvertor(schema);

    function ColOfMInd(markInd: number) {
        return markDescriptor.col ? markDescriptor.col[markInd] : `COL:${markInd}`;
    }

    function RowOfMInd(lineInd: number) {
        return markDescriptor.row ? markDescriptor.row[lineInd] : `ROW:${lineInd}`;
    }

    function createObject(converted: ISDMConvertResult, sdm: SDM): any[] | any { // the node is sdm
        const retArr: any[] = [];
        const retObj: any = {};

        function setValue(markInd: number, value: any) {
            if (sdm.sdmType === SDMType.Arr) {
                const strict = sdm.hasDecorator("$strict");
                if (value !== undefined || strict) { // todo:
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
            const nodeResult = converted[markInd];
            const value = nodeResult ? nodeResult.value : undefined;

            // const child = sdm.marks.find(v => v.markInd === markInd)
            if (child.markType === MarkType.TDM || value === undefined) {
                // console.log(child.markInd, value); // , child)
                setValue(markInd, value);
            } else {
                setValue(markInd - 1, createObject(value as ISDMConvertResult, child as SDM));
            }
        }
        // console.log("create", retArr, retObj);
        return sdm.sdmType === SDMType.Arr ? retArr : retObj;
    }

    function assignError(target: any, path: Array<string | number>, message: string) {
        let node = target;
        let columnResolved = false;
        path.forEach((step, index) => {
            let key: string | number = step;
            if (typeof step === "number") {
                if (!columnResolved) {
                    key = ColOfMInd(step);
                    columnResolved = true;
                } else {
                    key = `[${step}]`;
                }
            }
            if (index === path.length - 1) {
                if (node[key]) {
                    if (Array.isArray(node[key])) {
                        node[key].push(message);
                    } else {
                        node[key] = [node[key], message];
                    }
                } else {
                    node[key] = message;
                }
            } else {
                if (!node[key] || typeof node[key] !== "object") {
                    node[key] = {};
                }
                node = node[key];
            }
        });
    }

    function buildErrorStack(errors: ConvertError[]) {
        const stack: any = {};
        errors.forEach((error) => {
            const path = error.path && error.path.length > 0 ? error.path : ["__UNKNOWN__"];
            assignError(stack, path, error.message || "conversion failed");
        });
        return stack;
    }

    const result: any[] = [];
    for (const lineInd in convertedRows) {
        const values = convertedRows[lineInd];
        // console.log("-- values ", lineInd, ":\n", JSON.stringify(values));
        const validation = convertor.validate(values, { path: [] });

        if (!validation.ok) {
            const errorStack = buildErrorStack(validation.errors);
            console.warn(`error: parse row failed; row - ${RowOfMInd(Number(lineInd))}`);
            // console.log("values", values);
            console.log("stack\n", JSON.stringify(errorStack, null, 2));
            continue;
        }
        if (!validation.value) {
            console.log(``);
        } else {
            // console.log("createObject =[ ", lineInd, JSON.stringify(converted))
            result[lineInd] = createObject(validation.value, schema);
        }
    }
    return result;
}
