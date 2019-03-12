import {expect} from "chai";
import "mocha";

import {Error} from "tslint/lib/error";
import {AliasTable, SupportedTypes} from "../../src";
import {getPlainConvertor} from "../../src";

describe("Plain Convertor Convert Test", () => {
    describe(SupportedTypes.Any, () => {
        const convertor = getPlainConvertor(SupportedTypes.Any);
        it("receive number", () => {
            expect(convertor.convert(1)).to.equal(1);
        });
        it("receive string", () => {
            expect(convertor.convert("aaa")).to.equal("aaa");
        });
        it("receive 0", () => {
            expect(convertor.convert(0)).to.equal(0);
        });
        it("receive undefined", () => {
            expect(convertor.convert(undefined)).to.equal(undefined);
        });
        describe("alias of " + SupportedTypes.Any, () => {
            AliasTable[SupportedTypes.Any].forEach((alias) => {
                it(alias, () => {
                    expect(convertor.convert(3)).to.equal(3);
                });
            });
        });
    });

    describe(SupportedTypes.String, () => {
        const convertor = getPlainConvertor(SupportedTypes.String);
        it("receive number", () => {
            expect(convertor.convert(1)).to.equal("1");
            expect(convertor.convert(-1.22)).to.equal("-1.22");
        });
        it("receive 0", () => {
            expect(convertor.convert(0)).to.equal("0");
        });
        it("receive string", () => {
            expect(convertor.convert("aaa")).to.equal("aaa");
        });
        it("receive undefined", () => {
            expect(() => convertor.convert(undefined)).to.throw(Error);
        });
        describe("alias of " + SupportedTypes.String, () => {
            AliasTable[SupportedTypes.String].forEach((alias) => {
                it(alias, () => {
                    expect(convertor.convert("aaa")).to.equal("aaa");
                });
            });
        });
    });

    describe(SupportedTypes.Boolean, () => {
        const convertor = getPlainConvertor(SupportedTypes.Boolean);
        it("receive number", () => {
            expect(convertor.convert(1)).to.equal(true);
            expect(convertor.convert(2.398)).to.equal(true);
        });
        it("receive 0", () => {
            expect(convertor.convert(0)).to.equal(false);
        });
        it("receive string aaa|y|yes|t|true|on", () => {
            expect(convertor.convert("aaa")).to.equal(false);
            expect(convertor.convert("y")).to.equal(true);
            expect(convertor.convert("yes")).to.equal(true);
            expect(convertor.convert("t")).to.equal(true);
            expect(convertor.convert("true")).to.equal(true);
            expect(convertor.convert("on")).to.equal(true);
        });
        it("receive undefined", () => {
            expect(() => convertor.convert(undefined)).to.throw(Error);
        });
        describe("alias of " + SupportedTypes.Boolean, () => {
            AliasTable[SupportedTypes.Boolean].forEach((alias) => {
                it(alias, () => {
                    expect(convertor.convert("t")).to.equal(true);
                });
            });
        });
    });

    describe(SupportedTypes.Float, () => {
        const convertor = getPlainConvertor(SupportedTypes.Float);
        it("receive round", () => {
            expect(convertor.convert(1)).to.equal(1);
        });
        it("receive 0", () => {
            expect(convertor.convert(0)).to.equal(0);
        });
        it("receive float", () => {
            expect(convertor.convert(1.123123)).to.equal(1.123123);
        });
        it("receive number string", () => {
            expect(convertor.convert("1.2")).to.equal(1.2);
            expect(convertor.convert("-1.2")).to.equal(-1.2);
        });
        it("receive non-number string", () => {
            expect(() => convertor.convert("y")).to.throw(Error);
        });
        it("receive undefined", () => {
            expect(() => convertor.convert(undefined)).to.throw(Error);
        });
        describe("alias of " + SupportedTypes.Float, () => {
            AliasTable[SupportedTypes.Float].forEach((alias) => {
                it(alias, () => {
                    expect(convertor.convert(-3.333)).to.equal(-3.333);
                });
            });
        });
    });

    describe(SupportedTypes.UFloat, () => {
        const convertor = getPlainConvertor(SupportedTypes.UFloat);
        it("receive float", () => {
            expect(convertor.convert(1.123123)).to.equal(1.123123);
            expect(() => convertor.convert(-1.123123)).to.throw(Error);
        });
        it("receive 0", () => {
            expect(convertor.convert(0)).to.equal(0);
        });
        it("receive number string", () => {
            expect(convertor.convert("1.2")).to.equal(1.2);
            expect(() => convertor.convert("-1.2")).to.throw(Error);
        });
        describe("alias of " + SupportedTypes.UFloat, () => {
            AliasTable[SupportedTypes.UFloat].forEach((alias) => {
                it(alias, () => {
                    expect(convertor.convert(3.333)).to.equal(3.333);
                });
            });
        });
    });

    describe(SupportedTypes.Int, () => {
        const convertor = getPlainConvertor(SupportedTypes.Int);
        it("receive number", () => {
            expect(convertor.convert(1)).to.equal(1);
            expect(() => convertor.convert(1.123123)).to.throw(Error);
            expect(convertor.convert(-1)).to.equal(-1);
        });
        it("receive 0", () => {
            expect(convertor.convert(0)).to.equal(0);
        });
        it("receive number string", () => {
            expect(convertor.convert("1")).to.equal(1);
            expect(() => convertor.convert("1.233")).to.throw(Error);
        });
        describe("alias of " + SupportedTypes.Int, () => {
            AliasTable[SupportedTypes.Int].forEach((alias) => {
                it(alias, () => {
                    expect(convertor.convert(88)).to.equal(88);
                });
            });
        });
    });

    describe(SupportedTypes.UInt, () => {
        const convertor = getPlainConvertor(SupportedTypes.UInt);
        it("receive number", () => {
            expect(convertor.convert(2)).to.equal(2);
            expect(() => convertor.convert(1.123123)).to.throw(Error);
            expect(() => convertor.convert(-1)).to.throw(Error);
        });
        it("receive 0", () => {
            expect(convertor.convert(0)).to.equal(0);
        });
        it("receive number string", () => {
            expect(convertor.convert("1")).to.equal(1);
            expect(() => convertor.convert("-1")).to.throw(Error);
            expect(() => convertor.convert("2.1")).to.throw(Error);
        });
        describe("alias of " + SupportedTypes.UInt, () => {
            AliasTable[SupportedTypes.UInt].forEach((alias) => {
                it(alias, () => {
                    expect(convertor.convert(2)).to.equal(2);
                });
            });
        });
    });

    describe(SupportedTypes.Undefined, () => {
        const convertor = getPlainConvertor(SupportedTypes.Undefined);
        it("receive undefined", () => {
            expect(convertor.convert(undefined)).to.equal(undefined);
        });
        it("receive 0", () => {
            expect(() => convertor.convert(0)).to.throw(Error);
        });
        it("receive float", () => {
            expect(() => convertor.convert(1.123123)).to.throw(Error);
        });
        describe("alias of " + SupportedTypes.Undefined, () => {
            AliasTable[SupportedTypes.Undefined].forEach((alias) => {
                it(alias, () => {
                    expect(convertor.convert(undefined)).to.equal(undefined);
                });
            });
        });
    });

});
