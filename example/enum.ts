import {SDMConvertor} from "../src/convertor";
import {parseSchema} from "../src/schema";
//
// const marks = [
//     "@", "enum<a|B|C|3>"];
// const mark = parseSchema(marks);
// const conv = new SDMConvertor(mark);
//
// const values = [[20, "A"], [21, "b"], [22, "C"], [23, 3], [24, "X"]];
// console.log(
//     JSON.stringify(
//         values.map((t) => conv.validate(t)![1]![1])));
//

const marks2 = [
    "@", "enum<a|B|C|3>"];
const mark2 = parseSchema(marks2, 0, {enums: { C : { X: 1, Y: 2}}});
const conv2 = new SDMConvertor(mark2);

const values2 = [[20, "A"], [21, "b"], [22, "C"], [23, 3], [24, "X"]];
console.log(
    JSON.stringify(
        values2.map((t) => conv2.validate(t)![1]![1])));
