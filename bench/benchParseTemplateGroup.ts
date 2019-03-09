import {parseMark} from "../src";

const mark = parseMark("$oneof $const Array<uint|string>");

console.log(mark.toSchemaStr())
