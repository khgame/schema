import {SDM, SDMType} from "./structureDescriptionMark";

export function parseSchema(markStrs: string[], markIndBegin: number = 0) {
    return SDM.parse(SDMType.Obj, [], markStrs, markIndBegin);
}

