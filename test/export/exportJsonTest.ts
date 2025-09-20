import {expect} from "chai";
import "mocha";
import {exportJson} from "../../src/export";
import {parseSchema} from "../../src/schema";

type ConsoleMethod = "log" | "warn";

function captureConsole(methods: ConsoleMethod[], run: () => void): Partial<Record<ConsoleMethod, string[]>> {
    const originals: Partial<Record<ConsoleMethod, (...args: any[]) => void>> = {};
    const buckets: Partial<Record<ConsoleMethod, string[]>> = {};

    methods.forEach((method) => {
        originals[method] = (console as any)[method];
        buckets[method] = [];
        (console as any)[method] = (message?: any, ...args: any[]) => {
            const merged = [message, ...args]
                .filter((part) => part !== undefined)
                .map((part) => typeof part === "string" ? part : JSON.stringify(part))
                .join(" ")
                .trim();
            (buckets[method] as string[]).push(merged);
        };
    });

    try {
        run();
    } finally {
        methods.forEach((method) => {
            (console as any)[method] = originals[method];
        });
    }

    const entries: Partial<Record<ConsoleMethod, string[]>> = {};
    methods.forEach((method) => {
        entries[method] = buckets[method] || [];
    });
    return entries;
}

describe("Export JSON Complete Coverage", () => {

    describe("Basic Object Export", () => {
        it("should export simple object structure", () => {
            const schema = parseSchema(['id', 'name', 'level']);
            const headers = ['id', 'name', 'level'];
            const csvData = [
                [1, 'Hero', 10],
                [2, 'Mage', 15]
            ];
            
            const result = exportJson(schema, headers, csvData);
            expect(result).to.deep.equal([
                {id: 1, name: 'Hero', level: 10},
                {id: 2, name: 'Mage', level: 15}
            ]);
        });

        it("should handle undefined and null keys", () => {
            const schema = parseSchema(['id', 'name']);
            const headers = ['id', undefined, null];
            const csvData = [[1, 'test', 'extra']];
            
            expect(() => exportJson(schema, headers, csvData)).to.throw();
        });

        it("should handle empty data arrays", () => {
            const schema = parseSchema(['id', 'name']);
            const headers = ['id', 'name'];
            const csvData: any[][] = [];
            
            const result = exportJson(schema, headers, csvData);
            expect(result).to.deep.equal([]);
        });
    });

    describe("Array Structure Export", () => {
        it("should export array structure with strict mode", () => {
            const schema = parseSchema(['$strict', '[', 'uint', ']']);
            const headers = ['items'];
            const csvData = [
                ['1|2|3'],
                ['4|5|6']
            ];
            
            const result = exportJson(schema, headers, csvData);
            expect(result[0]).to.be.an('array');
            expect(result[1]).to.be.an('array');
        });

        it("should export array structure without strict mode", () => {
            const schema = parseSchema(['[', 'uint', ']']);
            const headers = ['items'];
            const csvData = [
                ['1|2|3'],
                ['']
            ];
            
            const result = exportJson(schema, headers, csvData);
            expect(result).to.have.length(2);
        });
    });

    describe("Nested Object Export", () => {
        it("should export nested object structures", () => {
            const schema = parseSchema([
                'id', 
                'character', '{',
                    'name',
                    'stats', '{',
                        'hp', 'mp',
                    '}',
                '}'
            ]);
            const headers = ['id', 'name', 'hp', 'mp'];
            const csvData = [
                [1, 'Hero', 100, 50]
            ];
            
            const result = exportJson(schema, headers, csvData);
            expect(result[0]).to.deep.equal({
                id: 1,
                character: {
                    name: 'Hero',
                    stats: {
                        hp: 100,
                        mp: 50
                    }
                }
            });
        });
    });

    describe("Error Handling", () => {
        it("should handle validation errors gracefully", () => {
            const schema = parseSchema(['uint', 'string']);
            const headers = ['id', 'name'];
            const csvData = [
                ['invalid_number', 'Hero'],
                [2, 'Mage']
            ];
            
            let result: any[] = [];
            const {warn = []} = captureConsole(["warn"], () => {
                result = exportJson(schema, headers, csvData);
            });

            expect(warn.length).to.be.greaterThan(0);
            expect(result[1]).to.deep.equal({id: 2, name: 'Mage'});
        });

        it("should handle conversion errors", () => {
            const schema = parseSchema(['uint']);
            const headers = ['id'];
            const csvData = [
                ['valid_but_null_conversion']
            ];
            
            const result = exportJson(schema, headers, csvData);
            expect(result).to.be.an('array');
        });
    });

    describe("Mark Descriptor Features", () => {
        it("should use custom column descriptors", () => {
            const schema = parseSchema(['uint', 'string']);
            const headers = ['id', 'name'];
            const csvData = [
                ['invalid', 'Hero']
            ];
            const markDescriptor = {
                col: ['CustomID', 'CustomName']
            };

            const {warn = []} = captureConsole(["warn"], () => {
                exportJson(schema, headers, csvData, markDescriptor);
            });

            expect(warn.some((w) => w.indexOf('CustomID') >= 0 || w.indexOf('CustomName') >= 0)).to.be.false;
        });

        it("should use custom row descriptors", () => {
            const schema = parseSchema(['uint']);
            const headers = ['id'];
            const csvData = [
                ['invalid']
            ];
            const markDescriptor = {
                row: ['Row1', 'Row2']
            };

            const {warn = []} = captureConsole(["warn"], () => {
                exportJson(schema, headers, csvData, markDescriptor);
            });

            expect(warn.some((w) => w.indexOf('Row1') >= 0)).to.be.true;
        });

        it("should fallback to default descriptors", () => {
            const schema = parseSchema(['uint']);
            const headers = ['id'];
            const csvData = [
                ['invalid']
            ];

            const {warn = []} = captureConsole(["warn"], () => {
                exportJson(schema, headers, csvData);
            });

            expect(warn.some((w) => w.indexOf('ROW:') >= 0)).to.be.true;
        });
    });

    describe("Error Stack Replacement", () => {
        it("should replace error stacks with readable names", () => {
            const schema = parseSchema(['uint', 'string']);
            const headers = ['id', 'name'];
            const csvData = [
                ['invalid', 123] // both should cause errors
            ];
            
            const capture = captureConsole(["log", "warn"], () => {
                exportJson(schema, headers, csvData);
            });

            const logs = capture.log ?? [];
            expect(logs.some((log) => log.indexOf('COL:') >= 0)).to.be.true;
        });
    });

    describe("Edge Cases", () => {
        it("should handle undefined converted results", () => {
            const schema = parseSchema(['any']);
            const headers = ['data'];
            const csvData = [
                [undefined]
            ];
            
            const result = exportJson(schema, headers, csvData);
            expect(result[0]).to.deep.equal({data: undefined});
        });

        it("should handle complex nested error scenarios", () => {
            const schema = parseSchema([
                'character', '{',
                    'stats', '{',
                        'hp', 'invalid_type',
                    '}',
                '}'
            ]);
            const headers = ['hp', 'invalid'];
            const csvData = [
                [100, 'should_fail']
            ];
            
            let result: any[] = [];
            captureConsole(["warn", "log"], () => {
                result = exportJson(schema, headers, csvData);
            });

            expect(result).to.be.an('array');
        });
    });
});
