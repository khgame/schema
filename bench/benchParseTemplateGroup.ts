import {TDM} from "../src/schema/typeDescriptionMark";

const mark1 = TDM.parse("$oneof $const Array<uint|string>");

console.log(mark1.toSchemaStr());

const mark2 = TDM.parse("str|onoff|uint8?");

console.log(mark2.toSchemaStr());

const mark3 = TDM.parse("$oneof array<array<pair<uint|str?>>|pair<float>?>");

console.log(mark3.toSchemaStr());