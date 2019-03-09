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
                describe(`${SupportedTypes.Array}<${alias}>`, () => {
                    const mark = parseMark(`${SupportedTypes.Array}<${alias}>`);
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

        it(`${SupportedTypes.Array} without template`, () => {
            const mark = parseMark(SupportedTypes.Array);
            expect(mark.typeObjects.length).to.equal(1);
            expect(mark.typeObjects[0].typeName).to.equal(SupportedTypes.Array);
            expect(mark.typeObjects[0].templateTypeObjects.length).to.equal(0);
        });

        it(`${SupportedTypes.Array}<uint|string>`, () => {
            const mark = parseMark(`${SupportedTypes.Array}<uint|string>`);
            expect(mark.typeObjects.length).to.equal(1);
            expect(mark.typeObjects[0].typeName).to.equal(SupportedTypes.Array);
            expect(mark.typeObjects[0].templateTypeObjects.length).to.equal(2);
            expect(mark.typeObjects[0].templateTypeObjects[0].typeName).to.equal(SupportedTypes.UInt);
            expect(mark.typeObjects[0].templateTypeObjects[1].typeName).to.equal(SupportedTypes.String);
        });

    });

    describe("Plain pair", () => {
        testedKey.forEach((key) => {
            AliasTable[key].forEach((alias) => {
                describe(`${SupportedTypes.Pair}<${alias}>`, () => {
                    const mark = parseMark(`${SupportedTypes.Pair}<${alias}>`);
                    it("parse pair", () => {
                        expect(mark.typeObjects.length).to.equal(1);
                        expect(mark.typeObjects[0].typeName).to.equal(SupportedTypes.Pair);
                    });

                    it("parse template", () => {
                        expect(mark.typeObjects[0].templateTypeObjects.length).to.equal(1);
                        expect(mark.typeObjects[0].templateTypeObjects[0].typeName).to.equal(key);
                    });
                });
            });
        });

        it(`${SupportedTypes.Pair} without template`, () => {
            const mark = parseMark(SupportedTypes.Pair);
            expect(mark.typeObjects.length).to.equal(1);
            expect(mark.typeObjects[0].typeName).to.equal(SupportedTypes.Pair);
            expect(mark.typeObjects[0].templateTypeObjects.length).to.equal(0);
        });

        it(`${SupportedTypes.Pair}<uint|string>`, () => {
            const mark = parseMark(`${SupportedTypes.Pair}<uint|string>`);
            expect(mark.typeObjects.length).to.equal(1);
            expect(mark.typeObjects[0].typeName).to.equal(SupportedTypes.Pair);
            expect(mark.typeObjects[0].templateTypeObjects.length).to.equal(2);
            expect(mark.typeObjects[0].templateTypeObjects[0].typeName).to.equal(SupportedTypes.UInt);
            expect(mark.typeObjects[0].templateTypeObjects[1].typeName).to.equal(SupportedTypes.String);
        });

    });
});
