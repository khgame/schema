import {expect} from "chai";
import "mocha";

import {TemplateConvertor, RichConvertor, EnumConvertor, TNodeConvertor} from "../../src/convertor";
import {TDM} from "../../src/schema/typeDescriptionMark";
import {SupportedTypes} from "../../src/constant";

describe("RichConvertor family", () => {
    it("TemplateConvertor handles arrays with soft failures", () => {
        const node = TDM.parse("array<uint>").inner(0);
        const convertor = new TemplateConvertor(node);

        const okResult = convertor.convert("1|2|3");
        expect(okResult.ok).to.be.true;
        expect(okResult.value).to.deep.equal([1, 2, 3]);

        const failResult = convertor.convert("1|oops|3");
        expect(failResult.ok).to.be.false;
        expect(failResult.errors.length).to.equal(1);
    });

    it("TemplateConvertor falls back to any when template missing", () => {
        const node = TDM.parse("array<>").inner(0);
        const convertor = new TemplateConvertor(node);
        expect(convertor.convert(123).value).to.deep.equal([123]);
    });

    it("TemplateConvertor delegates to RichConvertor for multiple inner types", () => {
        const node = TDM.parse("array<uint|string>").inner(0);
        const convertor = new TemplateConvertor(node);
        const result = convertor.convert("text");
        expect(result.ok).to.be.true;
        expect(result.value).to.deep.equal(["text"]);
    });

    it("TemplateConvertor reports pair parse errors", () => {
        const node = TDM.parse("pair<uint>").inner(0);
        const convertor = new TemplateConvertor(node);
        const result = convertor.convert("not-a-pair");
        expect(result.ok).to.be.false;
        expect(result.errors[0].message).to.contain("pair value");
    });

    it("TemplateConvertor parses pair templates", () => {
        const node = TDM.parse("pair<string>").inner(0);
        const convertor = new TemplateConvertor(node);
        const result = convertor.convert("name:Hero");
        expect(result.ok).to.be.true;
        expect(result.value).to.deep.equal({ key: "name", val: "Hero" });
    });

    it("TemplateConvertor rejects non-string pair input", () => {
        const node = TDM.parse("pair<uint>").inner(0);
        const convertor = new TemplateConvertor(node);
        const result = convertor.convert(123 as any);
        expect(result.ok).to.be.false;
        expect(result.errors[0].message).to.contain("pair requires string");
    });

    it("TemplateConvertor propagates inner validation errors", () => {
        const node = TDM.parse("pair<uint>").inner(0);
        const convertor = new TemplateConvertor(node);
        const result = convertor.convert("key:bad");
        expect(result.ok).to.be.false;
        expect(result.errors[0].path).to.deep.equal(["val"]);
    });

    it("RichConvertor tries branches until success", () => {
        const node = TDM.parse("uint|string");
        const convertor = new RichConvertor(node.tSeg);
        const numeric = convertor.convert("42");
        expect(numeric.ok).to.be.true;
        expect(numeric.value).to.equal(42);

        const fallback = convertor.convert("not-number");
        expect(fallback.ok).to.be.true;
        expect(fallback.value).to.equal("not-number");
    });

    it("RichConvertor surfaces failure when all branches fail", () => {
        const node = TDM.parse("uint|ufloat");
        const convertor = new RichConvertor(node.tSeg);
        const failure = convertor.convert("bad");
        expect(failure.ok).to.be.false;
        expect(failure.errors[0].message.length).to.be.greaterThan(0);
    });

    it("RichConvertor reports default message when no branches exist", () => {
        const emptySeg: any = { nodes: [] };
        const convertor = new RichConvertor(emptySeg);
        const failure = convertor.convert("value");
        expect(failure.ok).to.be.false;
        expect(failure.errors[0].message).to.include("no union branch matched");
    });

    it("EnumConvertor resolves context enums", () => {
        const context = { enums: { Element: { FIRE: 1, WATER: [2, "alt"] } } };
        const node = TDM.parse("enum<Element>", 0, context).inner(0);
        const convertor = new EnumConvertor(node);
        expect(convertor.convert("water").value).to.equal(2);
        expect(convertor.convert("unknown").ok).to.be.false;
    });

    it("EnumConvertor matches raw fallback", () => {
        const node = TDM.parse("enum<Value>").inner(0);
        const convertor = new EnumConvertor(node);
        const result = convertor.convert("Value");
        expect(result.ok).to.be.true;
        expect(result.value).to.equal("Value");
    });

    it("TNodeConvertor delegates to plain convertors", () => {
        const node = TDM.parse("int").inner(0);
        const convertor = new TNodeConvertor(node);
        const ok = convertor.convert("10");
        expect(ok.ok).to.be.true;
        expect(ok.value).to.equal(10);
    });

    it("TNodeConvertor surfaces template errors with paths", () => {
        const node = TDM.parse(`${SupportedTypes.Array}<uint>`).inner(0);
        const convertor = new TNodeConvertor(node);
        const result = convertor.convert("1|nope|3");
        expect(result.ok).to.be.false;
        expect(result.errors[0].path).to.deep.equal([1]);
    });

    it("TNodeConvertor reports unsupported template type", () => {
        const node: any = { tName: "unknown", innerCount: 0 };
        expect(() => new TNodeConvertor(node)).to.throw();
    });

    it("TemplateConvertor returns unsupported template failure", () => {
        const node = TDM.parse("array<uint>").inner(0);
        const convertor = new TemplateConvertor(node);
        (convertor as any).tNode.tName = "mystery";
        const result = convertor.convert("value");
        expect(result.ok).to.be.false;
        expect(result.errors[0].message).to.equal("unsupported template");
    });
});
