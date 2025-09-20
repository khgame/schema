import {expect} from "chai";
import "mocha";
import {SDM, SDMType} from "../../src/schema/structureDescriptionMark";
import {MarkType, IMark} from "../../src/schema/utils";

describe("Structure Description Mark Complete Coverage", () => {

    describe("SDM Static Methods", () => {
        
        describe("checkBeginMark", () => {
            it("should identify object begin marks", () => {
                expect(SDM.checkBeginMark("{")).to.be.true;
                expect(SDM.checkBeginMark("  {  ")).to.be.true;
                expect(SDM.checkBeginMark("$ghost {")).to.be.true;
                expect(SDM.checkBeginMark("$STRICT{")).to.be.true;
            });

            it("should identify array begin marks", () => {
                expect(SDM.checkBeginMark("[")).to.be.true;
                expect(SDM.checkBeginMark("  [  ")).to.be.true;
                expect(SDM.checkBeginMark("$ghost [")).to.be.true;
                expect(SDM.checkBeginMark("$STRICT[")).to.be.true;
            });

            it("should reject non-begin marks", () => {
                expect(SDM.checkBeginMark("}")).to.be.false;
                expect(SDM.checkBeginMark("]")).to.be.false;
                expect(SDM.checkBeginMark("uint")).to.be.false;
                expect(SDM.checkBeginMark("string")).to.be.false;
                expect(SDM.checkBeginMark("")).to.be.false;
            });
        });

        describe("checkEndMark", () => {
            it("should identify object end marks", () => {
                expect(SDM.checkEndMark("}")).to.be.true;
                expect(SDM.checkEndMark("  }  ")).to.be.true;
            });

            it("should identify array end marks", () => {
                expect(SDM.checkEndMark("]")).to.be.true;
                expect(SDM.checkEndMark("  ]  ")).to.be.true;
            });

            it("should reject non-end marks", () => {
                expect(SDM.checkEndMark("{")).to.be.false;
                expect(SDM.checkEndMark("[")).to.be.false;
                expect(SDM.checkEndMark("uint")).to.be.false;
                expect(SDM.checkEndMark("string")).to.be.false;
                expect(SDM.checkEndMark("")).to.be.false;
            });
        });
    });

    describe("SDM.parse method", () => {
        
        describe("Simple object parsing", () => {
            it("should parse simple object structure", () => {
                const markStrs = ['uint', 'string', '}'];
                const sdm = SDM.parse(SDMType.Obj, [], markStrs, 0);
                
                expect(sdm.sdmType).to.equal(SDMType.Obj);
                expect(sdm.marks).to.have.length(2);
                expect(sdm.markIndBegin).to.equal(0);
                expect(sdm.markIndEnd).to.equal(2);
            });

            it("should parse object with decorators", () => {
                const markStrs = ['$ghost', '{', 'uint', 'string', '}'];
                const sdm = SDM.parse(SDMType.Obj, ['$ghost'], markStrs, 1);
                
                expect(sdm.mds).to.deep.equal(['$ghost']);
                expect(sdm.hasDecorator('$ghost')).to.be.true;
                expect(sdm.marks).to.have.length(1);
            });
        });

        describe("Simple array parsing", () => {
            it("should parse simple array structure", () => {
                const markStrs = ['uint', 'string', ']'];
                const sdm = SDM.parse(SDMType.Arr, [], markStrs, 0);
                
                expect(sdm.sdmType).to.equal(SDMType.Arr);
                expect(sdm.marks).to.have.length(2);
                expect(sdm.markIndBegin).to.equal(0);
                expect(sdm.markIndEnd).to.equal(2);
            });

            it("should parse array with decorators", () => {
                const markStrs = ['$strict', '[', 'uint', 'string', ']'];
                const sdm = SDM.parse(SDMType.Arr, ['$strict'], markStrs, 1);
                
                expect(sdm.mds).to.deep.equal(['$strict']);
                expect(sdm.hasDecorator('$strict')).to.be.true;
                expect(sdm.marks).to.have.length(1);
            });
        });

        describe("Nested structure parsing", () => {
            it("should parse nested objects", () => {
                const markStrs = [
                    'uint',
                    'nested', '{',
                        'string', 'float',
                    '}',
                    'boolean',
                    '}'
                ];
                const sdm = SDM.parse(SDMType.Obj, [], markStrs, 0);
                
                expect(sdm.marks).to.have.length(4); // uint, nested, SDM, boolean
                expect(sdm.marks[2].markType).to.equal(MarkType.SDM); // The SDM is at index 2
                
                const nestedSDM = sdm.marks[2] as SDM;
                expect(nestedSDM.sdmType).to.equal(SDMType.Obj);
                expect(nestedSDM.marks).to.have.length(2); // string, float
            });

            it("should parse nested arrays", () => {
                const markStrs = [
                    'uint',
                    'items', '[',
                        'string', 'float',
                    ']',
                    'boolean',
                    '}'
                ];
                const sdm = SDM.parse(SDMType.Obj, [], markStrs, 0);
                
                expect(sdm.marks).to.have.length(4); // uint, items, SDM, boolean
                expect(sdm.marks[2].markType).to.equal(MarkType.SDM); // The SDM is at index 2
                
                const nestedSDM = sdm.marks[2] as SDM;
                expect(nestedSDM.sdmType).to.equal(SDMType.Arr);
                expect(nestedSDM.marks).to.have.length(2); // string, float
            });

            it("should parse deeply nested structures", () => {
                const markStrs = [
                    'level1', '{',
                        'level2', '{',
                            'level3', '[',
                                'uint',
                            ']',
                        '}',
                    '}',
                    '}'
                ];
                const sdm = SDM.parse(SDMType.Obj, [], markStrs, 0);
                
                expect(sdm.marks).to.have.length(2);
                const level1 = sdm.marks[1] as SDM; // SDM is at index 1, not 0
                expect(level1.marks).to.have.length(2);
                const level2 = level1.marks[1] as SDM; // SDM should be at index 1
                expect(level2.marks).to.have.length(2);
                const level3 = level2.marks[1] as SDM;
                expect(level3.sdmType).to.equal(SDMType.Arr);
                expect(level3.marks).to.have.length(1);
            });
        });

        describe("Error handling", () => {
            it("should throw error for invalid start mark format", () => {
                const markStrs = ['$decorator invalid_content {', 'uint', '}'];
                
                expect(() => {
                    SDM.parse(SDMType.Obj, [], markStrs, 0);
                }).to.throw(/SDM Error.*should only contains mds and start quote/);
            });

            it("should handle empty structures", () => {
                const markStrs = ['}'];
                const sdm = SDM.parse(SDMType.Obj, [], markStrs, 0);
                
                expect(sdm.marks).to.have.length(0);
                expect(sdm.markIndEnd).to.equal(0);
            });

            it("should handle structures without explicit end mark", () => {
                const markStrs = ['uint', 'string'];
                const sdm = SDM.parse(SDMType.Obj, [], markStrs, 0);
                
                expect(sdm.marks).to.have.length(2);
                expect(sdm.markIndEnd).to.equal(2);
            });
        });

        describe("Context handling", () => {
            it("should pass context to TDM parsing", () => {
                const context = {
                    enums: {
                        TestEnum: { VALUE1: 1, VALUE2: 2 }
                    }
                };
                const markStrs = ['enum<TestEnum>', '}'];
                const sdm = SDM.parse(SDMType.Obj, [], markStrs, 0, context);
                
                expect(sdm.marks).to.have.length(1);
                expect(sdm.marks[0].markType).to.equal(MarkType.TDM);
            });
        });

        describe("Complex decorators", () => {
            it("should handle multiple decorators", () => {
                const markStrs = ['$ghost', '$strict', '{', 'uint', '}'];
                const sdm = SDM.parse(SDMType.Obj, ['$ghost', '$strict'], markStrs, 2);
                
                expect(sdm.mds).to.deep.equal(['$ghost', '$strict']);
                expect(sdm.hasDecorator('$ghost')).to.be.true;
                expect(sdm.hasDecorator('$strict')).to.be.true;
                expect(sdm.hasDecorator('$nonexistent')).to.be.false;
            });
        });

        describe("Real-world structures", () => {
            it("should handle game character structure", () => {
                const markStrs = [
                    'character', '{',
                        'id',
                        'name',
                        'stats', '{',
                            'hp', 'mp', 'attack', 'defense',
                        '}',
                        'inventory', '[',
                            'item', '{',
                                'id', 'quantity',
                            '}',
                        ']',
                    '}',
                    '}'
                ];
                
                const sdm = SDM.parse(SDMType.Obj, [], markStrs, 0);
                
                expect(sdm.marks).to.have.length(2); // Based on actual parsing behavior
                const character = sdm.marks[1] as SDM; // SDM is at index 1
                
                expect(character.marks).to.have.length(6); // Based on actual parsing behavior
                
                const stats = character.marks[3] as SDM; // stats SDM is at index 3
                expect(stats.sdmType).to.equal(SDMType.Obj);
                expect(stats.marks).to.have.length(4);
                
                const inventory = character.marks[5] as SDM; // inventory SDM is at index 5
                expect(inventory.sdmType).to.equal(SDMType.Arr);
                expect(inventory.marks).to.have.length(2); // TDM + SDM
                
                const item = inventory.marks[1] as SDM; // item SDM is at index 1
                expect(item.sdmType).to.equal(SDMType.Obj);
                expect(item.marks).to.have.length(2);
            });
        });

        describe("Edge cases", () => {
            it("should handle structures with only decorators", () => {
                const markStrs = ['}'];
                const sdm = SDM.parse(SDMType.Obj, ['$ghost', '$strict'], markStrs, 0);
                
                expect(sdm.marks).to.have.length(0);
                expect(sdm.mds).to.deep.equal(['$ghost', '$strict']);
            });

            it("should handle very deep nesting", () => {
                const markStrs = [
                    'l1', '{',
                        'l2', '{',
                            'l3', '{',
                                'l4', '{',
                                    'l5', '{',
                                        'value',
                                    '}',
                                '}',
                            '}',
                        '}',
                    '}',
                    '}'
                ];
                
                const sdm = SDM.parse(SDMType.Obj, [], markStrs, 0);
                
                // Navigate to the deepest level
                let current = sdm.marks[1] as SDM; // SDM is at index 1
                for (let i = 0; i < 4; i++) {
                    expect(current.marks).to.have.length(2); // Based on actual parsing behavior
                    current = current.marks[1] as SDM; // SDM is at index 1
                }
                expect(current.marks).to.have.length(1);
                expect(current.marks[0].markType).to.equal(MarkType.TDM);
            });
        });
    });

    describe("SDM Instance Properties and Methods", () => {
        
        describe("Constructor and properties", () => {
            it("should set all properties correctly", () => {
                const marks: IMark[] = []; // Empty for simplicity
                const mds = ['$test'];
                const sdm = new SDM(SDMType.Obj, mds, marks, 5, 10);
                
                expect(sdm.sdmType).to.equal(SDMType.Obj);
                expect(sdm.mds).to.deep.equal(['$test']);
                expect(sdm.marks).to.equal(marks);
                expect(sdm.markIndBegin).to.equal(5);
                expect(sdm.markIndEnd).to.equal(10);
                expect(sdm.markType).to.equal(MarkType.SDM);
            });

            it("should handle default markIndEnd", () => {
                const sdm = new SDM(SDMType.Arr, [], [], 0);
                expect(sdm.markIndEnd).to.equal(-1);
            });
        });

        describe("markInd getter", () => {
            it("should return markIndBegin", () => {
                const sdm = new SDM(SDMType.Obj, [], [], 42, 50);
                expect(sdm.markInd).to.equal(42);
                expect(sdm.markInd).to.equal(sdm.markIndBegin);
            });
        });

        describe("hasDecorator method", () => {
            it("should detect existing decorators", () => {
                const sdm = new SDM(SDMType.Obj, ['$ghost', '$strict'], [], 0, 5);
                
                expect(sdm.hasDecorator('$ghost')).to.be.true;
                expect(sdm.hasDecorator('$strict')).to.be.true;
            });

            it("should return false for non-existing decorators", () => {
                const sdm = new SDM(SDMType.Obj, ['$ghost'], [], 0, 5);
                
                expect(sdm.hasDecorator('$strict')).to.be.false;
                expect(sdm.hasDecorator('$nonexistent')).to.be.false;
                expect(sdm.hasDecorator('')).to.be.false;
            });

            it("should handle empty decorators array", () => {
                const sdm = new SDM(SDMType.Obj, [], [], 0, 5);
                
                expect(sdm.hasDecorator('$ghost')).to.be.false;
                expect(sdm.hasDecorator('$any')).to.be.false;
            });
        });

        describe("toSchemaStr method", () => {
            it("should generate object schema string without decorators", () => {
                const markStrs = ['uint', 'string', '}'];
                const sdm = SDM.parse(SDMType.Obj, [], markStrs, 0);
                
                const schemaStr = sdm.toSchemaStr();
                // toSchemaStr generates type structure, not field names
                expect(schemaStr).to.include('{');
                expect(schemaStr).to.include('}');
                expect(schemaStr).to.include('uint');
            });

            it("should generate array schema string without decorators", () => {
                const markStrs = ['uint', 'string', ']'];
                const sdm = SDM.parse(SDMType.Arr, [], markStrs, 0);
                
                const schemaStr = sdm.toSchemaStr();
                expect(schemaStr).to.include('[');
                expect(schemaStr).to.include(']');
                expect(schemaStr).to.include('uint');
                expect(schemaStr).to.include('string');
            });

            it("should include decorators in schema string", () => {
                const markStrs = ['uint', '}'];
                const sdm = SDM.parse(SDMType.Obj, ['$ghost', '$strict'], markStrs, 0);
                
                const schemaStr = sdm.toSchemaStr();
                expect(schemaStr).to.include('$ghost');
                expect(schemaStr).to.include('$strict');
            });

            it("should handle empty structures", () => {
                const sdm = new SDM(SDMType.Obj, [], [], 0, 1);
                
                const schemaStr = sdm.toSchemaStr();
                expect(schemaStr).to.include('{');
                expect(schemaStr).to.include('}');
            });

            it("should handle nested structures in schema string", () => {
                const markStrs = [
                    'outer', '{',
                        'inner', '[',
                            'uint',
                        ']',
                    '}',
                    '}'
                ];
                const sdm = SDM.parse(SDMType.Obj, [], markStrs, 0);
                
                const schemaStr = sdm.toSchemaStr();
                expect(schemaStr).to.include('{');
                expect(schemaStr).to.include('[');
                expect(schemaStr).to.include(']');
                expect(schemaStr).to.include('}');
            });
        });

        describe("toSchemaJson method", () => {
            it("should generate JSON representation without decorators", () => {
                const markStrs = ['uint', 'string', '}'];
                const sdm = SDM.parse(SDMType.Obj, [], markStrs, 0);
                
                const schemaJson = sdm.toSchemaJson();
                expect(schemaJson.mds).to.be.undefined;
                expect(schemaJson.fromTo).to.deep.equal([0, 2]);
                expect(schemaJson.children).to.have.length(2);
            });

            it("should include decorators in JSON when present", () => {
                const markStrs = ['uint', '}'];
                const sdm = SDM.parse(SDMType.Obj, ['$ghost'], markStrs, 0);
                
                const schemaJson = sdm.toSchemaJson();
                expect(schemaJson.mds).to.deep.equal(['$ghost']);
                expect(schemaJson.fromTo).to.deep.equal([0, 1]);
                expect(schemaJson.children).to.have.length(1);
            });

            it("should handle nested structures in JSON", () => {
                const markStrs = [
                    'nested', '{',
                        'uint',
                    '}',
                    '}'
                ];
                const sdm = SDM.parse(SDMType.Obj, [], markStrs, 0);
                
                const schemaJson = sdm.toSchemaJson();
                expect(schemaJson.children).to.have.length(2); // Based on actual parsing behavior
            });

            it("should handle empty structures in JSON", () => {
                const sdm = new SDM(SDMType.Arr, [], [], 5, 10);
                
                const schemaJson = sdm.toSchemaJson();
                expect(schemaJson.mds).to.be.undefined;
                expect(schemaJson.fromTo).to.deep.equal([5, 10]);
                expect(schemaJson.children).to.have.length(0);
            });
        });
    });
}); 