import {expect} from "chai";
import "mocha";

import {Error} from "tslint/lib/error";
import {AliasTable, SupportedTypes} from "../../src";
import {TDM} from "../../src/schema/typeDescriptionMark";

describe("parse simple schema", () => {

    it("simple unavailable tdmObject", () => {
        const tdmObject = TDM.parse("aaa");
        expect(tdmObject.innerCount).to.equal(1);
        expect(tdmObject.inner(0).tName).to.equal(SupportedTypes.None);
        expect(tdmObject.inner(0).innerCount).to.equal(0);
    });

    it("empty tdmObject", () => {
        const tdmObject = TDM.parse("");
        expect(tdmObject.innerCount).to.equal(0);
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
                    const tdmObject = TDM.parse("");
                    expect(tdmObject.innerCount).to.equal(0);
                });
            });
        });
    });

    describe("Plain Array", () => {
        testedKey.forEach((key) => {
            AliasTable[key].forEach((alias) => {
                describe(`${SupportedTypes.Array}<${alias}>`, () => {
                    const tdmObject = TDM.parse(`${SupportedTypes.Array}<${alias}>`);
                    it("parse array", () => {
                        expect(tdmObject.innerCount).to.equal(1);
                        expect(tdmObject.inner(0).tName).to.equal(SupportedTypes.Array);
                    });

                    it("parse template", () => {
                        expect(tdmObject.inner(0).innerCount).to.equal(1);
                        expect(tdmObject.inner(0).inner(0).tName).to.equal(key);
                    });
                });
            });
        });

        it(`${SupportedTypes.Array} without template`, () => {
            const tdmObject = TDM.parse(SupportedTypes.Array);
            expect(tdmObject.innerCount).to.equal(1);
            expect(tdmObject.inner(0).tName).to.equal(SupportedTypes.Array);
            expect(tdmObject.inner(0).innerCount).to.equal(0);
        });

        it(`${SupportedTypes.Array}<uint|string>`, () => {
            const tdmObject = TDM.parse(`${SupportedTypes.Array}<uint|string>`);
            expect(tdmObject.innerCount).to.equal(1);
            expect(tdmObject.inner(0).tName).to.equal(SupportedTypes.Array);
            expect(tdmObject.inner(0).innerCount).to.equal(2);
            expect(tdmObject.inner(0).inner(0).tName).to.equal(SupportedTypes.UInt);
            expect(tdmObject.inner(0).inner(1).tName).to.equal(SupportedTypes.String);
        });

    });

    describe("Plain pair", () => {
        testedKey.forEach((key) => {
            AliasTable[key].forEach((alias) => {
                describe(`${SupportedTypes.Pair}<${alias}>`, () => {
                    const tdmObject = TDM.parse(`${SupportedTypes.Pair}<${alias}>`);
                    it("parse pair", () => {
                        expect(tdmObject.innerCount).to.equal(1);
                        expect(tdmObject.inner(0).tName).to.equal(SupportedTypes.Pair);
                    });

                    it("parse template", () => {
                        expect(tdmObject.inner(0).innerCount).to.equal(1);
                        expect(tdmObject.inner(0).inner(0).tName).to.equal(key);
                    });
                });
            });
        });

        it(`${SupportedTypes.Pair} without template`, () => {
            const tdmObject = TDM.parse(SupportedTypes.Pair);
            expect(tdmObject.innerCount).to.equal(1);
            expect(tdmObject.inner(0).tName).to.equal(SupportedTypes.Pair);
            expect(tdmObject.inner(0).innerCount).to.equal(0);
        });

        it(`${SupportedTypes.Pair}<uint|string>`, () => {
            const tdmObject = TDM.parse(`${SupportedTypes.Pair}<uint|string>`);
            expect(tdmObject.innerCount).to.equal(1);
            expect(tdmObject.inner(0).tName).to.equal(SupportedTypes.Pair);
            expect(tdmObject.inner(0).innerCount).to.equal(2);
            expect(tdmObject.inner(0).inner(0).tName).to.equal(SupportedTypes.UInt);
            expect(tdmObject.inner(0).inner(1).tName).to.equal(SupportedTypes.String);
        });

    });

    describe("Enum", () => {
        it(`${SupportedTypes.Enum}<AAA|BBB>`, () => {
            const tdmObject = TDM.parse(`${SupportedTypes.Enum}<AAA|BBB>`);
            expect(tdmObject.innerCount).to.equal(1);
            expect(tdmObject.inner(0).tName).to.equal(SupportedTypes.Enum);
            expect(tdmObject.inner(0).innerCount).to.equal(2);
            expect(tdmObject.inner(0).inner(0).tName).to.equal(SupportedTypes.None);
            expect(tdmObject.inner(0).inner(1).tName).to.equal(SupportedTypes.None);
            expect(tdmObject.inner(0).inner(0).rawName).to.equal("aaa");
            expect(tdmObject.inner(0).inner(1).rawName).to.equal("bbb");
        });

    });

    describe("Optional", () => {
        it("optional without typeSegment", () => {
            expect(() => TDM.parse("?")).to.throw(Error);
        });

        describe("optional single type", () => {
            testedKey.forEach((key) => {
                AliasTable[key].forEach((alias) => {
                    it(`${alias}?`, () => {
                        const tdmObject = TDM.parse(`${alias}?`);
                        expect(tdmObject.innerCount).to.equal(2);
                        expect(tdmObject.inner(0).tName).to.equal(key);
                        expect(tdmObject.inner(1).tName).to.equal(SupportedTypes.Undefined);
                    });
                });
            });
        });

        it("str|onoff|uint8?", () => {
            const tdmObject = TDM.parse("str|onoff|uint8?");
            expect(tdmObject.innerCount).to.equal(4);
            expect(tdmObject.inner(0).tName).to.equal(SupportedTypes.String);
            expect(tdmObject.inner(1).tName).to.equal(SupportedTypes.Boolean);
            expect(tdmObject.inner(2).tName).to.equal(SupportedTypes.UInt);
            expect(tdmObject.inner(3).tName).to.equal(SupportedTypes.Undefined);
        });

    });

    describe("Compound", () => {
        const input = `${SupportedTypes.Array}<${SupportedTypes.Array}<${SupportedTypes.Pair}<uint|str?>>|${SupportedTypes.Pair}<float>?>`;
        it(input, () => {
            const tdmObject = TDM.parse(input);
            expect(tdmObject.innerCount).to.equal(1);
            expect(tdmObject.inner(0).tName).to.equal(SupportedTypes.Array);
            expect(tdmObject.inner(0).innerCount).to.equal(3);
            expect(tdmObject.inner(0).inner(0).tName).to.equal(SupportedTypes.Array);
            expect(tdmObject.inner(0).inner(1).tName).to.equal(SupportedTypes.Pair);
            expect(tdmObject.inner(0).inner(2).tName).to.equal(SupportedTypes.Undefined);
            expect(tdmObject.inner(0).inner(0).innerCount).to.equal(1);
            expect(tdmObject.inner(0).inner(0).inner(0).tName).to.equal(SupportedTypes.Pair);
            expect(tdmObject.inner(0).inner(0).inner(0).innerCount).to.equal(3);
            expect(tdmObject.inner(0).inner(0).inner(0).inner(0).tName).to.equal(SupportedTypes.UInt);
            expect(tdmObject.inner(0).inner(0).inner(0).inner(1).tName).to.equal(SupportedTypes.String);
            expect(tdmObject.inner(0).inner(0).inner(0).inner(2).tName).to.equal(SupportedTypes.Undefined);
        });
    });

    describe("mds", () => {
        const input = `$strict int`;
        it(input, () => {
            const tdmObject = TDM.parse(input);
            expect(tdmObject.innerCount).to.equal(1);
            expect(tdmObject.inner(0).tName).to.equal(SupportedTypes.Int);
            expect(tdmObject.mds.length).to.equal(1);
            expect(tdmObject.mds[0]).to.equal("$strict");
        });
    });
});
