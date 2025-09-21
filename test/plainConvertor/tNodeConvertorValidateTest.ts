import {expect} from "chai";
import "mocha";

import {SupportedTypes} from "../../src/constant";
import {TNodeConvertor} from "../../src/convertor";
import {TDM} from "../../src/schema/typeDescriptionMark";

function parseSingleNode(mark: string, context?: Parameters<typeof TDM.parse>[2]) {
    return TDM.parse(mark, 0, context).inner(0);
}

describe("TNode Convertor", () => {

    describe("basic type delegation", () => {
        const node = parseSingleNode("int");
        const convertor = new TNodeConvertor(node);

        it("converts strings to integers", () => {
            const result = convertor.convert("42");
            expect(result.ok).to.be.true;
            expect(result.value).to.equal(42);
        });

        it("fails fast on incompatible input", () => {
            expect(convertor.convert("not-a-number").ok).to.be.false;
            expect(() => convertor.convert("not-a-number", { failFast: true })).to.throw(TypeError);
        });
    });

    describe("template handling", () => {
        it("expands array templates into lists", () => {
            const node = parseSingleNode(`${SupportedTypes.Array}<uint>`);
            const convertor = new TNodeConvertor(node);

            const result = convertor.convert("1|2|3");
            expect(result.ok).to.be.true;
            expect(result.value).to.deep.equal([1, 2, 3]);
        });

        it("parses pair templates into key/value records", () => {
            const node = parseSingleNode(`${SupportedTypes.Pair}<string>`);
            const convertor = new TNodeConvertor(node);

            const result = convertor.convert("name:Hero");
            expect(result.ok).to.be.true;
            expect(result.value).to.deep.equal({key: "name", val: "Hero"});
        });
    });

    describe("enum resolution", () => {
        const context = {
            enums: {
                Element: {
                    FIRE: 1,
                    WATER: [2, "alt"],
                },
            },
        };
        const node = parseSingleNode(`${SupportedTypes.Enum}<Element>`, context);
        const convertor = new TNodeConvertor(node);

        it("matches enum keys case-insensitively", () => {
            expect(convertor.convert("fire").value).to.equal(1);
            expect(convertor.convert("WATER").value).to.equal(2);
        });

        it("rejects values outside the enum table", () => {
            expect(convertor.convert("earth").ok).to.be.false;
        });
    });

    describe("union types", () => {
        const node = parseSingleNode("int|string");
        const convertor = new TNodeConvertor(node);

        it("prefers the first branch when it succeeds", () => {
            expect(convertor.convert("12").value).to.equal(12);
        });

        it("propagates errors from non-matching branches", () => {
            expect(convertor.convert("text").ok).to.be.false;
        });
    });

    describe("unsupported types", () => {
        it("throws when no convertor can be resolved", () => {
            const orphanNode = { tName: "__unknown__", innerCount: 0 } as any;
            expect(() => new TNodeConvertor(orphanNode)).to.throw();
        });
    });
});
