import {expect} from "chai";
import "mocha";

import {Error} from "tslint/lib/error";
import {AliasTable, SupportedTypes} from "../../src";
import {parseMark} from "../../src";

describe("parse simple schema", () => {

    it("simple unavailable mark", () => {
        const mark = parseMark("aaa");
        expect(mark.nodes.length).to.equal(1);
        expect(mark.nodes[0].typeName).to.equal(SupportedTypes.None);
        expect(mark.nodes[0].nodes).to.deep.equal([]);
    });

    it("empty mark", () => {
        const mark = parseMark("");
        expect(mark.nodes.length).to.equal(0);
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
                    expect(mark.nodes.length).to.equal(0);
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
                        expect(mark.nodes.length).to.equal(1);
                        expect(mark.nodes[0].typeName).to.equal(SupportedTypes.Array);
                    });

                    it("parse template", () => {
                        expect(mark.nodes[0].nodes.length).to.equal(1);
                        expect(mark.nodes[0].nodes[0].typeName).to.equal(key);
                    });
                });
            });
        });

        it(`${SupportedTypes.Array} without template`, () => {
            const mark = parseMark(SupportedTypes.Array);
            expect(mark.nodes.length).to.equal(1);
            expect(mark.nodes[0].typeName).to.equal(SupportedTypes.Array);
            expect(mark.nodes[0].nodes.length).to.equal(0);
        });

        it(`${SupportedTypes.Array}<uint|string>`, () => {
            const mark = parseMark(`${SupportedTypes.Array}<uint|string>`);
            expect(mark.nodes.length).to.equal(1);
            expect(mark.nodes[0].typeName).to.equal(SupportedTypes.Array);
            expect(mark.nodes[0].nodes.length).to.equal(2);
            expect(mark.nodes[0].nodes[0].typeName).to.equal(SupportedTypes.UInt);
            expect(mark.nodes[0].nodes[1].typeName).to.equal(SupportedTypes.String);
        });

    });

    describe("Plain pair", () => {
        testedKey.forEach((key) => {
            AliasTable[key].forEach((alias) => {
                describe(`${SupportedTypes.Pair}<${alias}>`, () => {
                    const mark = parseMark(`${SupportedTypes.Pair}<${alias}>`);
                    it("parse pair", () => {
                        expect(mark.nodes.length).to.equal(1);
                        expect(mark.nodes[0].typeName).to.equal(SupportedTypes.Pair);
                    });

                    it("parse template", () => {
                        expect(mark.nodes[0].nodes.length).to.equal(1);
                        expect(mark.nodes[0].nodes[0].typeName).to.equal(key);
                    });
                });
            });
        });

        it(`${SupportedTypes.Pair} without template`, () => {
            const mark = parseMark(SupportedTypes.Pair);
            expect(mark.nodes.length).to.equal(1);
            expect(mark.nodes[0].typeName).to.equal(SupportedTypes.Pair);
            expect(mark.nodes[0].nodes.length).to.equal(0);
        });

        it(`${SupportedTypes.Pair}<uint|string>`, () => {
            const mark = parseMark(`${SupportedTypes.Pair}<uint|string>`);
            expect(mark.nodes.length).to.equal(1);
            expect(mark.nodes[0].typeName).to.equal(SupportedTypes.Pair);
            expect(mark.nodes[0].nodes.length).to.equal(2);
            expect(mark.nodes[0].nodes[0].typeName).to.equal(SupportedTypes.UInt);
            expect(mark.nodes[0].nodes[1].typeName).to.equal(SupportedTypes.String);
        });

    });

    describe("Optional", () => {
        it("optional without typeSegment", () => {
            expect(() => parseMark("?")).to.throw(Error);
        });

        describe("optional single type", () => {
            testedKey.forEach((key) => {
                AliasTable[key].forEach((alias) => {
                    it(`${alias}?`, () => {
                        const mark = parseMark(`${alias}?`);
                        expect(mark.nodes.length).to.equal(2);
                        expect(mark.nodes[0].typeName).to.equal(key);
                        expect(mark.nodes[1].typeName).to.equal(SupportedTypes.Undefined);
                    });
                });
            });
        });

        it("str|onoff|uint8?", () => {
            const mark = parseMark("str|onoff|uint8?");
            expect(mark.nodes.length).to.equal(4);
            expect(mark.nodes[0].typeName).to.equal(SupportedTypes.String);
            expect(mark.nodes[1].typeName).to.equal(SupportedTypes.Boolean);
            expect(mark.nodes[2].typeName).to.equal(SupportedTypes.UInt);
            expect(mark.nodes[3].typeName).to.equal(SupportedTypes.Undefined);
        });

    });

    describe("Compound", () => {
        const input = `${SupportedTypes.Array}<${SupportedTypes.Array}<${SupportedTypes.Pair}<uint|str?>>|${SupportedTypes.Pair}<float>?>`;
        it(input, () => {
            const mark = parseMark(input);
            expect(mark.nodes.length).to.equal(1);
            expect(mark.nodes[0].typeName).to.equal(SupportedTypes.Array);
            expect(mark.nodes[0].nodes.length).to.equal(3);
            expect(mark.nodes[0].nodes[0].typeName).to.equal(SupportedTypes.Array);
            expect(mark.nodes[0].nodes[1].typeName).to.equal(SupportedTypes.Pair);
            expect(mark.nodes[0].nodes[2].typeName).to.equal(SupportedTypes.Undefined);
            expect(mark.nodes[0].nodes[0].nodes.length).to.equal(1);
            expect(mark.nodes[0].nodes[0].nodes[0].typeName).to.equal(SupportedTypes.Pair);
            expect(mark.nodes[0].nodes[0].nodes[0].nodes.length).to.equal(3);
            expect(mark.nodes[0].nodes[0].nodes[0].nodes[0].typeName).to.equal(SupportedTypes.UInt);
            expect(mark.nodes[0].nodes[0].nodes[0].nodes[1].typeName).to.equal(SupportedTypes.String);
            expect(mark.nodes[0].nodes[0].nodes[0].nodes[2].typeName).to.equal(SupportedTypes.Undefined);
        });
    });

    describe("schema operation", () => {
        const input = `${SupportedTypes.Array}<${SupportedTypes.Array}<${SupportedTypes.Pair}<uint|str?>>|${SupportedTypes.Pair}<float>?>`;
        it(input, () => {
            const mark = parseMark(input);
            expect(mark.nodes.length).to.equal(1);
            expect(mark.nodes[0].typeName).to.equal(SupportedTypes.Array);
            expect(mark.nodes[0].innerCount).to.equal(3);
            expect(mark.nodes[0].inner(0).typeName).to.equal(SupportedTypes.Array);
            expect(mark.nodes[0].inner(1).typeName).to.equal(SupportedTypes.Pair);
            expect(mark.nodes[0].inner(2).typeName).to.equal(SupportedTypes.Undefined);
            expect(mark.nodes[0].inner(0).innerCount).to.equal(1);
            expect(mark.nodes[0].inner(0).inner(0).typeName).to.equal(SupportedTypes.Pair);
            expect(mark.nodes[0].inner(0).inner(0).innerCount).to.equal(3);
            expect(mark.nodes[0].inner(0).inner(0).inner(0).typeName).to.equal(SupportedTypes.UInt);
            expect(mark.nodes[0].inner(0).inner(0).inner(1).typeName).to.equal(SupportedTypes.String);
            expect(mark.nodes[0].inner(0).inner(0).inner(2).typeName).to.equal(SupportedTypes.Undefined);
        });
    });
});
