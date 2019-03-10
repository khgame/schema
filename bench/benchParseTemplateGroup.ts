import {SchemaConvertor, SDMConvertor, TDMConvertor} from "../src/convertor/schemaConvertor";
import {parseSchema, SDM, TDM} from "../src/schema";

const mark1 = TDM.parse("$oneof $const Array<uint|string>");

console.log(mark1.toSchemaStr());

const mark2 = TDM.parse("Array<int>|uint8|onoff|str?");
const conv2 = new TDMConvertor(mark2);
console.log(mark2.toSchemaStr());
console.log(conv2.validate(1));

const mark3 = TDM.parse("$oneof array<array<pair<uint|str?>>|pair<float>?>");
console.log(mark3.toSchemaStr());

const mark4 = parseSchema(["{", "str", "uint|bool?", "[", "uint", "uint" , "]", "}"]);
const conv4 = new SDMConvertor(mark4);
const conv4s = new SchemaConvertor(mark4);
console.log(JSON.stringify(mark4));
console.log(mark4.toSchemaStr());
console.log(JSON.stringify(conv4.validate([undefined, "as", "8", undefined, 12, -22, undefined, undefined])));
console.log(JSON.stringify(conv4.validate([undefined, "as", "8", undefined, 12, undefined, undefined, undefined])));
console.log(JSON.stringify(conv4.validate([undefined, "as", "8", undefined, 12, 122, undefined, undefined])));

console.log(JSON.stringify(conv4s.validate([undefined, "as", "8", undefined, 12, -22, undefined, undefined])));
console.log(JSON.stringify(conv4s.validate([undefined, "as", "8", undefined, 12, undefined, undefined, undefined])));
console.log(JSON.stringify(conv4s.validate([undefined, "as", "8", undefined, 12, 122, undefined, undefined])));
