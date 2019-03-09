import {expect} from "chai";
import "mocha";

import {AliasTable, SupportedTypes} from "../../src";
import {parseMark} from "../../src";

describe("parse simple schema", () => {

    it("simple unavailable mark", () => {
        const mark = parseMark("aaa");
        expect(mark.typeObjects.length).to.equal(1);
        expect(mark.typeObjects[0].typeName).to.equal(SupportedTypes.None);
        expect(mark.typeObjects[0].templateTypeObjects).to.deep.equal([]);
    });

    it("empty mark", () => {
        const mark = parseMark("");
        expect(mark.typeObjects.length).to.equal(0);
    });

    const testedKey = [
        SupportedTypes.Any,
        SupportedTypes.String,
        SupportedTypes.Float,
        SupportedTypes.UFloat,
        SupportedTypes.Int,
        SupportedTypes.UInt,
        SupportedTypes.Boolean,
    ];

    testedKey.forEach((key) => {
        describe(key, () => {
            AliasTable[key].forEach((v) => {
                it(key + ": " + v, () => {
                    const mark = parseMark("");
                    expect(mark.typeObjects.length).to.equal(0);
                });
            });
        });
    });

    describe("Plain Array", () => {
        testedKey.forEach((key) => {
            AliasTable[key].forEach((alias) => {
                describe(`Array<${alias}>`, () => {
                    const mark = parseMark(`Array<${alias}>`);
                    it("parse array", () => {
                        expect(mark.typeObjects.length).to.equal(1);
                        expect(mark.typeObjects[0].typeName).to.equal(SupportedTypes.Array);
                    });

                    it("parse template", () => {
                        expect(mark.typeObjects[0].templateTypeObjects.length).to.equal(1);
                        expect(mark.typeObjects[0].templateTypeObjects[0].typeName).to.equal(key);
                    });
                });
            });
        });

        it("Array", () => {
            const mark = parseMark("Array");
            expect(mark.typeObjects.length).to.equal(1);
            expect(mark.typeObjects[0].typeName).to.equal(SupportedTypes.Array);
            expect(mark.typeObjects[0].templateTypeObjects.length).to.equal(0);
        });

        it("Array<uint|string>", () => {
            const mark = parseMark("Array<uint|string>");
            expect(mark.typeObjects.length).to.equal(1);
            expect(mark.typeObjects[0].typeName).to.equal(SupportedTypes.Array);
            expect(mark.typeObjects[0].templateTypeObjects.length).to.equal(2);
            expect(mark.typeObjects[0].templateTypeObjects[0].typeName).to.equal(SupportedTypes.UInt);
            expect(mark.typeObjects[0].templateTypeObjects[1].typeName).to.equal(SupportedTypes.String);
        });

    });
});
