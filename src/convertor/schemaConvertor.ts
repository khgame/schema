import {TDM} from "../schema";
import {TSegConvertor} from "./tSegConvertor";

export class TDMConvertor extends TSegConvertor {

    constructor(tdm: TDM) {
        super(tdm.tSeg);
    }

}
