import {expect} from "chai";
import "mocha";

import {SchemaConvertor, SDMConvertor} from "../../src/convertor";
import {SDM, SDMType} from "../../src/schema/structureDescriptionMark";
import {parseSchema} from "../../src/schema";

function expectOk(result: ReturnType<SchemaConvertor["convert"]>) {
    expect(result.ok).to.be.true;
    expect(result.errors).to.deep.equal([]);
}

describe("SchemaConvertor", () => {
    it("converts simple object rows", () => {
        const schema = parseSchema(["id", "name"]);
        const convertor = new SchemaConvertor(schema);
        const result = convertor.convert([1, "hero"]);
        expectOk(result);
        expect(result.value?.[0].value).to.equal(1);
        expect(result.value?.[1].value).to.equal("hero");
    });

    it("collects errors with paths", () => {
        const schema = parseSchema(["uint", "string"]);
        const convertor = new SchemaConvertor(schema);
        const result = convertor.convert(["oops", 123]);
        expect(result.ok).to.be.false;
        expect(result.errors[0].path).to.deep.equal([0]);
    });

    it("treats non-strict arrays with undefined items as soft success", () => {
        const sdm = SDM.parse(SDMType.Arr, [], ["uint", "uint", "]"], 0);
        const convertor = new SDMConvertor(sdm);
        const result = convertor.validate([undefined, undefined]);
        expect(result.ok).to.be.true;
        expect(result.value?.[0].ok).to.be.false;
        expect(result.errors).to.deep.equal([]);
    });

    it("returns undefined for $ghost arrays", () => {
        const sdm = SDM.parse(SDMType.Arr, ["$ghost"], ["undefined", "undefined", "]"], 0);
        const convertor = new SDMConvertor(sdm);
        const result = convertor.validate([undefined, undefined]);
        expect(result.ok).to.be.true;
        expect(result.value).to.equal(undefined);
    });

    it("returns undefined for $ghost objects", () => {
        const sdm = SDM.parse(SDMType.Obj, ["$ghost"], ["undefined", "undefined", "}"], 0);
        const convertor = new SDMConvertor(sdm);
        const result = convertor.validate([undefined, undefined]);
        expect(result.ok).to.be.true;
        expect(result.value).to.equal(undefined);
    });

    it("honors failFast option", () => {
        const schema = parseSchema(["uint"]);
        const convertor = new SchemaConvertor(schema);
        expect(() => convertor.convert(["bad"], { failFast: true })).to.throw(TypeError);
    });
});
