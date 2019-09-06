import {SDM, SDMType} from "./structureDescriptionMark";
import {IContext} from "./typeDescriptionMark";

export function parseSchema(markStrs: string[], context?: IContext): SDM;

export function parseSchema(markStrs: string[], markIndBegin: number | IContext = 0, context?: IContext) {
    if (typeof markIndBegin !== "number") {
        context = markIndBegin as IContext;
        markIndBegin = 0;
    }
    return SDM.parse(SDMType.Obj, [], markStrs, markIndBegin, context);
}
