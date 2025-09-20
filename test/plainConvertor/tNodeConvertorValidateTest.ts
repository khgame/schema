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
            expect(convertor.convert("42")).to.equal(42);
        });

        it("fails fast on incompatible input", () => {
            expect(() => convertor.convert("not-a-number")).to.throw();
        });
    });

    describe("template handling", () => {
        it("expands array templates into lists", () => {
            const node = parseSingleNode(`${SupportedTypes.Array}<uint>`);
            const convertor = new TNodeConvertor(node);

            expect(convertor.convert("1|2|3")).to.deep.equal([1, 2, 3]);
        });

        it("parses pair templates into key/value records", () => {
            const node = parseSingleNode(`${SupportedTypes.Pair}<string>`);
            const convertor = new TNodeConvertor(node);

            expect(convertor.convert("name:Hero")).to.deep.equal({key: "name", val: "Hero"});
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
            expect(convertor.convert("fire")).to.equal(1);
            expect(convertor.convert("WATER")).to.equal(2);
        });

        it("rejects values outside the enum table", () => {
            expect(() => convertor.convert("earth")).to.throw();
        });
    });

    describe("union types", () => {
        const node = parseSingleNode("int|string");
        const convertor = new TNodeConvertor(node);

        it("prefers the first branch when it succeeds", () => {
            expect(convertor.convert("12")).to.equal(12);
        });

        it("propagates errors from non-matching branches", () => {
            expect(() => convertor.convert("text")).to.throw();
        });
    });

    describe("unsupported types", () => {
        it("throws when no convertor can be resolved", () => {
            const orphanNode = { tName: "__unknown__", innerCount: 0 } as any;
            expect(() => new TNodeConvertor(orphanNode)).to.throw();
        });
    });
});
