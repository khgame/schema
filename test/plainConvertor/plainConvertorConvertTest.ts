import {expect} from "chai";
import "mocha";

import {SupportedTypes} from "../../src";
import {ConvertResult, getPlainConvertor} from "../../src";

describe("PlainConvertor.convert soft-fail behaviour", () => {

    function expectSuccess(result: ConvertResult, expected: any) {
        expect(result.ok).to.be.true;
        expect(result.errors).to.have.length(0);
        expect(result.value).to.deep.equal(expected);
    }

    function expectFailure(result: ConvertResult) {
        expect(result.ok).to.be.false;
        expect(result.errors.length).to.be.greaterThan(0);
    }

    describe(SupportedTypes.Any, () => {
        const convertor = getPlainConvertor(SupportedTypes.Any);
        it("passes through any value", () => {
            [1, "aaa", 0, undefined, null].forEach((sample) => {
                expectSuccess(convertor.convert(sample), sample);
            });
        });
    });

    describe(SupportedTypes.String, () => {
        const convertor = getPlainConvertor(SupportedTypes.String);
        it("coerces primitives to string", () => {
            expectSuccess(convertor.convert(1), "1");
            expectSuccess(convertor.convert(-1.22), "-1.22");
        });

        it("rejects nullish values", () => {
            expectFailure(convertor.convert(undefined));
            expect(() => convertor.convert(undefined, { failFast: true })).to.throw(TypeError);
        });
    });

    describe(SupportedTypes.Boolean, () => {
        const convertor = getPlainConvertor(SupportedTypes.Boolean);
        it("accepts numeric and textual truthy values", () => {
            expectSuccess(convertor.convert(1), true);
            expectSuccess(convertor.convert("y"), true);
            expectSuccess(convertor.convert("aaa"), false);
        });

        it("rejects undefined", () => {
            expectFailure(convertor.convert(undefined));
        });
    });

    describe(SupportedTypes.Float, () => {
        const convertor = getPlainConvertor(SupportedTypes.Float);
        it("parses numbers from string", () => {
            expectSuccess(convertor.convert("1.2"), 1.2);
            expectSuccess(convertor.convert("-1.2"), -1.2);
        });

        it("fails on invalid numeric strings", () => {
            const failure = convertor.convert("y");
            expectFailure(failure);
            expect(() => convertor.convert("y", { failFast: true })).to.throw(TypeError);
        });
    });

    describe(SupportedTypes.UFloat, () => {
        const convertor = getPlainConvertor(SupportedTypes.UFloat);
        it("requires non-negative numbers", () => {
            expectSuccess(convertor.convert(1.123123), 1.123123);
            expectFailure(convertor.convert(-1.123123));
        });
    });

    describe(SupportedTypes.Int, () => {
        const convertor = getPlainConvertor(SupportedTypes.Int);
        it("rounds valid integers", () => {
            expectSuccess(convertor.convert(1), 1);
            expectSuccess(convertor.convert("2"), 2);
        });

        it("rejects floats", () => {
            expectFailure(convertor.convert(1.5));
        });
    });

    describe(SupportedTypes.UInt, () => {
        const convertor = getPlainConvertor(SupportedTypes.UInt);
        it("rejects negative numbers", () => {
            expectFailure(convertor.convert(-1));
        });

        it("accepts positive integers", () => {
            expectSuccess(convertor.convert("8"), 8);
        });
    });

    describe(SupportedTypes.Undefined, () => {
        const convertor = getPlainConvertor(SupportedTypes.Undefined);
        it("allows empty/nullish", () => {
            expectSuccess(convertor.convert(undefined), undefined);
            expectSuccess(convertor.convert(""), undefined);
        });

        it("rejects concrete values", () => {
            expectFailure(convertor.convert(0));
        });
    });
});
