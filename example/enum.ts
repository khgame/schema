import {SDMConvertor} from "../src/convertor";
import {parseSchema} from "../src/schema";

const marks = [
    "@", "enum<a|B|C|3>"];
const mark = parseSchema(marks);
const conv = new SDMConvertor(mark);

const values = [[20, "A"], [21, "b"], [22, "C"], [23, 3], [24, "X"]];
console.log(
    JSON.stringify(
        values.map((t) => conv.validate(t)![1]![1])));
