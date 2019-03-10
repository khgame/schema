import {SchemaConvertor, SDMConvertor, TDMConvertor} from "../src/convertor/schemaConvertor";
import {IMark, parseSchema, SDM, TDM} from "../src/schema";

function printMark(mark: IMark, name = "") {
    console.log(">>> ", name, "\n- Schema: ", mark.toSchemaStr(), "\n- Instance:", JSON.stringify(mark), "\n<<<\n");
}

const mark1 = TDM.parse("$oneof $const Array<uint|string>");
printMark(mark1, "mark1");

const mark2 = TDM.parse("Array<int>|uint8|onoff|str?");
const conv2 = new TDMConvertor(mark2);
printMark(mark2, "mark2");
console.log(conv2.validate(1));

const mark3 = TDM.parse("$oneof array<array<pair<uint|str?>>|pair<float>?>");
printMark(mark3, "mark3");

const mark4 = parseSchema(["{", "str", "uint|bool?", "[", "uint", "uint", "bool", "]", "}"]);
const conv4 = new SDMConvertor(mark4);
printMark(mark4, "mark4");
console.log(JSON.stringify(conv4.validate([undefined, "as", "8", undefined, 12, -22, true, undefined, undefined])));
console.log(JSON.stringify(conv4.validate([undefined, "as", "8", undefined, 12, undefined, true, undefined, undefined])));
console.log(JSON.stringify(conv4.validate([undefined, "as", "8", undefined, 12, 122, true, undefined, undefined])));

const mark4s = parseSchema(["{", "str", "uint|bool?", "$strict [", "uint", "uint", "bool", "]", "}"]);
printMark(mark4s, "mark4s");
const conv4s = new SchemaConvertor(mark4s);
console.log(JSON.stringify(conv4s.validate([undefined, "as", "8", undefined, 12, -22, true, undefined, undefined])));
console.log(JSON.stringify(conv4s.validate([undefined, "as", "8", undefined, 12, undefined, true, undefined, undefined])));
console.log(JSON.stringify(conv4s.validate([undefined, "as", "8", undefined, 12, 122, undefined, undefined, undefined])));
