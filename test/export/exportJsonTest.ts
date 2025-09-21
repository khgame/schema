import {expect} from "chai";
import "mocha";

import {SchemaConvertor} from "../../src/convertor";
import {exportJson} from "../../src/export";
import {parseSchema} from "../../src/schema";

type ConsoleMethod = "log" | "warn";

function captureConsole(methods: ConsoleMethod[], run: () => void): Record<ConsoleMethod, string[]> {
    const original: Partial<Record<ConsoleMethod, (...args: any[]) => void>> = {};
    const buckets: Record<ConsoleMethod, string[]> = { log: [], warn: [] } as any;

    methods.forEach((method) => {
        original[method] = (console as any)[method];
        (console as any)[method] = (message?: any, ...args: any[]) => {
            const merged = [message, ...args]
                .filter((part) => part !== undefined)
                .map((part) => typeof part === "string" ? part : JSON.stringify(part))
                .join(" ")
                .trim();
            buckets[method].push(merged);
        };
    });

    try {
        run();
    } finally {
        methods.forEach((method) => {
            (console as any)[method] = original[method];
        });
    }

    return methods.reduce((acc, method) => {
        acc[method] = buckets[method];
        return acc;
    }, {} as Record<ConsoleMethod, string[]>);
}

describe("exportJson", () => {
    it("exports simple objects", () => {
        const schema = parseSchema(["id", "name"]);
        const headers = ["id", "name"];
        const data = [[1, "Hero"], [2, "Mage"]];
        const result = exportJson(schema, headers, data);
        expect(result).to.deep.equal([
            { id: 1, name: "Hero" },
            { id: 2, name: "Mage" },
        ]);
    });

    it("collects row errors without throwing", () => {
        const schema = parseSchema(["uint", "string"]);
        const headers = ["id", "name"];
        const data = [["bad", "Hero"], [2, "Mage"]];

        const logs = captureConsole(["warn", "log"], () => {
            const result = exportJson(schema, headers, data);
            expect(result[1]).to.deep.equal({ id: 2, name: "Mage" });
            expect(result[0]).to.be.undefined;
        });

        expect(logs.warn[0]).to.contain("ROW:0");
        expect(logs.log[0]).to.contain("COL:0");
    });

    it("honors markDescriptor mappings", () => {
        const schema = parseSchema(["uint"]);
        const headers = ["id"];
        const data = [["bad"]];
        const capture = captureConsole(["warn", "log"], () => {
            exportJson(schema, headers, data, { row: ["R1"], col: ["C1"] });
        });
        expect(capture.warn[0]).to.contain("R1");
        expect(capture.log[0]).to.contain("C1");
    });

    it("respects $ghost decorator", () => {
        const schema = parseSchema(["$ghost", "optional", "{", "field1", "field2", "}"]);
        const headers = ["field1", "field2"];
        const data = [[undefined, undefined]];
        const result = exportJson(schema, headers, data);
        expect(result[0]).to.be.undefined;
    });

    it("builds nested objects from convert results", () => {
        const schema: any = {
            sdmType: 0,
            marks: [
                {
                    markType: 0,
                    markInd: 1,
                    sdmType: 0,
                    marks: [
                        { markType: 1, markInd: 1, mds: [], tSeg: {}, hasDecorator: () => false },
                    ],
                    hasDecorator: () => false,
                },
                { markType: 1, markInd: 2, mds: [], tSeg: {}, hasDecorator: () => false },
            ],
            hasDecorator: () => false,
        };

        const originalValidate = SchemaConvertor.prototype.validate;
        SchemaConvertor.prototype.validate = function () {
            return {
                ok: true,
                value: {
                    1: {
                        ok: true,
                        value: {
                            1: { ok: true, value: "inner", errors: [] },
                        },
                        errors: [],
                    },
                    2: { ok: true, value: "tail", errors: [] },
                },
                errors: [],
            };
        } as any;

        const headers = ["child", "stats", "tail"];
        const data = [["ignored"]];
        try {
            const result = exportJson(schema, headers, data);
            expect(result[0]).to.deep.equal({
                child: { stats: "inner" },
                tail: "tail",
            });
        } finally {
            SchemaConvertor.prototype.validate = originalValidate;
        }
    });

    it("assigns deep error paths", () => {
        const schema: any = {
            sdmType: 0,
            marks: [],
            hasDecorator: () => false,
        };

        const originalValidate = SchemaConvertor.prototype.validate;
        SchemaConvertor.prototype.validate = () => ({
            ok: false,
            errors: [
                { message: "bad", path: [0, 1, 2] },
                { message: "worse", path: [0, 1, 2] },
                { message: "worst", path: [0, 1, 2] },
                { message: undefined },
            ],
        }) as any;

        const capture = captureConsole(["warn", "log"], () => {
            exportJson(schema, ["col0"], [[]]);
        });

        expect(capture.log[0]).to.contain("worst");

        SchemaConvertor.prototype.validate = originalValidate;
    });

    it("retains undefined values for $strict arrays", () => {
        const arraySchema: any = {
            sdmType: 1,
            marks: [
                { markType: 1, markInd: 0, hasDecorator: () => false },
            ],
            hasDecorator: (decorator: string) => decorator === "$strict",
        };

        const originalValidate = SchemaConvertor.prototype.validate;
        SchemaConvertor.prototype.validate = () => ({
            ok: true,
            value: {
                0: { ok: true, value: undefined, errors: [] },
            },
            errors: [],
        }) as any;

        try {
            const result = exportJson(arraySchema, [undefined], [[undefined]]);
            expect(result[0]).to.deep.equal([undefined]);
        } finally {
            SchemaConvertor.prototype.validate = originalValidate;
        }
    });

    it("throws when object key missing", () => {
        const objectSchema: any = {
            sdmType: 0,
            marks: [
                { markType: 1, markInd: 0, hasDecorator: () => false },
            ],
            hasDecorator: () => false,
        };

        const originalValidate = SchemaConvertor.prototype.validate;
        SchemaConvertor.prototype.validate = () => ({
            ok: true,
            value: {
                0: { ok: true, value: "value", errors: [] },
            },
            errors: [],
        }) as any;

        try {
            expect(() => exportJson(objectSchema, [], [["value"]])).to.throw(/key in object not found/);
        } finally {
            SchemaConvertor.prototype.validate = originalValidate;
        }
    });

    it("logs empty line when validation value undefined", () => {
        const schema: any = { sdmType: 0, marks: [], hasDecorator: () => false };
        const originalValidate = SchemaConvertor.prototype.validate;
        SchemaConvertor.prototype.validate = () => ({ ok: true, value: undefined, errors: [] }) as any;
        const output = captureConsole(["log"], () => {
            exportJson(schema, [], [[]]);
        });
        expect(output.log[0]).to.equal("");
        SchemaConvertor.prototype.validate = originalValidate;
    });

    it("handles missing node results without crashing", () => {
        const schema: any = {
            sdmType: 0,
            marks: [
                { markType: 1, markInd: 0, hasDecorator: () => false },
            ],
            hasDecorator: () => false,
        };
        const originalValidate = SchemaConvertor.prototype.validate;
        SchemaConvertor.prototype.validate = () => ({
            ok: true,
            value: {},
            errors: [],
        }) as any;
        try {
            const result = exportJson(schema, ["col"], [[123]]);
            expect(result[0]).to.deep.equal({ col: undefined });
        } finally {
            SchemaConvertor.prototype.validate = originalValidate;
        }
    });
});
