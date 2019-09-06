import {SDM, SDMType} from "./structureDescriptionMark";
import {IContext} from "./typeDescriptionMark";

export function parseSchema(markStrs: string[], markIndBegin: number = 0, context?: IContext) {
    return SDM.parse(SDMType.Obj, [], markStrs, markIndBegin, context);
}
