import {SDMConvertor} from "../src/convertor";
import {parseSchema} from "../src/schema";

const marks = [
    "@", "[", "int", "int", "int", "int", "int", "int", "]"];
const values = [
    20, null, "0", 2, 0, "2", 0, -2, null];
const mark6 = parseSchema(marks);
const conv6 = new SDMConvertor(mark6);
console.log(JSON.stringify(conv6.validate(values)));
