import {parseMark, SupportedTypes} from "../src";

const mark1 = parseMark("$oneof $const Array<uint|string>");

console.log(mark1.toSchemaStr());

const mark2 = parseMark("str|onoff|uint8?");

console.log(mark2.toSchemaStr());

const mark3 = parseMark("$oneof array<array<pair<uint|str?>>|pair<float>?>");

console.log(mark3.toSchemaStr());