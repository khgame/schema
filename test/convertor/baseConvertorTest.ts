import {expect} from "chai";
import "mocha";

import {ConvertError, ConvertOptions, ConvertResult, Convertor} from "../../src/convertor";

class StubConvertor extends Convertor<number> {
    constructor(private readonly response: ConvertResult<number>) {
        super();
    }

    public validate(_v: any, _options?: ConvertOptions): ConvertResult<number> {
        return this.response;
    }
}

describe("Convertor infrastructure", () => {

    it("propagates failFast errors with metadata", () => {
        const errors: ConvertError[] = [{ message: "boom", path: [1], raw: "raw" }];
        const convertor = new StubConvertor({ ok: false, errors });
        try {
            convertor.convert("data", { failFast: true });
            expect.fail("expected failFast to throw");
        } catch (err) {
            const thrown: any = err;
            expect(thrown).to.be.instanceOf(TypeError);
            expect(thrown.convertErrors).to.deep.equal(errors);
        }
    });

    it("ok helper produces success result", () => {
        class OkConvertor extends Convertor<number> {
            public validate(): ConvertResult<number> {
                return this.ok(42);
            }
        }
        const convertor = new OkConvertor();
        const result = convertor.convert("input");
        expect(result.ok).to.be.true;
        expect(result.value).to.equal(42);
    });

    it("failFast uses default error when errors array empty", () => {
        const convertor = new StubConvertor({ ok: false, errors: [] });
        try {
            convertor.convert("input", { failFast: true });
            expect.fail("should throw");
        } catch (err) {
            const thrown: any = err;
            expect(thrown.message).to.equal("conversion failed");
        }
    });

    it("merge combines successes and failures", () => {
        class MergeConvertor extends Convertor<any> {
            public validate(): ConvertResult<any> {
                const part = [
                    this.ok(1),
                    { ok: false, errors: [{ message: "fail", path: [1] }] },
                    this.ok(3),
                ];
                return this.merge(part);
            }
        }
        const convertor = new MergeConvertor();
        const result = convertor.convert("value");
        expect(result.ok).to.be.false;
        expect(result.errors).to.have.length(1);
        expect(result.errors[0].path).to.deep.equal([1]);
    });

    it("fail helper captures metadata", () => {
        class FailConvertor extends Convertor<number> {
            public validate(): ConvertResult<number> {
                return this.fail("ouch", { path: [2], raw: "raw", cause: new Error("cause") });
            }
        }
        const convertor = new FailConvertor();
        const result = convertor.convert(0);
        expect(result.ok).to.be.false;
        const err = result.errors[0];
        expect(err.path).to.deep.equal([2]);
        expect(err.raw).to.equal("raw");
        expect(err.cause).to.be.instanceOf(Error);
    });

    it("fail helper can be called directly", () => {
        const convertor = new StubConvertor({ ok: true, value: 0, errors: [] });
        const result = convertor.fail("direct");
        expect(result.ok).to.be.false;
        expect(result.errors[0].message).to.equal("direct");
    });
});
