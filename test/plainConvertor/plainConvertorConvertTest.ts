import {expect} from "chai";
import "mocha";

import {Error} from "tslint/lib/error";
import {SupportedTypes} from "../../src";
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
        it("receive undefined", () => {
            expect(convertor.convert(undefined)).to.equal(undefined);
        });
    });

    describe(SupportedTypes.String, () => {
        const convertor = getPlainConvertor(SupportedTypes.String);
        it("receive number", () => {
            expect(convertor.convert(1)).to.equal("1");
            expect(convertor.convert(-1.22)).to.equal("-1.22");
        });
        it("receive string", () => {
            expect(convertor.convert("aaa")).to.equal("aaa");
        });
        it("receive undefined", () => {
            expect(() => convertor.convert(undefined)).to.throw(Error);
        });
    });

    describe(SupportedTypes.Boolean, () => {
        const convertor = getPlainConvertor(SupportedTypes.Boolean);
        it("receive number", () => {
            expect(convertor.convert(1)).to.equal(true);
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
    });

    describe(SupportedTypes.Float, () => {
        const convertor = getPlainConvertor(SupportedTypes.Float);
        it("receive round", () => {
            expect(convertor.convert(1)).to.equal(1);
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
    });

    describe(SupportedTypes.UFloat, () => {
        const convertor = getPlainConvertor(SupportedTypes.UFloat);
        it("receive float", () => {
            expect(convertor.convert(1.123123)).to.equal(1.123123);
            expect(() => convertor.convert(-1.123123)).to.throw(Error);
        });
        it("receive number string", () => {
            expect(convertor.convert("1.2")).to.equal(1.2);
            expect(() => convertor.convert("-1.2")).to.throw(Error);
        });
    });

    describe(SupportedTypes.Int, () => {
        const convertor = getPlainConvertor(SupportedTypes.Int);
        it("receive int", () => {
            expect(convertor.convert(1)).to.equal(1);
            expect(convertor.convert(-1)).to.equal(-1);
        });
        it("receive float", () => {
            expect(() => convertor.convert(1.123123)).to.throw(Error);
        });
    });

});
