import {expect} from "chai";
import "mocha";

import {SupportedTypes} from "../../src/constant";
import {getPlainConvertor} from "../../src/convertor";

describe("Plain Convertor Validate Test", () => {
    describe(SupportedTypes.Any, () => {
        const convertor = getPlainConvertor(SupportedTypes.Any);
        it("receive number", () => {
            expect(convertor.validate(1)).to.deep.equal([true, 1]);
        });
        it("receive string", () => {
            expect(convertor.validate("aaa")).to.deep.equal([true, "aaa"]);
        });
        it("receive undefined", () => {
            expect(convertor.validate(undefined)).to.deep.equal([true, undefined]);
        });
    });

    describe(SupportedTypes.String, () => {
        const convertor = getPlainConvertor(SupportedTypes.String);
        it("receive number", () => {
            expect(convertor.validate(1)).to.deep.equal([true, "1"]);
            expect(convertor.validate(-1.22)).to.deep.equal([true, "-1.22"]);
        });
        it("receive string", () => {
            expect(convertor.validate("aaa")).to.deep.equal([true, "aaa"]);
        });
        it("receive undefined", () => {
            expect(convertor.validate(undefined)).to.deep.equal([false, ""]);
        });
    });

    describe(SupportedTypes.Boolean, () => {
        const convertor = getPlainConvertor(SupportedTypes.Boolean);
        it("receive number", () => {
            expect(convertor.validate(1)[0]).to.equal(true);
            expect(convertor.validate(1)[1]).to.equal(true);
            expect(convertor.validate(0)[0]).to.equal(true);
            expect(convertor.validate(0)[1]).to.equal(false);
        });
        it("receive string aaa|y|yes|t|true|on", () => {
            expect(convertor.validate("aaa")).to.deep.equal([true, false]);
            expect(convertor.validate("y")).to.deep.equal([true, true]);
            expect(convertor.validate("yes")).to.deep.equal([true, true]);
            expect(convertor.validate("t")).to.deep.equal([true, true]);
            expect(convertor.validate("true")).to.deep.equal([true, true]);
            expect(convertor.validate("on")).to.deep.equal([true, true]);
        });
        it("receive undefined", () => {
            expect(convertor.validate(undefined)[0]).to.equal(false);
        });
    });

    describe(SupportedTypes.Float, () => {
        const convertor = getPlainConvertor(SupportedTypes.Float);
        it("receive round", () => {
            expect(convertor.validate(1)).to.deep.equal([true, 1]);
        });
        it("receive float", () => {
            expect(convertor.validate(1.123123)).to.deep.equal([true, 1.123123]);
        });
        it("receive number string", () => {
            expect(convertor.validate("1.2")).to.deep.equal([true, 1.2]);
            expect(convertor.validate("-1.2")).to.deep.equal([true, -1.2]);
        });
        it("receive non-number string", () => {
            expect(convertor.validate("y")).to.deep.equal([false, NaN]);
        });
        it("receive empty string", () => {
            expect(convertor.validate("")).to.deep.equal([false, ""]);
            expect(convertor.validate("  ")).to.deep.equal([false, "  "]);
        });
        it("receive undefined", () => {
            expect(convertor.validate(undefined)).to.deep.equal([false, undefined]);
        });
    });

    describe(SupportedTypes.UFloat, () => {
        const convertor = getPlainConvertor(SupportedTypes.UFloat);
        it("receive float", () => {
            expect(convertor.validate(1.123123)).to.deep.equal([true, 1.123123]);
            expect(convertor.validate(-1.123123)).to.deep.equal([false, -1.123123]);
        });
        it("receive number string", () => {
            expect(convertor.validate("1.2")).to.deep.equal([true, 1.2]);
            expect(convertor.validate("-1.2")).to.deep.equal([false, -1.2]);
        });
    });

    describe(SupportedTypes.Int, () => {
        const convertor = getPlainConvertor(SupportedTypes.Int);
        it("receive int", () => {
            expect(convertor.validate(1)).to.deep.equal([true, 1]);
            expect(convertor.validate(-1)).to.deep.equal([true, -1]);
        });
        it("receive float", () => {
            expect(convertor.validate(1.123123)).to.deep.equal([false, 1.123123]);
        });
    });

    describe(SupportedTypes.Undefined, () => {
        const convertor = getPlainConvertor(SupportedTypes.Undefined);
        it("receive int", () => {
            expect(convertor.validate(1)).to.deep.equal([false, undefined]);
        });
        it("receive undefined", () => {
            expect(convertor.validate(undefined)).to.deep.equal([true, undefined]);
        });
        it("receive null", () => {
            expect(convertor.validate(null)).to.deep.equal([true, undefined]);
        });
        it("receive empty string", () => {
            expect(convertor.validate("")).to.deep.equal([true, undefined]);
            expect(convertor.validate(" ")).to.deep.equal([true, undefined]);
            expect(convertor.validate("     ")).to.deep.equal([true, undefined]);
        });
    });

    describe("default situation", () => {

        it(SupportedTypes.None, () => {
            const convertor = getPlainConvertor(SupportedTypes.None);
            expect(convertor).to.equal(undefined);
        });

        it(SupportedTypes.Array, () => {
            const convertor = getPlainConvertor(SupportedTypes.Array);
            expect(convertor).to.equal(undefined);
        });

        it(SupportedTypes.Pair, () => {
            const convertor = getPlainConvertor(SupportedTypes.Pair);
            expect(convertor).to.equal(undefined);
        });
    });

});
