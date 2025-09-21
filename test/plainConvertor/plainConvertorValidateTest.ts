import {expect} from "chai";
import "mocha";

import {SupportedTypes} from "../../src/constant";
import {getPlainConvertor} from "../../src/convertor";

function expectResult(ok: boolean, value: any, sample: any, type: string) {
    const convertor = getPlainConvertor(type);
    const result = convertor.validate(sample);
    expect(result.ok).to.equal(ok);
    if (ok) {
        expect(result.value).to.deep.equal(value);
        expect(result.errors).to.deep.equal([]);
    } else {
        expect(result.errors.length).to.be.greaterThan(0);
    }
}

describe("PlainConvertor.validate", () => {
    it("returns ok/value for valid inputs", () => {
        expectResult(true, "123", "123", SupportedTypes.String);
        expectResult(true, 10, "10", SupportedTypes.Int);
        expectResult(true, true, "yes", SupportedTypes.Boolean);
    });

    it("collects errors for invalid inputs", () => {
        const stringResult = getPlainConvertor(SupportedTypes.String).validate(undefined);
        expect(stringResult.ok).to.be.false;
        expect(stringResult.errors[0].message).to.contain("string");

        const uintResult = getPlainConvertor(SupportedTypes.UInt).validate("-3");
        expect(uintResult.ok).to.be.false;
        expect(uintResult.errors[0].message).to.contain("unsigned");
    });

    it("includes path in failure when provided", () => {
        const result = getPlainConvertor(SupportedTypes.Float).validate("abc", { path: [1, "value"] });
        expect(result.ok).to.be.false;
        expect(result.errors[0].path).to.deep.equal([1, "value"]);
    });

    it("fails fast when requested", () => {
        const convertor = getPlainConvertor(SupportedTypes.Float);
        expect(() => convertor.convert("abc", { failFast: true })).to.throw(TypeError);
    });
});
