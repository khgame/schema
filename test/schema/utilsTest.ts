import {expect} from "chai";
import "mocha";

import {SupportedTypes} from "../../src/constant";
import {SDM, SDMType} from "../../src/schema/structureDescriptionMark";
import {parseSchema} from "../../src/schema/schema";
import {parseMD} from "../../src/schema/utils";
import {TDM, TNode, TSeg, getTypeNameByAlias} from "../../src/schema/typeDescriptionMark";

describe("Schema Utility Surface", () => {

    describe("mark decorator parsing", () => {
        it("extracts decorators while leaving structural token", () => {
            const result = parseMD("$ghost $strict {");
            expect(result.mds).to.deep.equal(["$ghost", "$strict"]);
            expect(result.strLeft).to.equal("{");
        });

        it("returns empty metadata when decorators are absent", () => {
            const result = parseMD("uint");
            expect(result.mds).to.deep.equal([]);
            expect(result.strLeft).to.equal("uint");
        });
    });

    describe("type alias resolution", () => {
        it("maps known aliases back to canonical type names", () => {
            expect(getTypeNameByAlias("str")).to.equal(SupportedTypes.String);
            expect(getTypeNameByAlias("uint16")).to.equal(SupportedTypes.UInt);
            expect(getTypeNameByAlias("dynamic")).to.equal(SupportedTypes.Any);
        });

        it("falls back to none for unknown aliases", () => {
            expect(getTypeNameByAlias("mystery"))
                .to.equal(SupportedTypes.None);
        });
    });

    describe("type segment and node formatting", () => {
        it("parses unions and optional suffix into segments", () => {
            const seg = TSeg.parse("int|string?");
            expect(seg.length).to.equal(3);
            expect(seg.get(0).tName).to.equal(SupportedTypes.Int);
            expect(seg.get(1).tName).to.equal(SupportedTypes.String);
            expect(seg.get(2).tName).to.equal(SupportedTypes.Undefined);
        });

        it("renders nested template nodes back to schema strings", () => {
            const node = TNode.parse("array<pair<uint|string>>");
            expect(node.toSchemaStr()).to.equal("array<pair<uint|string>>");

            const json = node.toSchemaJson();
            expect(json.tName).to.equal(SupportedTypes.Array);
            expect(json.innerTypes[0].tName).to.equal(SupportedTypes.Pair);
        });
    });

    describe("type description marks", () => {
        it("includes decorators and indices when serialised", () => {
            const tdm = TDM.parse("$strict int", 3);
            expect(tdm.toSchemaStr()).to.equal("$strict int");

            const json = tdm.toSchemaJson();
            expect(json.mds).to.deep.equal(["$strict"]);
            expect(json.ind).to.equal(3);
            expect(json.tName).to.equal(SupportedTypes.Int);
        });

        it("captures unions in json representation", () => {
            const tdm = TDM.parse("uint|string");
            const json = tdm.toSchemaJson();
            expect(json.types).to.deep.equal(["uint", "string"]);
        });
    });

    describe("structure description marks", () => {
        it("tracks decorators and children", () => {
            const sdm = SDM.parse(SDMType.Obj, ["$ghost"], ["uint", "string", "}"]);
            expect(sdm.hasDecorator("$ghost")).to.be.true;
            expect(sdm.toSchemaStr()).to.equal("$ghost { uint, string }");

            const json = sdm.toSchemaJson();
            expect(json.children).to.have.length(2);
            expect(json.fromTo).to.deep.equal([0, 2]);
        });

        it("serialises nested objects parsed from schema", () => {
            const schema = parseSchema([
                "uint",
                "nested", "{",
                    "float", "float",
                "}",
                "uint",
            ]);

            expect(schema.toSchemaStr()).to.equal("{ uint, none, { float, float }, uint }");

            const json = schema.toSchemaJson();
            expect(json.children[2].children).to.have.length(2);
        });
    });
});
