import {SchemaConvertor, SDMConvertor, TDMConvertor} from "../src/convertor/schemaConvertor";
import {IMark, parseSchema, SDM, TDM} from "../src/schema";

function printMark(mark: IMark, name = "") {
    console.log(
        ">>> ", name,
        "\n- SchemaStr: ", mark.toSchemaStr(),
        "\n- SchemaJson: ", JSON.stringify(mark.toSchemaJson()),
        "\n- Instance:", JSON.stringify(mark),
        "\n<<<\n");
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
const validate4s3 = conv4s.validate([undefined, "as", "8", undefined, 12, 122, undefined, undefined, undefined]);
console.log(JSON.stringify(validate4s3));
// [ int int ]
// _ 1 1 _
// _ 1 _ _ => [ 1, undefined ] ; exception OR [ 1 ] ; ok

// $strict [ int int ]
// _ 1 1 _
// _ 1 _ _ ; exception

// { int int }
// _ 1 1 _
// _ 1 _ _ ; exception

// [ { int int } ]
// keys ...
// _ _  1   1  _ _ => [ {key: 1, key: 1}]
// _ _  _   1  _ _ => [ {key: undefined, key: 1}] ; exception
// _ _  _   _  _ _ => [ {key: undefined, key: undefined}] ; exception OR [ ] ; ok

// $ghost { int int }
// keys ...
//           1   1 => {key1: 1, key2: 2}
//           1   _ => {key1: 1, key2: undefined} ; exception
//           _   _ => undefined

const mark5 = parseSchema(["str", "[", "{", "uint", "}", "{", "Pair<int?>?", "}", "]", "onoff"]);
printMark(mark5, "mark5");
const conv5 = new SDMConvertor(mark5);
const validate5 = conv5.validate(["222", undefined, undefined, undefined, undefined, undefined, "ok:9", undefined, undefined, "on"]);
console.log(JSON.stringify(validate5));
const mark5g = parseSchema(["str", "[", "$ghost {", "uint", "}", "{", "Pair<int?>?", "}", "]", "onoff"]);

printMark(mark5g, "mark5g");
const conv5g = new SDMConvertor(mark5g);
console.log(JSON.stringify(conv5g.validate(["222", undefined, undefined, undefined, undefined, undefined, "ok:9", undefined, undefined, "on"])));

const mark6Samples = ["@", "@", "@", "string", "{", "tid", "[", "tid", "]", "}", "[", "{", "tid", "number", "}", "]", "[",
    "Pair<uint>", "Pair<uint>", "Pair<uint>", "]", "Array<float>", "Pair<uint>", "Array<Pair>", "[", "[", "int", "int", "int", "]",
    "[", "[", "bool", "]", "]", "]", "$oneof [", "tid", "bool", "Pair<uint>", "]", "[", "{", "uint", "}", "{", "uint", "}", "]", "uint|string"];
const mark6Values = [20, "000", "0", "farm", null, 2000001, null, null, null, null, null, null, 1000001, 1, null, null, null,
    "oil:388", "ore1:1551", "", null, "1|2|3", "tag:0", "tag:0", null, null, 1, 2, 3,
    null, null, null, "Y", null, null, null, null, 111, null, null, null, null, null, 111, null, null, 211, null, null, 1];
const mark6 = parseSchema(mark6Samples);
const conv6 = new SDMConvertor(mark6);
console.log(JSON.stringify(conv6.validate(mark6Values)));
